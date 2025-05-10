/**
 * Script para inserir mensagens de teste com diferentes sentimentos
 * para verificar a detecção dos status de sentimento
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Inicializar cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Mensagens de teste por cenário de detecção
const testMessages = {
  'interessado': [
    "Preciso urgente desse produto. Quando podemos fechar?",
    "Quero muito finalizar essa compra ainda hoje",
    "Estou pronto para assinar o contrato, me envia os detalhes?",
    "Necessito que este serviço seja implementado o quanto antes",
    "Já decidi, vamos fechar o negócio amanhã sem falta"
  ],
  'compra_futura': [
    "Tenho interesse em adquirir isso no próximo mês",
    "Estou planejando fazer essa compra quando receber meu décimo terceiro",
    "Pretendo contratar esse serviço depois das férias",
    "Quero comprar isso, mas só posso fazer no próximo trimestre",
    "Vou adquirir esse produto quando terminar meu atual contrato"
  ],
  'achou_caro': [
    "Achei o valor muito alto para o que oferece",
    "É um bom produto, mas está fora do nosso orçamento",
    "O preço está acima do que esperávamos pagar",
    "Gostei do serviço, mas o valor está muito elevado",
    "Parece muito caro comparado com outras opções que vi"
  ],
  'quer_desconto': [
    "Vocês conseguem oferecer algum desconto nesse valor?",
    "Qual o melhor preço que podem fazer?",
    "Se tiver um valor menor, fechamos agora",
    "Podem fazer uma condição especial no preço?",
    "Preciso de um desconto para aprovar internamente"
  ],
  'parcelamento': [
    "Consigo parcelar esse valor em 12 vezes?",
    "Vocês trabalham com financiamento?",
    "Preciso dividir esse pagamento em prestações mensais",
    "Qual a menor entrada que posso dar e parcelar o restante?",
    "É possível fazer um parcelamento sem juros?"
  ],
  'sem_interesse': [
    "Não tenho interesse, podem parar de enviar mensagens",
    "Obrigado, mas decidimos seguir com outro fornecedor",
    "Não vamos avançar com essa proposta",
    "Desistimos do projeto por enquanto",
    "Não precisamos mais desse serviço"
  ]
};

// Função para obter o ID de um lead aleatório
async function getRandomLead() {
  const { data, error } = await supabase
    .from('leads')
    .select('id')
    .limit(5);
  
  if (error || !data || data.length === 0) {
    console.error('Erro ao buscar leads:', error);
    throw new Error('Não foi possível encontrar leads no banco de dados');
  }
  
  const randomIndex = Math.floor(Math.random() * data.length);
  return data[randomIndex].id;
}

// Limpar todas as marcações de análise para retestar
async function clearPreviousAnalysis() {
  console.log('Limpando análises anteriores...');
  
  // Resetar campos de análise nas mensagens
  const { error: msgError } = await supabase
    .from('whatsapp_conversations')
    .update({
      analyzed_at: null,
      sentiment: null,
      intent: null
    })
    .is('analyzed_at', 'not.null');
  
  if (msgError) {
    console.error('Erro ao limpar análises de mensagens:', msgError);
  }
  
  // Resetar campos de análise nos leads
  const { error: leadError } = await supabase
    .from('leads')
    .update({
      sentiment_status: null,
      lead_score: null,
      ai_analysis: null,
      last_sentiment_update: null
    })
    .is('sentiment_status', 'not.null');
  
  if (leadError) {
    console.error('Erro ao limpar análises de leads:', leadError);
  }
  
  console.log('Análises anteriores removidas com sucesso');
}

// Inserir mensagens de teste no banco
async function insertTestMessages() {
  try {
    // 1. Limpar análises anteriores
    await clearPreviousAnalysis();
    
    // 2. Inserir mensagens de teste para cada cenário
    console.log('Inserindo mensagens de teste...');
    
    let totalInserted = 0;
    
    for (const [scenario, messages] of Object.entries(testMessages)) {
      console.log(`\nInserindo mensagens para cenário "${scenario}"...`);
      
      // Obter um lead aleatório para este cenário
      const leadId = await getRandomLead();
      console.log(`Usando lead ID: ${leadId}`);
      
      // Pegar número de telefone do lead
      const { data: leadData } = await supabase
        .from('leads')
        .select('phone')
        .eq('id', leadId)
        .single();
      
      const phoneNumber = leadData?.phone || '5521999999999';
      
      // Inserir mensagens para este cenário
      for (let i = 0; i < messages.length; i++) {
        const messageId = `test-${scenario}-${i + 1}-${Date.now()}`;
        const message = messages[i];
        
        // Alternar entre mensagens recebidas e enviadas
        const direction = i % 2 === 0 ? 'incoming' : 'outgoing';
        
        // Calcular timestamp: mensagens mais antigas primeiro, mais recentes por último
        const messageTime = new Date();
        messageTime.setHours(messageTime.getHours() - (messages.length - i));
        
        const { data, error } = await supabase
          .from('whatsapp_conversations')
          .insert({
            lead_id: leadId,
            message_id: messageId,
            phone_number: phoneNumber.replace(/\D/g, ''),
            direction: direction,
            content: message,
            media_type: 'text',
            message_status: 'delivered',
            message_timestamp: messageTime.toISOString()
          });
        
        if (error) {
          console.error(`Erro ao inserir mensagem "${message}":`, error);
        } else {
          totalInserted++;
          console.log(`✓ Mensagem inserida: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`);
        }
        
        // Pequena pausa entre inserções
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`\nTotal de ${totalInserted} mensagens de teste inseridas com sucesso!`);
    console.log('Para analisar estas mensagens, execute: node scripts/sentiment-analysis.js');
    
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

// Executar o script
insertTestMessages().catch(console.error);