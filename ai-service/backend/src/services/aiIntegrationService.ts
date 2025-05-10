/**
 * Serviço para integração com a API de IA
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Configurações da API de IA
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || 'dev_api_key_change_this';
const AI_SERVICE_VERSION = process.env.AI_SERVICE_VERSION || 'v1';

// Cliente HTTP para a API de IA
const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': AI_SERVICE_API_KEY
  }
});

/**
 * Gera uma mensagem personalizada para um lead com base em um template
 */
const generateLeadMessage = async (lead: any, template: any) => {
  try {
    // Preparar contexto da mensagem
    const eventContext = {
      event_type: template.trigger_type,
      event_data: {
        template_id: template.id,
        template_name: template.name
      },
      message_purpose: template.description
    };

    // Extrair informações de sentimento, se disponíveis
    const sentimentStatus = lead.lead_sentiment_analysis?.status || 'indeterminado';
    const leadScore = lead.lead_sentiment_analysis?.lead_score || 50;

    // Preparar payload para a API de IA
    const payload = {
      lead_info: {
        id: lead.id,
        name: lead.name,
        sentiment_status: sentimentStatus,
        lead_score: leadScore,
        project_name: lead.project?.name
      },
      event_context: eventContext,
      personalization_hints: template.personalization_hints || []
    };

    // Chamar a API de IA
    const response = await aiClient.post(`/${AI_SERVICE_VERSION}/lead-messages/generate`, payload);
    return response.data.message;
  } catch (error) {
    console.error('Erro ao gerar mensagem personalizada:', error);
    throw new Error('Falha ao gerar mensagem personalizada');
  }
};

/**
 * Gera uma mensagem usando o chatbot Ruth
 */
const generateRuthMessage = async (userMessage: string, conversationHistory: any[] = []) => {
  try {
    const payload = {
      user_message: userMessage,
      conversation_history: conversationHistory.map(msg => ({
        direction: msg.from_lead ? 'incoming' : 'outgoing',
        content: msg.content,
        timestamp: msg.created_at
      }))
    };

    const response = await aiClient.post(`/${AI_SERVICE_VERSION}/lead-messages/ruth`, payload);
    return response.data.message;
  } catch (error) {
    console.error('Erro ao gerar mensagem da Ruth:', error);
    throw new Error('Falha ao gerar mensagem do chatbot Ruth');
  }
};

/**
 * Analisa o sentimento de uma mensagem
 */
const analyzeSentiment = async (text: string, context: any = {}) => {
  try {
    const payload = {
      text,
      context
    };

    const response = await aiClient.post(`/${AI_SERVICE_VERSION}/sentiment/analyze`, payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao analisar sentimento:', error);
    throw new Error('Falha ao analisar sentimento da mensagem');
  }
};

/**
 * Verifica o status da API de IA
 */
const checkHealth = async () => {
  try {
    const response = await aiClient.get('/health');
    return {
      online: true,
      status: response.data
    };
  } catch (error) {
    console.error('Erro ao verificar status da API de IA:', error);
    return {
      online: false,
      error: 'Falha ao conectar com o serviço de IA'
    };
  }
};

// Exportar as funções do serviço
export const aiIntegrationService = {
  generateLeadMessage,
  generateRuthMessage,
  analyzeSentiment,
  checkHealth
};
EOF < /dev/null