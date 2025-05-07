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

// Helper para obter a URL base da API WhatsApp
const getApiBaseUrl = (): string => {
  // Simplifique para apontar diretamente para o backend
  return 'http://localhost:9032/api/whatsapp';
};

export const whatsappApi = {
  /**
   * Get WhatsApp connection status
   */
  getStatus: async (): Promise<ApiResponse<WhatsAppStatus>> => {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/status`);
      const data = await response.json();
      return {
        success: true,
        data,
        statusCode: 200
      };
    } catch (error) {
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
      
      if (!response.ok) {
        return {
          success: false,
          error: 'QR Code não disponível',
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
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Erro ao conectar WhatsApp',
          statusCode: response.status
        };
      }
      
      return {
        success: true,
        data,
        statusCode: 200
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
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Erro ao desconectar WhatsApp',
          statusCode: response.status
        };
      }
      
      return {
        success: true,
        data,
        statusCode: 200
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
  sendMessage: async (number: string, message: string): Promise<ApiResponse<SendMessageResponse>> => {
    try {
      const apiUrl = getApiBaseUrl();
      const response = await fetch(`${apiUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ number, message })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Erro ao enviar mensagem',
          statusCode: response.status
        };
      }
      
      return {
        success: true,
        data,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao enviar mensagem',
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
  }
};

export default whatsappApi;