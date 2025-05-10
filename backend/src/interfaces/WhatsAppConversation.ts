/**
 * Interface para representar uma conversa/mensagem de WhatsApp
 */
export interface WhatsAppConversation {
  id?: string;
  lead_id: string;
  message_id: string;
  phone_number: string;
  direction: 'incoming' | 'outgoing';
  content: string;
  media_type?: string;
  message_status?: string;
  message_timestamp: string;
  sentiment?: number;
  intent?: string;
  response_time_seconds?: number;
  entities?: Record<string, any>;
  tags?: string[];
  created_at?: string;
  analyzed_at?: string;
}

/**
 * Interface para criar uma nova conversa/mensagem de WhatsApp
 */
export interface CreateWhatsAppConversationInput {
  lead_id: string;
  message_id: string;
  phone_number: string;
  direction: 'incoming' | 'outgoing';
  content: string;
  media_type?: string;
  message_status?: string;
  message_timestamp: string;
}

/**
 * Interface para atualizar campos de análise de uma conversa
 */
export interface UpdateWhatsAppAnalysisInput {
  sentiment?: number;
  intent?: string;
  response_time_seconds?: number;
  entities?: Record<string, any>;
  tags?: string[];
}

/**
 * Interface para filtrar consultas de conversas
 */
export interface WhatsAppConversationFilter {
  lead_id?: string;
  phone_number?: string;
  direction?: 'incoming' | 'outgoing';
  start_date?: string;
  end_date?: string;
  sentiment_min?: number;
  sentiment_max?: number;
  intent?: string;
  content_search?: string;
}

/**
 * Interface para estatísticas de conversa de um lead
 */
export interface WhatsAppConversationStats {
  lead_id: string;
  total_messages: number;
  incoming_messages: number;
  outgoing_messages: number;
  avg_sentiment?: number;
  response_time_avg?: number;
  most_common_intent?: string;
  first_contact_date?: string;
  last_contact_date?: string;
}

/**
 * Interface para resposta de API de conversas
 */
export interface WhatsAppConversationResponse {
  conversations?: WhatsAppConversation[];
  conversation?: WhatsAppConversation;
  stats?: WhatsAppConversationStats;
  message?: string;
  error?: string;
  details?: Record<string, any>;
}