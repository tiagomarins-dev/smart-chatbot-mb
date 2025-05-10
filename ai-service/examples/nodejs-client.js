/**
 * Exemplo de cliente Node.js para o serviço de IA do Smart Chatbot MB
 * 
 * Este exemplo demonstra como consumir a API de IA a partir de uma aplicação Node.js,
 * incluindo a autenticação e envio de requisições para os diferentes endpoints.
 */

const axios = require('axios');

// Configurações
const API_URL = 'http://localhost:8000';
const API_KEY = 'dev_api_key_change_this'; // Substitua pela sua API Key

// Cliente HTTP configurado com os headers padrão
const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
  }
});

/**
 * Verifica a saúde do serviço de IA
 */
async function checkHealth() {
  try {
    const response = await client.get('/health');
    console.log('Status do serviço:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao verificar saúde do serviço:', error.message);
    throw error;
  }
}

/**
 * Gera uma mensagem usando o chatbot Ruth
 * 
 * @param {string} userMessage - Mensagem do usuário
 * @param {Array} conversationHistory - Histórico da conversa (opcional)
 */
async function generateRuthMessage(userMessage, conversationHistory = []) {
  try {
    const payload = {
      user_message: userMessage,
      conversation_history: conversationHistory
    };

    const response = await client.post('/v1/lead-messages/ruth', payload);
    console.log('Resposta da Ruth:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao gerar mensagem da Ruth:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.data);
    }
    throw error;
  }
}

/**
 * Gera uma mensagem personalizada para um lead com base em evento
 * 
 * @param {Object} leadInfo - Informações sobre o lead
 * @param {Object} eventContext - Contexto do evento que gerou a mensagem
 */
async function generateLeadMessage(leadInfo, eventContext) {
  try {
    const payload = {
      lead_info: leadInfo,
      event_context: eventContext
    };

    const response = await client.post('/v1/lead-messages/generate', payload);
    console.log('Mensagem gerada:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao gerar mensagem para lead:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.data);
    }
    throw error;
  }
}

/**
 * Função principal para demonstrar o uso da API
 */
async function main() {
  try {
    // Verificar a saúde do serviço
    await checkHealth();

    // Exemplo de geração de mensagem com o chatbot Ruth
    const ruthResponse = await generateRuthMessage(
      'Olá, gostaria de saber mais sobre o curso de redação para o ENEM'
    );

    // Exemplo de geração de mensagem para lead baseada em evento
    const leadResponse = await generateLeadMessage(
      {
        id: 'a5cd4a8d-1264-4752-b1a3-29e7e5740083',
        name: 'João Silva',
        sentiment_status: 'interessado',
        lead_score: 85,
        project_name: 'Residencial Aurora'
      },
      {
        event_type: 'visualizou_propriedade',
        event_data: {
          property_id: '123',
          property_name: 'Apartamento 101',
          viewed_at: '2023-06-01T14:30:00Z'
        },
        message_purpose: 'follow_up'
      }
    );

    console.log('Demonstração concluída com sucesso\!');
  } catch (error) {
    console.error('Erro durante a demonstração:', error.message);
  }
}

// Executar a demonstração
main();
EOF < /dev/null