import { Server as HttpServer } from 'http';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { RealtimeService } from './realtimeService';
import { verifyToken } from '../middleware/auth';
import { ApiResponse } from '../utils/responseUtils';

// Client connection type
interface Client {
  id: string;
  userId?: string;
  socket: WebSocket;
  subscriptions: Set<string>;
}

/**
 * Service for managing WebSocket connections
 */
export class WebSocketService {
  private static instance: WebSocketService;
  private wss: WebSocket.Server | null = null;
  private clients: Map<string, Client> = new Map();
  private realtimeService: RealtimeService;

  private constructor() {
    this.realtimeService = RealtimeService.getInstance();
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
   * Initialize WebSocket server
   */
  public initialize(server: HttpServer): void {
    if (this.wss) {
      console.warn('WebSocket server already initialized');
      return;
    }

    this.wss = new WebSocket.Server({ server });

    // Handle new connections
    this.wss.on('connection', this.handleConnection.bind(this));

    // Subscribe to all Supabase changes
    this.realtimeService.subscribeToAll();

    console.log('WebSocket server initialized');
  }

  /**
   * Handle a new client connection
   */
  private handleConnection(socket: WebSocket): void {
    const clientId = uuidv4();
    
    // Add client to map
    const client: Client = {
      id: clientId,
      socket,
      subscriptions: new Set()
    };
    
    this.clients.set(clientId, client);
    console.log(`Client connected: ${clientId}`);

    // Send welcome message
    this.sendToClient(client, {
      type: 'connection',
      clientId,
      message: 'Connected to WebSocket server'
    });

    // Handle messages
    socket.on('message', (data: WebSocket.Data) => {
      this.handleMessage(client, data);
    });

    // Handle disconnect
    socket.on('close', () => {
      this.handleDisconnect(clientId);
    });
  }

  /**
   * Handle client message
   */
  private async handleMessage(client: Client, data: WebSocket.Data): Promise<void> {
    try {
      const message = JSON.parse(data.toString());
      
      // Handle different message types
      switch (message.type) {
        case 'auth':
          await this.handleAuth(client, message.token);
          break;
          
        case 'subscribe':
          this.handleSubscribe(client, message.channel);
          break;
          
        case 'unsubscribe':
          this.handleUnsubscribe(client, message.channel);
          break;
          
        default:
          this.sendToClient(client, {
            type: 'error',
            message: 'Unknown message type'
          });
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      this.sendToClient(client, {
        type: 'error',
        message: 'Invalid message format'
      });
    }
  }

  /**
   * Handle authentication
   */
  private async handleAuth(client: Client, token: string): Promise<void> {
    try {
      const authResult = await verifyToken(token);
      
      if (authResult.authenticated && authResult.user_id) {
        client.userId = authResult.user_id;
        
        this.sendToClient(client, {
          type: 'auth',
          success: true,
          userId: authResult.user_id
        });
        
        console.log(`Client authenticated: ${client.id} (User: ${client.userId})`);
      } else {
        this.sendToClient(client, {
          type: 'auth',
          success: false,
          error: authResult.error || 'Authentication failed'
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      this.sendToClient(client, {
        type: 'auth',
        success: false,
        error: 'Authentication failed'
      });
    }
  }

  /**
   * Handle subscription request
   */
  private handleSubscribe(client: Client, channel: string): void {
    // Make sure client is authenticated
    if (!client.userId) {
      this.sendToClient(client, {
        type: 'error',
        message: 'Authentication required'
      });
      return;
    }
    
    // Add subscription
    client.subscriptions.add(channel);
    
    this.sendToClient(client, {
      type: 'subscribe',
      success: true,
      channel
    });
    
    console.log(`Client subscribed: ${client.id} to ${channel}`);
  }

  /**
   * Handle unsubscribe request
   */
  private handleUnsubscribe(client: Client, channel: string): void {
    client.subscriptions.delete(channel);
    
    this.sendToClient(client, {
      type: 'unsubscribe',
      success: true,
      channel
    });
    
    console.log(`Client unsubscribed: ${client.id} from ${channel}`);
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string): void {
    if (this.clients.has(clientId)) {
      this.clients.delete(clientId);
      console.log(`Client disconnected: ${clientId}`);
    }
  }

  /**
   * Send a message to a specific client
   */
  private sendToClient(client: Client, message: any): void {
    try {
      client.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Error sending message to client ${client.id}:`, error);
    }
  }

  /**
   * Broadcast a message to all authenticated clients with a specific subscription
   */
  public broadcast(channel: string, data: any, filterUserId?: string): void {
    for (const client of this.clients.values()) {
      // Skip unauthenticated clients or clients not subscribed to the channel
      if (!client.userId || !client.subscriptions.has(channel)) {
        continue;
      }
      
      // Skip if filterUserId is provided and doesn't match
      if (filterUserId && client.userId !== filterUserId) {
        continue;
      }
      
      this.sendToClient(client, {
        type: 'message',
        channel,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle a database change event from Supabase
   */
  public handleDatabaseChange(table: string, event: string, payload: any): void {
    // Create the channel name (e.g., companies:INSERT)
    const channel = `${table}:${event}`;
    
    // Broadcast to specific channel subscribers
    this.broadcast(channel, payload);
    
    // Also broadcast to wildcard subscribers for this table
    this.broadcast(`${table}:*`, payload);
  }
}

export default WebSocketService;