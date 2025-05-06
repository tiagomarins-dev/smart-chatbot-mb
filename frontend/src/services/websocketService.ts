/**
 * WebSocket message types
 */
export type WebSocketMessageType = 
  | 'connection'  // Initial connection established
  | 'auth'        // Authentication related
  | 'subscribe'   // Subscription related
  | 'unsubscribe' // Unsubscription related
  | 'message'     // Data message
  | 'error';      // Error message

/**
 * WebSocket message interface
 */
export interface WebSocketMessage {
  type: WebSocketMessageType;
  [key: string]: any;
}

/**
 * WebSocket event handler type
 */
export type WebSocketEventHandler = (data: any) => void;

/**
 * WebSocket service for real-time updates
 */
export class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private clientId: string | null = null;
  private isConnected = false;
  private isAuthenticated = false;
  private token: string | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private pendingSubscriptions: Set<string> = new Set();
  private messageHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  
  // Base WebSocket URL
  private wsUrl: string;

  /**
   * Private constructor for singleton
   */
  private constructor() {
    // Get WebSocket URL from environment or use default
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9032';
    this.wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws';
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.socket && this.isConnected) {
        resolve(true);
        return;
      }

      // Clear any existing reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      try {
        this.socket = new WebSocket(this.wsUrl);
        
        // Connection opened
        this.socket.addEventListener('open', () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Authenticate if token is available
          if (this.token) {
            this.authenticate(this.token);
          }
          
          resolve(true);
        });
        
        // Connection closed
        this.socket.addEventListener('close', (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.isAuthenticated = false;
          
          // Attempt to reconnect if not closed intentionally
          if (event.code !== 1000) {
            this.scheduleReconnect();
          }
        });
        
        // Connection error
        this.socket.addEventListener('error', (error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          this.isAuthenticated = false;
          
          resolve(false);
        });
        
        // Listen for messages
        this.socket.addEventListener('message', (event) => {
          this.handleMessage(event.data);
        });
      } catch (error) {
        console.error('WebSocket connection error:', error);
        resolve(false);
        
        // Schedule reconnect
        this.scheduleReconnect();
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnected');
      this.isConnected = false;
      this.isAuthenticated = false;
      this.socket = null;
      
      // Clear any pending reconnect
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    }
  }

  /**
   * Authenticate with JWT token
   */
  public authenticate(token: string): void {
    this.token = token;
    
    if (!this.isConnected) {
      // Connect first if not connected
      this.connect().then((connected) => {
        if (connected) {
          this.sendMessage({
            type: 'auth',
            token
          });
        }
      });
      return;
    }
    
    // Send authentication message
    this.sendMessage({
      type: 'auth',
      token
    });
  }

  /**
   * Subscribe to a channel
   */
  public subscribe(channel: string, handler: WebSocketEventHandler): void {
    // Add handler
    if (!this.messageHandlers.has(channel)) {
      this.messageHandlers.set(channel, new Set());
    }
    this.messageHandlers.get(channel)!.add(handler);
    
    // If not authenticated yet, add to pending subscriptions
    if (!this.isAuthenticated) {
      this.pendingSubscriptions.add(channel);
      return;
    }
    
    // Send subscribe message
    this.sendMessage({
      type: 'subscribe',
      channel
    });
  }

  /**
   * Unsubscribe from a channel
   */
  public unsubscribe(channel: string, handler?: WebSocketEventHandler): void {
    // If a specific handler is provided, remove only that handler
    if (handler && this.messageHandlers.has(channel)) {
      this.messageHandlers.get(channel)!.delete(handler);
      
      // If no handlers left, remove the channel
      if (this.messageHandlers.get(channel)!.size === 0) {
        this.messageHandlers.delete(channel);
        
        // Also remove from pending subscriptions
        this.pendingSubscriptions.delete(channel);
        
        // Send unsubscribe message if connected
        if (this.isConnected && this.isAuthenticated) {
          this.sendMessage({
            type: 'unsubscribe',
            channel
          });
        }
      }
    } 
    // If no handler provided, remove all handlers for the channel
    else if (this.messageHandlers.has(channel)) {
      this.messageHandlers.delete(channel);
      
      // Also remove from pending subscriptions
      this.pendingSubscriptions.delete(channel);
      
      // Send unsubscribe message if connected
      if (this.isConnected && this.isAuthenticated) {
        this.sendMessage({
          type: 'unsubscribe',
          channel
        });
      }
    }
  }

  /**
   * Process pending subscriptions after authentication
   */
  private processPendingSubscriptions(): void {
    if (!this.isAuthenticated || this.pendingSubscriptions.size === 0) {
      return;
    }
    
    // Subscribe to all pending channels
    for (const channel of this.pendingSubscriptions) {
      this.sendMessage({
        type: 'subscribe',
        channel
      });
    }
    
    // Clear pending subscriptions
    this.pendingSubscriptions.clear();
  }

  /**
   * Send a message to the WebSocket server
   */
  private sendMessage(message: WebSocketMessage): void {
    if (!this.socket || !this.isConnected) {
      console.warn('WebSocket not connected, cannot send message');
      return;
    }
    
    try {
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as WebSocketMessage;
      
      // Handle different message types
      switch (message.type) {
        case 'connection':
          this.handleConnectionMessage(message);
          break;
          
        case 'auth':
          this.handleAuthMessage(message);
          break;
          
        case 'subscribe':
          console.log('Subscribed to channel:', message.channel);
          break;
          
        case 'unsubscribe':
          console.log('Unsubscribed from channel:', message.channel);
          break;
          
        case 'message':
          this.handleDataMessage(message);
          break;
          
        case 'error':
          console.error('WebSocket error:', message.message);
          break;
          
        default:
          console.warn('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error, data);
    }
  }

  /**
   * Handle connection message
   */
  private handleConnectionMessage(message: WebSocketMessage): void {
    if (message.clientId) {
      this.clientId = message.clientId;
      console.log('WebSocket client ID:', this.clientId);
      
      // Authenticate if token is available
      if (this.token) {
        this.authenticate(this.token);
      }
    }
  }

  /**
   * Handle authentication message
   */
  private handleAuthMessage(message: WebSocketMessage): void {
    if (message.success) {
      this.isAuthenticated = true;
      console.log('WebSocket authenticated:', message.userId);
      
      // Process any pending subscriptions
      this.processPendingSubscriptions();
    } else {
      this.isAuthenticated = false;
      console.error('WebSocket authentication failed:', message.error);
    }
  }

  /**
   * Handle data message
   */
  private handleDataMessage(message: WebSocketMessage): void {
    const { channel, data } = message;
    
    // Notify handlers for this channel
    if (this.messageHandlers.has(channel)) {
      for (const handler of this.messageHandlers.get(channel)!) {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in handler for channel ${channel}:`, error);
        }
      }
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Maximum reconnect attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    
    // Exponential backoff with jitter
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1) * (0.9 + Math.random() * 0.2);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${Math.round(delay)}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect();
    }, delay);
  }
}

export default WebSocketService;