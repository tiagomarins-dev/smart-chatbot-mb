import { supabase } from './supabaseService';
import { logger } from '../utils/logger';

/**
 * Serviço para processamento de eventos e disparo de mensagens automatizadas
 */

/**
 * Interface para dados de evento
 */
interface EventData {
  event_type: string;
  lead_id: string;
  project_id?: string;
  event_data?: any;
  [key: string]: any;
}

/**
 * Processa um evento e verifica se há templates de mensagens associados
 */
export const processEvent = async (eventData: EventData): Promise<any> => {
  try {
    const { event_type, lead_id, project_id, event_data = {} } = eventData;
    
    if (!event_type || !lead_id) {
      throw new Error('Event type and lead ID are required');
    }
    
    logger.info(`Processing event ${event_type} for lead ${lead_id}`, { eventData });
    
    // Se project_id não for fornecido, buscar a partir do lead
    let effectiveProjectId = project_id;
    if (!effectiveProjectId) {
      effectiveProjectId = await getLeadProjectId(lead_id);
      
      if (!effectiveProjectId) {
        logger.warn(`No project associated with lead ${lead_id}`, { eventData });
        return { 
          success: false, 
          error: 'No project associated with lead' 
        };
      }
    }
    
    // Buscar templates de mensagens para este evento e projeto
    const { data: templates, error: templatesError } = await supabase
      .from('automated_message_templates')
      .select('*')
      .eq('project_id', effectiveProjectId)
      .eq('event_type', event_type)
      .eq('active', true);
    
    if (templatesError) {
      logger.error(`Error fetching templates: ${templatesError.message}`, { templatesError });
      throw templatesError;
    }
    
    if (!templates || templates.length === 0) {
      logger.info(`No templates found for event ${event_type} in project ${effectiveProjectId}`);
      return { 
        success: true, 
        message: 'No templates found for this event',
        templates_count: 0 
      };
    }
    
    // Buscar informações do lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single();
    
    if (leadError) {
      logger.error(`Error fetching lead: ${leadError.message}`, { leadError });
      throw leadError;
    }
    
    // Filtrar templates baseado em regras (score, sentimento, etc)
    const eligibleTemplates = templates.filter(template => {
      // Verificar restrições de lead score
      if (template.lead_score_min !== null && lead.lead_score < template.lead_score_min) {
        return false;
      }
      
      if (template.lead_score_max !== null && lead.lead_score > template.lead_score_max) {
        return false;
      }
      
      // Verificar status de sentimento
      if (
        template.applicable_sentiments && 
        template.applicable_sentiments.length > 0 && 
        !template.applicable_sentiments.includes(lead.sentiment_status)
      ) {
        return false;
      }
      
      return true;
    });
    
    if (eligibleTemplates.length === 0) {
      logger.info(`No eligible templates found for lead ${lead_id} with score ${lead.lead_score} and sentiment ${lead.sentiment_status}`);
      return { 
        success: true, 
        message: 'No eligible templates found for this lead',
        templates_count: templates.length,
        eligible_templates_count: 0
      };
    }
    
    // Para cada template elegível, verificar limite de envios e agendar mensagem
    const processedTemplates = await Promise.all(
      eligibleTemplates.map(async template => {
        try {
          // Verificar se já atingiu o limite de envios
          const { count, error: countError } = await supabase
            .from('automated_message_logs')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', template.id)
            .eq('lead_id', lead_id);
          
          if (countError) {
            logger.error(`Error counting messages: ${countError.message}`, { countError });
            throw countError;
          }
          
          if (count >= template.max_sends_per_lead) {
            return {
              template_id: template.id,
              eligible: false,
              reason: 'max_sends_reached'
            };
          }
          
          // Verificar contato não desejado
          if (lead.do_not_contact) {
            return {
              template_id: template.id,
              eligible: false,
              reason: 'do_not_contact'
            };
          }
          
          // Template é elegível para envio
          // Aqui será integrado com o serviço de IA para gerar a mensagem
          // Por enquanto, apenas registramos que o template está elegível
          return {
            template_id: template.id,
            template_name: template.name,
            eligible: true,
            delay_minutes: template.send_delay_minutes
          };
        } catch (error) {
          logger.error(`Error processing template ${template.id}: ${error}`);
          return {
            template_id: template.id,
            eligible: false,
            reason: 'error',
            error: error.message
          };
        }
      })
    );
    
    const eligibleCount = processedTemplates.filter(t => t.eligible).length;
    
    return {
      success: true,
      event_type,
      lead_id,
      project_id: effectiveProjectId,
      templates_processed: processedTemplates,
      eligible_templates_count: eligibleCount
    };
  } catch (error) {
    logger.error(`Error processing event: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Busca o ID do projeto associado a um lead
 */
const getLeadProjectId = async (leadId: string): Promise<string | null> => {
  try {
    // Buscar a relação lead-projeto mais recente
    const { data, error } = await supabase
      .from('lead_project')
      .select('project_id')
      .eq('lead_id', leadId)
      .order('captured_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhum projeto associado
        return null;
      }
      
      logger.error(`Error fetching lead project: ${error.message}`, { error });
      throw error;
    }
    
    return data?.project_id || null;
  } catch (error) {
    logger.error(`Error in getLeadProjectId: ${error.message}`, { error });
    return null;
  }
};

/**
 * Marca uma resposta recebida para uma mensagem automatizada
 */
export const markMessageResponse = async (messageId: string, responseData: any): Promise<any> => {
  try {
    // Buscar a mensagem original
    const { data: message, error: messageError } = await supabase
      .from('automated_message_logs')
      .select('*')
      .eq('id', messageId)
      .single();
    
    if (messageError) {
      if (messageError.code === 'PGRST116') {
        return { 
          success: false, 
          error: 'Message not found' 
        };
      }
      
      logger.error(`Error fetching message: ${messageError.message}`, { messageError });
      throw messageError;
    }
    
    // Calcular tempo de resposta em minutos
    const sentAt = new Date(message.sent_at).getTime();
    const responseTime = Math.floor((Date.now() - sentAt) / (1000 * 60));
    
    // Atualizar o registro com a resposta
    const { data, error } = await supabase
      .from('automated_message_logs')
      .update({
        response_received: true,
        response_time_minutes: responseTime,
        response_sentiment: responseData.sentiment || null
      })
      .eq('id', messageId)
      .select()
      .single();
    
    if (error) {
      logger.error(`Error updating message response: ${error.message}`, { error });
      throw error;
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    logger.error(`Error in markMessageResponse: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Busca leads inativos para envio de mensagens
 */
export const findInactiveLeads = async (daysThreshold: number = 7, limit: number = 50): Promise<any> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);
    const cutoffISO = cutoffDate.toISOString();
    
    // Buscar leads que não receberam mensagens recentemente
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        lead_project(project_id)
      `)
      .lt('last_automated_message_at', cutoffISO)
      .eq('do_not_contact', false)
      .not('sentiment_status', 'eq', 'sem interesse')
      .limit(limit);
    
    if (error) {
      logger.error(`Error finding inactive leads: ${error.message}`, { error });
      throw error;
    }
    
    return {
      success: true,
      leads: data,
      count: data.length
    };
  } catch (error) {
    logger.error(`Error in findInactiveLeads: ${error.message}`, { error });
    throw error;
  }
};

export default {
  processEvent,
  markMessageResponse,
  findInactiveLeads
};