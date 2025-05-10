import axios from 'axios';
import { supabase } from './supabaseService';
import { logger } from '../utils/logger';

// Definir ambiente de configuração
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || 'development_key';
const API_VERSION = 'v1';

/**
 * Serviço para integração com o microserviço de IA
 */

/**
 * Interface para geração de mensagem
 */
interface MessageGenerationRequest {
  lead_id: string;
  template_id: string;
  event_type: string;
  event_data?: any;
}

/**
 * Interface para conversa WhatsApp
 */
interface WhatsAppMessage {
  direction: string;  // "incoming" ou "outgoing"
  content: string;
  created_at: string;
}

/**
 * Verifica se o serviço de IA está disponível
 */
export const checkAIServiceHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000
    });
    
    return response.status === 200;
  } catch (error) {
    logger.error(`AI service health check failed: ${error.message}`, { error });
    return false;
  }
};

/**
 * Gera uma mensagem automatizada para um lead com base em um evento e template
 */
export const generateEventMessage = async (
  messageRequest: MessageGenerationRequest
): Promise<any> => {
  try {
    const { lead_id, template_id, event_type, event_data } = messageRequest;
    
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
    
    // Buscar template de mensagem
    const { data: template, error: templateError } = await supabase
      .from('automated_message_templates')
      .select('*')
      .eq('id', template_id)
      .single();
    
    if (templateError) {
      logger.error(`Error fetching template: ${templateError.message}`, { templateError });
      throw templateError;
    }
    
    // Buscar histórico de conversas WhatsApp (últimas 5 mensagens)
    const { data: conversations, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (convError) {
      logger.error(`Error fetching conversations: ${convError.message}`, { convError });
      // Não lançar erro, apenas continuar sem histórico
    }
    
    // Preparar histórico de conversa para a API
    const conversationHistory = conversations 
      ? conversations.map((msg: any) => ({
          direction: msg.direction,
          content: msg.content,
          timestamp: msg.created_at
        })).reverse()
      : [];
    
    // Buscar projeto (para contexto adicional)
    const { data: projectRelation, error: projError } = await supabase
      .from('lead_project')
      .select('project_id')
      .eq('lead_id', lead_id)
      .order('captured_at', { ascending: false })
      .limit(1)
      .single();
    
    let projectName = '';
    if (!projError && projectRelation) {
      const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectRelation.project_id)
        .single();
      
      if (project) {
        projectName = project.name;
      }
    }
    
    // Preparar payload para a API de IA
    const payload = {
      lead_info: {
        id: lead.id,
        name: lead.name || lead.first_name || 'Cliente',
        sentiment_status: lead.sentiment_status || 'indeterminado',
        lead_score: lead.lead_score || 50,
        project_name: projectName
      },
      event_context: {
        event_type,
        event_data,
        message_purpose: template.instructions
      },
      conversation_history: conversationHistory,
      personalization_hints: []
    };
    
    // Adicionar dicas de personalização baseadas no status de sentimento
    if (lead.sentiment_status === 'achou caro') {
      payload.personalization_hints.push(
        'Enfatizar valor e benefícios',
        'Mencionar opções de pagamento ou financiamento',
        'Destacar diferenciais que justificam o investimento'
      );
    } else if (lead.sentiment_status === 'interessado') {
      payload.personalization_hints.push(
        'Tom mais direto e focado em conversão',
        'Oferecer próximos passos concretos',
        'Criar senso de urgência leve'
      );
    } else if (lead.sentiment_status === 'quer desconto') {
      payload.personalization_hints.push(
        'Focar em valor agregado em vez de redução de preço',
        'Sugerir benefícios exclusivos ou adicionais',
        'Destacar condições especiais limitadas'
      );
    }
    
    // Chamar API do serviço de IA
    const response = await axios.post(
      `${AI_SERVICE_URL}/${API_VERSION}/lead-messages/generate`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': AI_SERVICE_API_KEY
        },
        timeout: 30000 // 30 segundos
      }
    );
    
    // Registrar a mensagem gerada
    const { data: logEntry, error: logError } = await supabase
      .from('automated_message_logs')
      .insert({
        template_id,
        lead_id,
        message_content: response.data.message,
        event_data: event_data || {},
        lead_score_at_time: lead.lead_score,
        lead_sentiment_at_time: lead.sentiment_status
      })
      .select()
      .single();
    
    if (logError) {
      logger.error(`Error logging message: ${logError.message}`, { logError });
      throw logError;
    }
    
    // Atualizar lead com informação de última mensagem automatizada
    await supabase
      .from('leads')
      .update({
        last_automated_message_at: new Date().toISOString(),
        automated_messages_count: (lead.automated_messages_count || 0) + 1
      })
      .eq('id', lead_id);
    
    return {
      success: true,
      message: response.data.message,
      log_entry: logEntry,
      metadata: response.data.metadata
    };
  } catch (error) {
    logger.error(`Error generating event message: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Gera uma mensagem de reengajamento para um lead inativo
 */
export const generateInactivityMessage = async (
  leadId: string,
  daysInactive: number
): Promise<any> => {
  try {
    // Buscar informações do lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();
    
    if (leadError) {
      logger.error(`Error fetching lead: ${leadError.message}`, { leadError });
      throw leadError;
    }
    
    // Buscar último projeto associado ao lead
    const { data: projectRelation, error: projError } = await supabase
      .from('lead_project')
      .select('project_id')
      .eq('lead_id', leadId)
      .order('captured_at', { ascending: false })
      .limit(1)
      .single();
    
    if (projError) {
      logger.error(`Error fetching lead project: ${projError.message}`, { projError });
      throw projError;
    }
    
    // Buscar último evento do lead para contexto
    const { data: lastEvent, error: eventError } = await supabase
      .from('lead_events')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // Definir nível de inatividade
    let inactivityLevel = 'medium';
    if (daysInactive >= 30) {
      inactivityLevel = 'long';
    } else if (daysInactive <= 3) {
      inactivityLevel = 'short';
    }
    
    // Buscar histórico de conversas WhatsApp (últimas 3 mensagens)
    const { data: conversations } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(3);
    
    // Preparar histórico de conversa para a API
    const conversationHistory = conversations 
      ? conversations.map((msg: any) => ({
          direction: msg.direction,
          content: msg.content,
          timestamp: msg.created_at
        })).reverse()
      : [];
    
    // Buscar nome do projeto
    let projectName = '';
    if (projectRelation) {
      const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectRelation.project_id)
        .single();
      
      if (project) {
        projectName = project.name;
      }
    }
    
    // Preparar payload para a API de IA
    const payload = {
      lead_info: {
        id: lead.id,
        name: lead.name || lead.first_name || 'Cliente',
        sentiment_status: lead.sentiment_status || 'indeterminado',
        lead_score: lead.lead_score || 50,
        project_name: projectName
      },
      inactivity_context: {
        level: inactivityLevel,
        days_inactive: daysInactive,
        last_interaction: lastEvent 
          ? {
              event_type: lastEvent.event_type,
              created_at: lastEvent.created_at,
              event_data: lastEvent.event_data
            }
          : null
      },
      conversation_history: conversationHistory,
      personalization_hints: []
    };
    
    // Adicionar dicas de personalização baseadas no status de sentimento
    switch (lead.sentiment_status) {
      case 'interessado':
        payload.personalization_hints.push(
          'Lembrar de pontos específicos do interesse',
          'Oferecer informações novas ou recentes',
          'Criar urgência leve sem pressionar'
        );
        break;
      case 'achou caro':
        payload.personalization_hints.push(
          'Focar em valor e benefícios a longo prazo',
          'Mencionar opções de pagamento ou financiamento',
          'Compartilhar casos de sucesso ou depoimentos'
        );
        break;
      case 'compra futura':
        payload.personalization_hints.push(
          'Oferecer informações para planejamento',
          'Sugerir passos preliminares',
          'Manter engajamento sem pressionar por decisão imediata'
        );
        break;
      default:
        payload.personalization_hints.push(
          'Reestabelecer contato de forma leve',
          'Oferecer ajuda ou tirar dúvidas',
          'Compartilhar informação de valor'
        );
    }
    
    // Chamar API do serviço de IA
    const response = await axios.post(
      `${AI_SERVICE_URL}/${API_VERSION}/lead-messages/generate`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': AI_SERVICE_API_KEY
        },
        timeout: 30000 // 30 segundos
      }
    );
    
    // Registrar a mensagem como um log usando inatividade como "template"
    // Na prática, precisaríamos criar um template para inatividade ou usar null
    const { data: logEntry, error: logError } = await supabase
      .from('automated_message_logs')
      .insert({
        template_id: null, // Inatividade não tem template específico
        lead_id: leadId,
        message_content: response.data.message,
        event_data: {
          inactivity_level,
          days_inactive
        },
        lead_score_at_time: lead.lead_score,
        lead_sentiment_at_time: lead.sentiment_status
      })
      .select()
      .single();
    
    if (logError) {
      logger.error(`Error logging inactivity message: ${logError.message}`, { logError });
      throw logError;
    }
    
    // Atualizar lead com informação de última mensagem automatizada
    await supabase
      .from('leads')
      .update({
        last_automated_message_at: new Date().toISOString(),
        automated_messages_count: (lead.automated_messages_count || 0) + 1
      })
      .eq('id', leadId);
    
    return {
      success: true,
      message: response.data.message,
      log_entry: logEntry,
      metadata: response.data.metadata
    };
  } catch (error) {
    logger.error(`Error generating inactivity message: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Gera uma mensagem no estilo Ruth para um contato direto
 */
export const generateRuthMessage = async (
  userMessage: string,
  leadId: string,
  conversationHistory?: WhatsAppMessage[]
): Promise<any> => {
  try {
    // Preparar payload para a API de IA
    const payload = {
      user_message: userMessage,
      conversation_history: conversationHistory || [],
      chatbot_type: "ruth",
      model: "gpt-4-turbo"  // Modelo mais avançado para qualidade
    };
    
    // Chamar API do serviço de IA
    const response = await axios.post(
      `${AI_SERVICE_URL}/${API_VERSION}/lead-messages/ruth`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': AI_SERVICE_API_KEY
        },
        timeout: 30000 // 30 segundos
      }
    );
    
    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    logger.error(`Error generating Ruth message: ${error.message}`, { error });
    throw error;
  }
};

export default {
  checkAIServiceHealth,
  generateEventMessage,
  generateInactivityMessage,
  generateRuthMessage
};