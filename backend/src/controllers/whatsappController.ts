import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/responseUtils';
import { HttpStatus } from '../utils/responseUtils';
import axios from 'axios';
import { createLeadEvent } from '../services/leadEventsService';
import { executeQuery } from '../utils/dbUtils';

// Helper to get WhatsApp API base URL
const getWhatsAppApiUrl = (): string => {
  // Check if we're in production or development
  const isDev = process.env.NODE_ENV === 'development';
  const isDocker = process.env.RUNNING_IN_DOCKER === 'true';
  
  // In Docker, use the service name
  if (isDocker) {
    return 'http://whatsapp-api:3000/api';
  }
  
  // Default to localhost with the mapped port
  return 'http://localhost:9033/api';
};

/**
 * Get WhatsApp connection status
 */
export async function getStatus(req: Request, res: Response): Promise<void> {
  try {
    const apiUrl = getWhatsAppApiUrl();
    
    // Primeiro tentar o endpoint de verificação
    try {
      const verifyResponse = await axios.get(`${apiUrl}/verify-connection`);
      if (verifyResponse.data && verifyResponse.data.connected) {
        console.log('WhatsApp is connected according to verification');
        sendSuccess(res, {
          status: 'connected',
          timestamp: verifyResponse.data.timestamp,
          info: verifyResponse.data.info
        });
        return;
      }
    } catch (verifyError) {
      console.error('Error verifying connection, falling back to status endpoint:', verifyError);
    }
    
    // Se a verificação falhar, usar o endpoint de status normal
    const response = await axios.get(`${apiUrl}/status`);
    
    // A API já retorna os dados no formato que esperamos
    sendSuccess(res, response.data);
  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    // If connection error, it means the server is not ready
    sendSuccess(res, {
      status: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get QR code for authentication
 */
export async function getQRCode(req: Request, res: Response): Promise<void> {
  try {
    const apiUrl = getWhatsAppApiUrl();
    const response = await axios.get(`${apiUrl}/qrcode`);
    
    if (response.data && response.data.qrcode) {
      // QR code já está em formato de URL de dados (data URL)
      sendSuccess(res, { qrcode: response.data.qrcode });
    } else {
      sendError(res, 'QR code not available', HttpStatus.NOT_FOUND);
    }
  } catch (error) {
    console.error('Error getting QR code:', error);
    sendError(res, 'Failed to get QR code', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Connect to WhatsApp
 */
export async function connect(req: Request, res: Response): Promise<void> {
  try {
    const apiUrl = getWhatsAppApiUrl();
    const response = await axios.post(`${apiUrl}/connect`);
    
    sendSuccess(res, response.data);
  } catch (error) {
    console.error('Error connecting to WhatsApp:', error);
    sendError(res, 'Failed to connect to WhatsApp', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Disconnect from WhatsApp
 */
export async function disconnect(req: Request, res: Response): Promise<void> {
  try {
    const apiUrl = getWhatsAppApiUrl();
    const response = await axios.post(`${apiUrl}/disconnect`);
    
    sendSuccess(res, response.data);
  } catch (error) {
    console.error('Error disconnecting from WhatsApp:', error);
    sendError(res, 'Failed to disconnect from WhatsApp', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Send WhatsApp message
 */
export async function sendMessage(req: Request, res: Response): Promise<void> {
  try {
    const { number, message, lead_id } = req.body;
    
    if (!number || !message) {
      sendError(res, 'Phone number and message are required', HttpStatus.BAD_REQUEST);
      return;
    }
    
    const apiUrl = getWhatsAppApiUrl();
    const response = await axios.post(`${apiUrl}/send`, {
      number,
      message
    });
    
    // Se o envio foi bem-sucedido e temos o ID do lead, registrar o evento
    if (response.data.success && lead_id) {
      try {
        await createLeadEvent(
          lead_id,
          'whatsapp_message',
          {
            direction: 'outgoing',
            message: message,
            messageId: response.data.messageId || '',
            timestamp: new Date().toISOString()
          },
          'whatsapp'
        );
        console.log(`Recorded outgoing WhatsApp message event for lead ${lead_id}`);
      } catch (eventError) {
        console.error('Error recording lead event:', eventError);
        // Continuar mesmo se o registro do evento falhar
      }
    } else if (response.data.success && !lead_id) {
      // Se não temos o ID do lead, tentar encontrar com base no número de telefone
      try {
        const phoneNumber = number.replace('@c.us', '');
        const query = `
          SELECT id FROM leads 
          WHERE phone LIKE $1 OR phone LIKE $2 OR phone LIKE $3
        `;
        
        const result = await executeQuery(query, [
          `%${phoneNumber}%`, 
          `%${phoneNumber.substring(phoneNumber.length - 8)}%`,
          `%${phoneNumber.substring(phoneNumber.length - 9)}%`
        ]);
        
        if (result && result.length > 0) {
          const foundLeadId = result[0].id;
          await createLeadEvent(
            foundLeadId,
            'whatsapp_message',
            {
              direction: 'outgoing',
              message: message,
              messageId: response.data.messageId || '',
              timestamp: new Date().toISOString()
            },
            'whatsapp'
          );
          console.log(`Found and recorded outgoing WhatsApp message event for lead ${foundLeadId}`);
        }
      } catch (findError) {
        console.error('Error finding lead by phone number:', findError);
      }
    }
    
    sendSuccess(res, response.data);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    sendError(res, 'Failed to send WhatsApp message', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get all messages
 */
export async function getMessages(req: Request, res: Response): Promise<void> {
  try {
    const apiUrl = getWhatsAppApiUrl();
    const response = await axios.get(`${apiUrl}/message/list`);
    
    // Normalize the response to our expected format
    const normalizedMessages = {
      messages: response.data?.messages || {},
      total: response.data?.messages ? Object.keys(response.data.messages).length : 0
    };
    
    sendSuccess(res, normalizedMessages);
  } catch (error) {
    console.error('Error getting WhatsApp messages:', error);
    sendError(res, 'Failed to get WhatsApp messages', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get messages from a specific contact
 */
export async function getContactMessages(req: Request, res: Response): Promise<void> {
  try {
    const { number } = req.params;
    
    if (!number) {
      sendError(res, 'Phone number is required', HttpStatus.BAD_REQUEST);
      return;
    }
    
    // Format the phone number for the API
    let formattedNumber = number.replace(/\D/g, '');
    if (!formattedNumber.includes('@c.us')) {
      formattedNumber = `${formattedNumber}@c.us`;
    }
    
    const apiUrl = getWhatsAppApiUrl();
    const response = await axios.get(`${apiUrl}/message/list/${formattedNumber}`);
    
    // Normalize the response to our expected format
    const normalizedResponse = {
      number: number,
      messages: response.data?.messages || []
    };
    
    sendSuccess(res, normalizedResponse);
  } catch (error) {
    console.error('Error getting contact messages:', error);
    sendError(res, 'Failed to get contact messages', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Clear all messages
 */
export async function clearMessages(req: Request, res: Response): Promise<void> {
  try {
    // This API doesn't have a direct "clear all messages" endpoint
    // Instead, we'll respond with a simulated success
    sendSuccess(res, { 
      success: true,
      message: "Note: Chat history is managed by WhatsApp and cannot be cleared from the API" 
    });
  } catch (error) {
    console.error('Error clearing WhatsApp messages:', error);
    sendError(res, 'Failed to clear WhatsApp messages', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Handle webhook events from WhatsApp API
 */
export async function webhookHandler(req: Request, res: Response): Promise<void> {
  try {
    const eventData = req.body;
    console.log('Received WhatsApp webhook event:', JSON.stringify(eventData));
    
    // Process the webhook event data
    if (eventData && eventData.type) {
      await processWebhookEvent(eventData);
    }
    
    // Respond with success to acknowledge receipt
    sendSuccess(res, { success: true });
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    sendError(res, 'Failed to process webhook data', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Process a webhook event and record it to the database if applicable
 */
async function processWebhookEvent(eventData: any): Promise<void> {
  try {
    const { type, data } = eventData;
    
    switch (type) {
      case 'message':
        await processMessageEvent(data);
        break;
      case 'qr':
        // QR code events don't relate to specific leads
        console.log('QR Code event received');
        break;
      case 'connection':
        console.log('Connection event received:', data?.state);
        break;
      default:
        console.log('Unhandled event type:', type);
    }
  } catch (error) {
    console.error('Error in processWebhookEvent:', error);
  }
}

/**
 * Process a message event and record it to the lead_events table
 */
async function processMessageEvent(data: any): Promise<void> {
  try {
    if (!data || !data.from) {
      console.error('Invalid message data, missing required fields');
      return;
    }
    
    // Extract phone number (remove the @c.us suffix if present)
    const phoneNumber = data.from.replace('@c.us', '');
    
    // Try to find a lead with this phone number
    const query = `
      SELECT id FROM leads 
      WHERE phone LIKE $1 OR phone LIKE $2 OR phone LIKE $3
    `;
    
    // Try different phone number formats
    const result = await executeQuery(query, [
      `%${phoneNumber}%`, 
      `%${phoneNumber.substring(phoneNumber.length - 8)}%`,
      `%${phoneNumber.substring(phoneNumber.length - 9)}%`
    ]);
    
    if (result && result.length > 0) {
      const leadId = result[0].id;
      
      // Create a lead event record
      await createLeadEvent(
        leadId,
        'whatsapp_message',
        {
          direction: data.fromMe ? 'outgoing' : 'incoming',
          message: data.body || '',
          messageId: data.id || '',
          timestamp: data.timestamp || new Date().toISOString()
        },
        'whatsapp'
      );
      
      console.log(`Recorded WhatsApp message event for lead ${leadId}`);
    } else {
      console.log(`No lead found with phone number matching ${phoneNumber}`);
    }
  } catch (error) {
    console.error('Error processing message event:', error);
  }
}