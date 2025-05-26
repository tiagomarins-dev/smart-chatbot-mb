import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/responseUtils';
import { HttpStatus } from '../utils/responseUtils';
import { 
  getLeadEvents, 
  getLeadEventsByType, 
  getLeadEventsByOrigin, 
  getLeadEventsSummary,
  createLeadEvent 
} from '../services/leadEventsService';
import { executeQuery } from '../utils/dbUtils';
import { getSupabaseAdmin } from '../services/supabaseService';

/**
 * Get all events for a specific lead
 */
export async function getLeadEventsList(req: Request, res: Response): Promise<void> {
  try {
    const leadId = req.params.id;
    const eventType = req.query.type as string;
    const origin = req.query.origin as string;
    
    // Verificar se o usuário tem acesso a este lead
    const hasAccess = await verifyLeadAccess(req.user?.id, leadId);
    if (!hasAccess) {
      sendError(res, 'Unauthorized access to lead', HttpStatus.FORBIDDEN);
      return;
    }
    
    let events;
    
    // Filtrar por tipo e origem se fornecidos
    if (eventType && origin) {
      // Buscar eventos filtrando por tipo e origem
      const query = `
        SELECT * FROM lead_events
        WHERE lead_id = $1 AND event_type = $2 AND origin = $3
        ORDER BY created_at DESC
      `;
      events = await executeQuery(query, [leadId, eventType, origin]);
    } else if (eventType) {
      // Buscar eventos filtrando só por tipo
      events = await getLeadEventsByType(leadId, eventType);
    } else if (origin) {
      // Buscar eventos filtrando só por origem
      events = await getLeadEventsByOrigin(leadId, origin);
    } else {
      // Buscar todos os eventos do lead
      events = await getLeadEvents(leadId);
    }
    
    sendSuccess(res, {
      events,
      lead_id: leadId,
      filters: {
        type: eventType,
        origin: origin
      }
    });
  } catch (error) {
    console.error('Error getting lead events:', error);
    sendError(res, 'Failed to get lead events', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Get a summary of events for a specific lead
 */
export async function getLeadEventsSummaryController(req: Request, res: Response): Promise<void> {
  try {
    const leadId = req.params.id;
    
    // Verificar se o usuário tem acesso a este lead
    const hasAccess = await verifyLeadAccess(req.user?.id, leadId);
    if (!hasAccess) {
      sendError(res, 'Unauthorized access to lead', HttpStatus.FORBIDDEN);
      return;
    }
    
    // Buscar o resumo de eventos por tipo
    const eventsByType = await getLeadEventsSummary(leadId);
    
    // Buscar eventos agrupados por origem
    const query = `
      SELECT origin, COUNT(*) as count
      FROM lead_events
      WHERE lead_id = $1
      GROUP BY origin
      ORDER BY count DESC
    `;
    
    const originsResult = await executeQuery(query, [leadId]);
    
    // Converter o resultado para um registro de origem: contagem
    const eventsByOrigin: Record<string, number> = {};
    for (const row of originsResult) {
      const typedRow = row as { origin: string | null; count: string };
      eventsByOrigin[typedRow.origin || 'unknown'] = parseInt(typedRow.count);
    }
    
    // Buscar a data do último evento
    const lastEventQuery = `
      SELECT created_at FROM lead_events
      WHERE lead_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const lastEventResult = await executeQuery(lastEventQuery, [leadId]);
    const lastActivity = lastEventResult.length > 0 ? (lastEventResult[0] as { created_at: string }).created_at : null;
    
    // Contar o total de eventos
    const totalEvents = Object.values(eventsByType).reduce((sum, count) => sum + count, 0);
    
    sendSuccess(res, {
      lead_id: leadId,
      total_events: totalEvents,
      last_activity: lastActivity,
      events_by_type: eventsByType,
      events_by_origin: eventsByOrigin
    });
  } catch (error) {
    console.error('Error getting lead events summary:', error);
    sendError(res, 'Failed to get lead events summary', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Create a new event for a specific lead
 */
export async function createLeadEventController(req: Request, res: Response): Promise<void> {
  try {
    const leadId = req.params.id;
    const { event_type, event_data, origin } = req.body;
    
    if (!event_type || !event_data) {
      sendError(res, 'Event type and data are required', HttpStatus.BAD_REQUEST);
      return;
    }
    
    // Verificar se o usuário tem acesso a este lead
    const hasAccess = await verifyLeadAccess(req.user?.id, leadId);
    if (!hasAccess) {
      sendError(res, 'Unauthorized access to lead', HttpStatus.FORBIDDEN);
      return;
    }
    
    // Criar o evento
    const event = await createLeadEvent(leadId, event_type, event_data, origin);
    
    if (event) {
      // Analisar o lead automaticamente após criar o evento
      try {
        const analyzeUrl = `${process.env.AI_SERVICE_URL || 'http://ai-service:8050'}/v1/analyze-lead`;
        
        // Buscar dados do lead para análise
        const leadQuery = await executeQuery(
          'SELECT * FROM leads WHERE id = $1',
          [leadId]
        );
        
        if (leadQuery.length > 0) {
          const lead = leadQuery[0] as any;
          
          // Buscar conversas recentes
          const conversations = await executeQuery(
            'SELECT content, direction, created_at FROM whatsapp_conversations WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 20',
            [leadId]
          );
          
          // Buscar todos os eventos
          const events = await getLeadEvents(leadId);
          
          // Buscar projetos associados
          const leadProjects = await executeQuery(
            'SELECT * FROM lead_project WHERE lead_id = $1',
            [leadId]
          );
          
          // Chamar AI Service
          const response = await fetch(analyzeUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.AI_SERVICE_KEY || ''}`
            },
            body: JSON.stringify({
              lead_id: leadId,
              lead_name: lead.name,
              lead_email: lead.email,
              lead_phone: lead.phone,
              current_status: lead.status,
              conversations: conversations || [],
              events: events || [],
              projects: leadProjects || [],
              lead_created_at: lead.created_at,
              lead_updated_at: lead.updated_at,
              lead_notes: lead.notes
            })
          });
          
          if (response.ok) {
            const aiAnalysis = await response.json();
            
            // Atualizar lead com análise
            const supabase = getSupabaseAdmin();
            const { error: updateError } = await supabase
              .from('leads')
              .update({
                sentiment_status: aiAnalysis.sentiment_status,
                lead_score: aiAnalysis.lead_score,
                ai_analysis: aiAnalysis.ai_analysis,
                last_sentiment_update: new Date().toISOString()
              })
              .eq('id', leadId);
            
            if (updateError) {
              console.error(`Failed to update lead ${leadId} with analysis:`, updateError);
            }
            
            console.log(`Lead ${leadId} analyzed automatically after event creation`);
          } else {
            console.error(`Failed to analyze lead ${leadId}: AI service responded with ${response.status}`);
          }
        }
      } catch (analyzeError) {
        // Não falhar a criação do evento se a análise falhar
        console.error('Error analyzing lead after event creation:', analyzeError);
      }
      
      sendSuccess(res, { event });
    } else {
      sendError(res, 'Failed to create lead event', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  } catch (error) {
    console.error('Error creating lead event:', error);
    sendError(res, 'Failed to create lead event', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Verify if a user has access to a lead
 */
async function verifyLeadAccess(userId: string | undefined, leadId: string): Promise<boolean> {
  if (!userId || !leadId) {
    return false;
  }
  
  try {
    // Verificar se o lead pertence ao usuário
    const userLeadsQuery = `
      SELECT 1 FROM leads
      WHERE id = $1 AND user_id = $2
    `;
    
    const userLeadsResult = await executeQuery(userLeadsQuery, [leadId, userId]);
    if (userLeadsResult.length > 0) {
      return true;
    }
    
    // Verificar se o lead está em um projeto de uma empresa onde o usuário é membro
    const companyAccessQuery = `
      SELECT 1 FROM leads l
      JOIN lead_project lp ON l.id = lp.lead_id
      JOIN projects p ON lp.project_id = p.id
      JOIN company_users cu ON p.company_id = cu.company_id
      WHERE l.id = $1 AND cu.user_id = $2
    `;
    
    const companyAccessResult = await executeQuery(companyAccessQuery, [leadId, userId]);
    return companyAccessResult.length > 0;
  } catch (error) {
    console.error('Error verifying lead access:', error);
    return false;
  }
}