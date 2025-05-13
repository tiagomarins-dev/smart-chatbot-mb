import apiClient from './client';
import { ApiResponse } from '../interfaces';

interface WhatsAppStatus {
  status: 'disconnected' | 'initializing' | 'qr_received' | 'authenticated' | 'connected' | 'error';
  timestamp: string;
}

interface QRCodeResponse {
  qrcode: string;
}

interface ConnectResponse {
  status: string;
}

interface SendMessageResponse {
  success: boolean;
  to: string;
  status: string;
}

interface Message {
  body: string;
  timestamp: string;
  id: string;
  fromMe: boolean;
  fromOtherDevice?: boolean;
}

interface MessagesResponse {
  messages: Record<string, Message[]>;
  total: number;
}

interface ContactMessagesResponse {
  number: string;
  messages: Message[];
}

// API WhatsApp - sempre apontando para a porta 9029
const getApiBaseUrl = (): string => {
  // Sempre apontar para localhost:9029, independente do ambiente
  return 'http://localhost:9029/api/whatsapp';
};

interface PhoneResponse {
  success: boolean;
  phoneNumber: string;
}

interface MockAuthResponse {
  success: boolean;
  message: string;
}

export const whatsappApi = {
  /**
   * Get WhatsApp connection status
   */
  getStatus: async (): Promise<ApiResponse<WhatsAppStatus>> => {
    try {
      const apiUrl = getApiBaseUrl();
      console.log(`Fetching WhatsApp status from: ${apiUrl}/status`);
      const response = await fetch(`${apiUrl}/status`);
      const responseText = await response.text();
      console.log('Status API raw response:', responseText);
      
      let json;
      try {
        json = JSON.parse(responseText);
        console.log('Parsed WhatsApp status response:', json);
      } catch (parseError) {
        console.error('Error parsing WhatsApp status response:', parseError);
        return {
          success: false,
          error: 'Erro ao processar resposta do status do WhatsApp',
          statusCode: response.status
        };
      }
      
      if (!response.ok) {
        return {
          success: false,
          error: json.error || 'Erro ao buscar status do WhatsApp',
          statusCode: response.status
        };
      }
      
      // Extrair dados da resposta seguindo a estrutura do backend
      // Nota: A API retorna diretamente {status, qrCode, phoneNumber} sem estar dentro de um campo "data"
      const statusData: WhatsAppStatus = {
        status: json.status || 'disconnected',
        authenticated: json.status === 'connected',
        phoneNumber: json.phoneNumber || null,
        timestamp: json.timestamp || new Date().toISOString()
      };
      
      console.log('Extracted WhatsApp status data:', statusData);
      
      return {
        success: true,
        data: statusData,
        statusCode: json.statusCode || 200
      };
    } catch (error) {
      console.error('Error fetching WhatsApp status:', error);
      return {
        success: false,
        error: 'Erro ao buscar status do WhatsApp',
        statusCode: 500
      };
    }
  },

  /**
   * Get QR code for authentication
   */
  getQRCode: async (): Promise<ApiResponse<QRCodeResponse>> => {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/qrcode`);
      
      const json = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: json.error || 'QR Code não disponível',
          statusCode: response.status
        };
      }
      return {
        success: true,
        data: json.data as QRCodeResponse,
        statusCode: json.statusCode
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao buscar QR code',
        statusCode: 500
      };
    }
  },

  /**
   * Connect to WhatsApp
   */
  connect: async (): Promise<ApiResponse<ConnectResponse>> => {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const json = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: json.error || 'Erro ao conectar WhatsApp',
          statusCode: response.status
        };
      }
      return {
        success: true,
        data: json.data as ConnectResponse,
        statusCode: json.statusCode
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao conectar WhatsApp',
        statusCode: 500
      };
    }
  },

  /**
   * Disconnect from WhatsApp
   */
  disconnect: async (): Promise<ApiResponse<{ status: string }>> => {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const json = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: json.error || 'Erro ao desconectar WhatsApp',
          statusCode: response.status
        };
      }
      return {
        success: true,
        data: json.data as { status: string },
        statusCode: json.statusCode
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao desconectar WhatsApp',
        statusCode: 500
      };
    }
  },

  /**
   * Send WhatsApp message
   */
  sendMessage: async (number: string, message: string, lead_id?: string): Promise<ApiResponse<SendMessageResponse>> => {
    try {
      console.log('Sending WhatsApp message:', { number, messageLength: message.length, lead_id });
      
      const apiUrl = getApiBaseUrl();
      console.log('Using API URL:', apiUrl);
      
      const payload = { 
        phoneNumber: number, 
        message,
        lead_id // Include lead_id if available
      };
      
      console.log('Message payload (truncated):', {
        ...payload,
        message: message.length > 50 ? message.substring(0, 50) + '...' : message
      });
      
      console.log('Sending POST request to:', `${apiUrl}/send`);
      const response = await fetch(`${apiUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Response status:', response.status);
      
      // Get response data
      let data;
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (parseError) {
        console.error('Error parsing response JSON:', parseError);
        return {
          success: false,
          error: `Invalid JSON response: ${responseText.substring(0, 100)}`,
          statusCode: response.status
        };
      }
      
      if (!response.ok) {
        console.error('Request failed:', data);
        return {
          success: false,
          error: data.error || `Erro ao enviar mensagem (${response.status})`,
          statusCode: response.status
        };
      }
      
      return {
        success: true,
        data: data.data || data, // Handle both formats
        statusCode: response.status
      };
    } catch (error) {
      console.error('Exception in sendMessage:', error);
      return {
        success: false,
        error: error instanceof Error ? `Erro: ${error.message}` : 'Erro ao enviar mensagem',
        statusCode: 500
      };
    }
  },

  /**
   * Get all messages from all contacts
   */
  getMessages: async (): Promise<ApiResponse<MessagesResponse>> => {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/messages`);
      
      if (!response.ok) {
        return {
          success: false,
          error: 'Erro ao buscar mensagens',
          statusCode: response.status
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao buscar mensagens',
        statusCode: 500
      };
    }
  },

  /**
   * Get messages from a specific contact
   */
  getContactMessages: async (number: string): Promise<ApiResponse<ContactMessagesResponse>> => {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/messages/${number}`);
      
      if (!response.ok) {
        return {
          success: false,
          error: 'Erro ao buscar mensagens do contato',
          statusCode: response.status
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao buscar mensagens do contato',
        statusCode: 500
      };
    }
  },

  /**
   * Clear all messages
   */
  clearMessages: async (): Promise<ApiResponse<{ success: boolean }>> => {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/messages`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: 'Erro ao limpar mensagens',
          statusCode: response.status
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao limpar mensagens',
        statusCode: 500
      };
    }
  },

  /**
   * Get QR code in plain text format
   */
  getQRCodePlain: async (): Promise<ApiResponse<string>> => {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/qrcode/plain`);
      
      if (!response.ok) {
        return {
          success: false,
          error: 'QR Code não disponível em formato de texto',
          statusCode: response.status
        };
      }
      
      const text = await response.text();
      return {
        success: true,
        data: text,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao buscar QR code em texto',
        statusCode: 500
      };
    }
  },

  /**
   * Get connected phone number
   */
  getPhone: async (): Promise<ApiResponse<PhoneResponse>> => {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/phone`);
      
      if (!response.ok) {
        return {
          success: false,
          error: 'Telefone não disponível ou desconectado',
          statusCode: response.status
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data.data,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao buscar telefone',
        statusCode: 500
      };
    }
  },

  /**
   * Mock authenticate (for testing without scanning QR)
   */
  mockAuthenticate: async (): Promise<ApiResponse<MockAuthResponse>> => {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/mock/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        return {
          success: false,
          error: 'Erro ao simular autenticação',
          statusCode: response.status
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data.data,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao simular autenticação',
        statusCode: 500
      };
    }
  }
};

export default whatsappApi;