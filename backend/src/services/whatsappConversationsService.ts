import { getSupabaseAdmin } from './supabaseService';
import { 
  WhatsAppConversation, 
  CreateWhatsAppConversationInput,
  UpdateWhatsAppAnalysisInput,
  WhatsAppConversationFilter,
  WhatsAppConversationStats
} from '../interfaces';

/**
 * Cria um novo registro de conversa de WhatsApp
 */
export async function createWhatsAppConversation(
  data: CreateWhatsAppConversationInput
): Promise<WhatsAppConversation | null> {
  try {
    const supabase = getSupabaseAdmin();
    
    // Verifica se já existe um registro com o mesmo message_id para evitar duplicatas
    const { data: existingData, error: checkError } = await supabase
      .from('whatsapp_conversations')
      .select('id')
      .eq('message_id', data.message_id)
      .eq('lead_id', data.lead_id)
      .maybeSingle();
    
    if (checkError) {
      console.error('Erro ao verificar mensagem existente:', checkError);
    }
    
    // Se a mensagem já existir, retorne sem criar uma nova
    if (existingData) {
      console.log(`Mensagem ${data.message_id} já existe, ignorando duplicata`);
      return null;
    }
    
    // Insere o novo registro
    const { data: newConversation, error } = await supabase
      .from('whatsapp_conversations')
      .insert(data)
      .select('*')
      .single();
    
    if (error) {
      console.error('Erro ao criar conversa WhatsApp:', error);
      return null;
    }
    
    return newConversation as WhatsAppConversation;
  } catch (error) {
    console.error('Exceção ao criar conversa WhatsApp:', error);
    return null;
  }
}

/**
 * Atualiza os dados de análise de uma conversa específica
 */
export async function updateWhatsAppConversationAnalysis(
  conversationId: string,
  analysisData: UpdateWhatsAppAnalysisInput
): Promise<WhatsAppConversation | null> {
  try {
    const supabase = getSupabaseAdmin();
    
    const updateData = {
      ...analysisData,
      analyzed_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('whatsapp_conversations')
      .update(updateData)
      .eq('id', conversationId)
      .select('*')
      .single();
    
    if (error) {
      console.error('Erro ao atualizar análise de conversa:', error);
      return null;
    }
    
    return data as WhatsAppConversation;
  } catch (error) {
    console.error('Exceção ao atualizar análise de conversa:', error);
    return null;
  }
}

/**
 * Busca conversas com filtros
 */
export async function getWhatsAppConversations(
  filter: WhatsAppConversationFilter
): Promise<WhatsAppConversation[]> {
  try {
    const supabase = getSupabaseAdmin();
    
    let query = supabase
      .from('whatsapp_conversations')
      .select('*');
    
    // Aplicar filtros
    if (filter.lead_id) {
      query = query.eq('lead_id', filter.lead_id);
    }
    
    if (filter.phone_number) {
      query = query.eq('phone_number', filter.phone_number);
    }
    
    if (filter.direction) {
      query = query.eq('direction', filter.direction);
    }
    
    if (filter.start_date) {
      query = query.gte('message_timestamp', filter.start_date);
    }
    
    if (filter.end_date) {
      query = query.lte('message_timestamp', filter.end_date);
    }
    
    if (filter.sentiment_min !== undefined) {
      query = query.gte('sentiment', filter.sentiment_min);
    }
    
    if (filter.sentiment_max !== undefined) {
      query = query.lte('sentiment', filter.sentiment_max);
    }
    
    if (filter.intent) {
      query = query.eq('intent', filter.intent);
    }
    
    if (filter.content_search) {
      // Busca de texto completo usando o vetor de texto gerado
      query = query.textSearch('content_tsv', filter.content_search);
    }
    
    // Ordenar por timestamp
    query = query.order('message_timestamp', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Erro ao buscar conversas WhatsApp:', error);
      return [];
    }
    
    return data as WhatsAppConversation[];
  } catch (error) {
    console.error('Exceção ao buscar conversas WhatsApp:', error);
    return [];
  }
}

/**
 * Obtém uma conversa específica por ID
 */
export async function getWhatsAppConversationById(id: string): Promise<WhatsAppConversation | null> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar conversa por ID:', error);
      return null;
    }
    
    return data as WhatsAppConversation;
  } catch (error) {
    console.error('Exceção ao buscar conversa por ID:', error);
    return null;
  }
}

/**
 * Obtém estatísticas de conversas para um lead específico
 */
export async function getWhatsAppConversationStats(leadId: string): Promise<WhatsAppConversationStats | null> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .rpc('get_lead_whatsapp_stats', { lead_id_param: leadId })
      .single();
    
    if (error) {
      console.error('Erro ao buscar estatísticas de conversa:', error);
      return null;
    }
    
    return {
      lead_id: leadId,
      ...data
    } as WhatsAppConversationStats;
  } catch (error) {
    console.error('Exceção ao buscar estatísticas de conversa:', error);
    return null;
  }
}

/**
 * Obtém a linha do tempo de conversas de um lead
 */
export async function getWhatsAppConversationTimeline(leadId: string): Promise<WhatsAppConversation[]> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .rpc('get_lead_whatsapp_timeline', { lead_id_param: leadId });
    
    if (error) {
      console.error('Erro ao buscar linha do tempo de conversas:', error);
      return [];
    }
    
    return data as WhatsAppConversation[];
  } catch (error) {
    console.error('Exceção ao buscar linha do tempo de conversas:', error);
    return [];
  }
}

/**
 * Calcula o tempo de resposta para uma mensagem específica
 * Útil para gerar métricas de atendimento
 */
export async function calculateResponseTime(
  leadId: string, 
  messageId: string, 
  messageTimestamp: string
): Promise<number | null> {
  try {
    const supabase = getSupabaseAdmin();
    
    // Buscar a última mensagem do cliente antes desta resposta
    const { data: previousMessages, error } = await supabase
      .from('whatsapp_conversations')
      .select('message_timestamp')
      .eq('lead_id', leadId)
      .eq('direction', 'incoming')
      .lt('message_timestamp', messageTimestamp)
      .order('message_timestamp', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Erro ao calcular tempo de resposta:', error);
      return null;
    }
    
    if (!previousMessages || previousMessages.length === 0) {
      // Não há mensagens anteriores para calcular o tempo de resposta
      return null;
    }
    
    // Calcular a diferença em segundos
    const previousTimestamp = new Date(previousMessages[0].message_timestamp).getTime();
    const currentTimestamp = new Date(messageTimestamp).getTime();
    const responseTimeSeconds = Math.floor((currentTimestamp - previousTimestamp) / 1000);
    
    // Atualizar o registro com o tempo de resposta
    const { error: updateError } = await supabase
      .from('whatsapp_conversations')
      .update({ response_time_seconds: responseTimeSeconds })
      .eq('message_id', messageId)
      .eq('lead_id', leadId);
    
    if (updateError) {
      console.error('Erro ao atualizar tempo de resposta:', updateError);
    }
    
    return responseTimeSeconds;
  } catch (error) {
    console.error('Exceção ao calcular tempo de resposta:', error);
    return null;
  }
}