import { Request, Response } from 'express';
import { sendError, sendSuccess, HttpStatus } from '../utils/responseUtils';
import {
  getWhatsAppConversations,
  getWhatsAppConversationById,
  getWhatsAppConversationStats,
  getWhatsAppConversationTimeline,
  updateWhatsAppConversationAnalysis
} from '../services/whatsappConversationsService';

/**
 * Get conversations for a specific lead
 */
export async function getLeadConversations(req: Request, res: Response): Promise<void> {
  try {
    const { leadId } = req.params;
    const { startDate, endDate, direction, content } = req.query;
    
    if (!leadId) {
      sendError(res, 'Lead ID is required', HttpStatus.BAD_REQUEST);
      return;
    }
    
    const filter = {
      lead_id: leadId,
      start_date: startDate as string,
      end_date: endDate as string,
      direction: direction as 'incoming' | 'outgoing',
      content_search: content as string
    };
    
    const conversations = await getWhatsAppConversations(filter);
    
    sendSuccess(res, {
      conversations,
      lead_id: leadId,
      filters: {
        startDate,
        endDate,
        direction,
        content
      }
    });
  } catch (error: any) {
    console.error('Error getting lead conversations:', error.message);
    sendError(res, 'Failed to get lead conversations', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get a specific conversation by ID
 */
export async function getConversationById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    if (!id) {
      sendError(res, 'Conversation ID is required', HttpStatus.BAD_REQUEST);
      return;
    }
    
    const conversation = await getWhatsAppConversationById(id);
    
    if (!conversation) {
      sendError(res, 'Conversation not found', HttpStatus.NOT_FOUND);
      return;
    }
    
    sendSuccess(res, { conversation });
  } catch (error: any) {
    console.error('Error getting conversation by ID:', error.message);
    sendError(res, 'Failed to get conversation', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get conversation statistics for a lead
 */
export async function getLeadConversationStats(req: Request, res: Response): Promise<void> {
  try {
    const { leadId } = req.params;
    
    if (!leadId) {
      sendError(res, 'Lead ID is required', HttpStatus.BAD_REQUEST);
      return;
    }
    
    const stats = await getWhatsAppConversationStats(leadId);
    
    if (!stats) {
      sendError(res, 'Failed to get conversation statistics', HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }
    
    sendSuccess(res, { stats });
  } catch (error: any) {
    console.error('Error getting conversation stats:', error.message);
    sendError(res, 'Failed to get conversation statistics', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get conversation timeline for a lead
 */
export async function getLeadConversationTimeline(req: Request, res: Response): Promise<void> {
  try {
    const { leadId } = req.params;
    
    if (!leadId) {
      sendError(res, 'Lead ID is required', HttpStatus.BAD_REQUEST);
      return;
    }
    
    const timeline = await getWhatsAppConversationTimeline(leadId);
    
    sendSuccess(res, {
      timeline,
      lead_id: leadId
    });
  } catch (error: any) {
    console.error('Error getting conversation timeline:', error.message);
    sendError(res, 'Failed to get conversation timeline', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Update conversation analysis data
 */
export async function updateConversationAnalysis(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { sentiment, intent, tags, entities } = req.body;
    
    if (!id) {
      sendError(res, 'Conversation ID is required', HttpStatus.BAD_REQUEST);
      return;
    }
    
    // Verificar se há dados de análise para atualizar
    if (sentiment === undefined && !intent && !tags && !entities) {
      sendError(res, 'At least one analysis field is required', HttpStatus.BAD_REQUEST);
      return;
    }
    
    const analysisData = {
      sentiment: sentiment !== undefined ? parseFloat(sentiment) : undefined,
      intent,
      tags,
      entities
    };
    
    const updatedConversation = await updateWhatsAppConversationAnalysis(id, analysisData);
    
    if (!updatedConversation) {
      sendError(res, 'Failed to update conversation analysis', HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }
    
    sendSuccess(res, {
      conversation: updatedConversation,
      message: 'Análise da conversa atualizada com sucesso'
    });
  } catch (error: any) {
    console.error('Error updating conversation analysis:', error.message);
    sendError(res, 'Failed to update conversation analysis', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}