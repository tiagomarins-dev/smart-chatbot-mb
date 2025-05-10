/**
 * Script para análise de sentimento bihourly das mensagens WhatsApp
 * Processa apenas mensagens da última janela de 2 horas que ainda não foram analisadas
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Inicializar cliente Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Serviço de IA para análise de sentimento
const aiService = {
  /**
   * Analisa o sentimento de uma mensagem de texto usando OpenAI
   * @param {string} text - Texto para analisar
   * @returns {Promise<Object>} Resultado com sentimento, intenção e entidades
   */
  async analyzeSentiment(text) {
    try {
      // NOTA: Este é um mock - substitua por integração real com OpenAI ou outro serviço
      console.log(`Analisando texto: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      
      // Simulação de análise para teste
      // Em produção, integre com a API do OpenAI ou outro provedor de IA
      await new Promise(resolve => setTimeout(resolve, 500)); // Simular latência
      
      // Análise simplificada baseada em palavras-chave (substitua por IA real)
      const lowerText = text.toLowerCase();
      let sentiment = 0;
      let intent = 'informação';
      
      // Detecção básica de sentimento
      if (/obrigad|grat|feliz|bom|ótim|excel|ador/i.test(lowerText)) {
        sentiment = 0.7;
        intent = 'elogio';
      } else if (/problema|ruim|péssim|infeliz|demora|lent|espera|atra/i.test(lowerText)) {
        sentiment = -0.7;
        intent = 'reclamação';
      } else if (/quando|como|onde|quem|qual|por que|preço|valor|custo/i.test(lowerText)) {
        sentiment = 0.2;
        intent = 'pergunta';
      } else if (/quer|desej|gostaria|precis|necessit/i.test(lowerText)) {
        sentiment = 0.4;
        intent = 'solicitação';
      }
      
      // Extração básica de entidades
      const entities = {};
      const dateMatches = lowerText.match(/\d{1,2}\/\d{1,2}(\/\d{2,4})?|\d{1,2} de [a-z]+/i);
      if (dateMatches) {
        entities.data = dateMatches[0];
      }
      
      const valueMatches = lowerText.match(/R\$ ?\d+[\.,]?\d*/i);
      if (valueMatches) {
        entities.valor = valueMatches[0];
      }
      
      return {
        sentiment,
        intent,
        entities
      };
    } catch (error) {
      console.error('Erro na análise de sentimento:', error);
      // Retornar valores neutros em caso de erro
      return {
        sentiment: 0,
        intent: 'desconhecido',
        entities: {}
      };
    }
  },

  /**
   * Analisa o sentimento consolidado de um lead com base nas suas mensagens recentes
   * @param {string} leadId - ID do lead
   * @param {Array} messages - Mensagens recentes do lead
   * @returns {Promise<Object>} Análise consolidada do lead
   */
  async analyzeLeadSentiment(leadId, messages) {
    try {
      console.log(`Analisando sentimento consolidado para lead ${leadId} com ${messages.length} mensagens`);
      
      // Em produção, use OpenAI para análise mais sofisticada
      // Por enquanto, usamos uma versão simplificada para teste
      
      // Conteúdo consolidado das mensagens para análise
      const messagesContent = messages.map(m => `[${m.direction === 'incoming' ? 'CLIENTE' : 'EMPRESA'}]: ${m.content}`).join('\n');
      
      // Simulação de latência para API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Análise baseada em palavras-chave (simplifcada para teste)
      const lowerContent = messagesContent.toLowerCase();
      
      // Determinar status de interesse
      let sentimentStatus = 'sem interesse';
      let leadScore = 30; // Pontuação padrão

      // Análise baseada em padrões para determinar o status do lead

      // Verificar se achou caro
      if (/caro|preço alto|alto valor|valor elevado|muito dinheiro|fora do orçamento|acima do orçamento|preço excessivo|caríssimo|não vale o preço/i.test(lowerContent)) {
        sentimentStatus = 'achou caro';
        leadScore = 65;
      }

      // Verificar se quer desconto
      if (/desconto|abatimento|redução|diminuir valor|baixar preço|melhor preço|negociar valor|valor menor|promoção|oferta especial|condição especial/i.test(lowerContent)) {
        sentimentStatus = 'quer desconto';
        leadScore = 70;
      }

      // Verificar se precisa de parcelamento
      if (/parcel|prestação|dividir|financiar|pagamento mensal|pagar em vezes|pagar aos poucos|mensalidade|a prazo|sem juros|com juros|crediário|financiamento/i.test(lowerContent)) {
        sentimentStatus = 'parcelamento';
        leadScore = 78;
      }

      // Compra futura (mantém precedência sobre objeções financeiras)
      if (/comprar|adquirir|fechar|contrato|pagamento|prazo|quando|data entrega|próximo mês|próxima semana|próximo ano|em breve|futuramente|pretendo|planejo/i.test(lowerContent)) {
        sentimentStatus = 'compra futura';
        leadScore = 75;
      }

      // Interessado (maior prioridade exceto se for desinteresse explícito)
      if (/urgente|agora|imediato|preciso|necessito|hoje|amanhã|orçamento final|proposta final|quero mesmo|quero adquirir|vamos fechar|decidi comprar|podemos avançar/i.test(lowerContent)) {
        sentimentStatus = 'interessado';
        leadScore = 90;
      }

      // Sem interesse (maior precedência - sobrescreve outros status)
      if (/não quero|desistir|não tenho interesse|não vou avançar|não vai dar|desisti|outra empresa|concorrente|outro fornecedor|cancele|esqueça|deixa pra lá|não quero mais/i.test(lowerContent)) {
        sentimentStatus = 'sem interesse';
        leadScore = 15;
      }

      // Gerar análise detalhada baseada no status
      let aiAnalysis = '';

      if (sentimentStatus === 'interessado') {
        aiAnalysis = `O lead demonstra forte interesse e está próximo de uma decisão de compra.
As mensagens indicam urgência e comprometimento. Recomenda-se contato imediato
com proposta final e condições específicas. Enfatize diferenciais do produto/serviço
e ofereça condições especiais para fechamento imediato.`;
      } else if (sentimentStatus === 'compra futura') {
        aiAnalysis = `O lead mostra interesse consistente, mas ainda está em fase de avaliação.
Há indicações de intenção de compra no futuro próximo. Recomenda-se manter contato
periódico com informações relevantes sobre o produto/serviço, destacando benefícios
específicos para suas necessidades. Esclareça dúvidas pendentes e ofereça demonstração
ou teste se aplicável.`;
      } else if (sentimentStatus === 'achou caro') {
        aiAnalysis = `O lead demonstra interesse no projeto e acompanhou detalhes técnicos,
porém manifestou clara objeção ao preço apresentado. Considere apresentar o valor
total em perspectiva (benefício vs. custo) ou destacar o valor agregado que justifica
o investimento. Evite diminuir o valor do produto/serviço, mas enfatize o retorno obtido.
Alternativamente, ofereça um recurso adicional em vez de reduzir o preço.`;
      } else if (sentimentStatus === 'quer desconto') {
        aiAnalysis = `O lead está interessado, mas tenta negociar ativamente uma redução de preço.
A objeção é específica sobre o valor e não sobre o produto/serviço em si. Recomenda-se
preparar uma contra-proposta que ofereça valor percebido sem necessariamente reduzir a
margem. Considere oferecer um desconto limitado vinculado a condições específicas, como
pagamento antecipado ou assinatura de contrato de longa duração.`;
      } else if (sentimentStatus === 'parcelamento') {
        aiAnalysis = `O lead está decidido a adquirir o serviço, mas apresenta limitações de fluxo
de caixa para pagamento integral. As mensagens indicam que o valor não é o problema
principal, mas sim a distribuição dos pagamentos ao longo do tempo. Recomenda-se
apresentar um plano de parcelamento detalhado ou opções de financiamento. Enfatize
condições especiais para pagamento à vista caso seja possível para o cliente.`;
      } else {
        aiAnalysis = `O lead apresenta baixo engajamento ou sinais de desinteresse.
A comunicação sugere objeções não resolvidas ou melhor adequação a outras soluções.
Recomenda-se contato de recuperação com foco em entender objeções e oferecer
alternativas ou descontos. Considere também uma abordagem consultiva para identificar
necessidades não expressas.`;
      }
      
      return {
        sentiment_status: sentimentStatus,
        lead_score: leadScore,
        ai_analysis: aiAnalysis
      };
    } catch (error) {
      console.error(`Erro ao analisar sentimento do lead ${leadId}:`, error);
      // Retornar análise neutra em caso de erro
      return {
        sentiment_status: 'indeterminado',
        lead_score: 50,
        ai_analysis: 'Não foi possível realizar uma análise completa das mensagens deste lead.'
      };
    }
  }
};

/**
 * Processa análise de sentimento das mensagens das últimas 2 horas
 */
async function processBihourlyAnalysis() {
  console.log('Iniciando análise de sentimento bihourly - ' + new Date().toISOString());
  
  // 1. Buscar mensagens não analisadas das últimas 2 horas
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: messages, error } = await supabase
    .from('whatsapp_conversations')
    .select('id, lead_id, content, created_at, direction')
    .is('analyzed_at', null)
    .gt('created_at', twoHoursAgo)
    .order('lead_id', { ascending: true })
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erro ao buscar mensagens para análise:', error);
    return;
  }
  
  console.log(`Encontradas ${messages?.length || 0} mensagens para análise de sentimento`);
  
  if (!messages || messages.length === 0) {
    console.log('Nenhuma mensagem nova para analisar.');
    return;
  }
  
  // Agrupar mensagens por lead para análise contextual
  const messagesByLead = groupByLead(messages);
  let totalProcessed = 0;
  let leadsAnalyzed = 0;
  
  // 2. Processar mensagens agrupadas por lead
  for (const [leadId, leadMessages] of Object.entries(messagesByLead)) {
    try {
      console.log(`Processando ${leadMessages.length} mensagens para lead ${leadId}`);
      
      // Processar no máximo 5 mensagens mais recentes por lead para análise de mensagem individual
      const messagesToProcess = leadMessages.slice(0, 5);
      
      // Analisar sentimento das mensagens individuais
      for (const message of messagesToProcess) {
        // Realizar análise de sentimento da mensagem
        const { sentiment, intent, entities } = await aiService.analyzeSentiment(message.content);
        
        // Atualizar registro com resultados da análise
        await updateMessageAnalysis(message.id, sentiment, intent, entities);
        totalProcessed++;
        
        // Loggar resultado para debug
        console.log(`Mensagem ${message.id}: sentiment=${sentiment}, intent=${intent}`);
      }
      
      // 3. Realizar análise consolidada do lead com base em todas as mensagens recentes
      // Buscar mais mensagens do mesmo lead para ter mais contexto (até 10 mensagens)
      const { data: moreLead, error: moreLeadError } = await supabase
        .from('whatsapp_conversations')
        .select('id, content, direction, created_at')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!moreLeadError && moreLead && moreLead.length > 0) {
        // Analisar sentimento consolidado do lead
        const leadAnalysis = await aiService.analyzeLeadSentiment(leadId, moreLead);
        
        // Atualizar lead com análise consolidada
        await updateLeadSentiment(leadId, leadAnalysis);
        leadsAnalyzed++;
        
        console.log(`Lead ${leadId} analisado: status=${leadAnalysis.sentiment_status}, score=${leadAnalysis.lead_score}`);
      }
    } catch (err) {
      console.error(`Erro ao processar mensagens para lead ${leadId}:`, err);
    }
  }
  
  console.log(`Análise de sentimento concluída. Processadas ${totalProcessed} mensagens e ${leadsAnalyzed} leads.`);
}

/**
 * Agrupa mensagens por lead_id
 */
function groupByLead(messages) {
  return messages.reduce((groups, message) => {
    const key = message.lead_id;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(message);
    return groups;
  }, {});
}

/**
 * Atualiza a mensagem com os resultados da análise
 */
async function updateMessageAnalysis(messageId, sentiment, intent, entities) {
  const { error } = await supabase
    .from('whatsapp_conversations')
    .update({
      sentiment,
      intent, 
      entities,
      analyzed_at: new Date().toISOString()
    })
    .eq('id', messageId);
  
  if (error) {
    console.error(`Erro ao atualizar análise para mensagem ${messageId}:`, error);
  }
}

/**
 * Atualiza o lead com análise consolidada de sentimento
 */
async function updateLeadSentiment(leadId, analysis) {
  const { error } = await supabase
    .from('leads')
    .update({
      sentiment_status: analysis.sentiment_status,
      lead_score: analysis.lead_score,
      ai_analysis: analysis.ai_analysis,
      last_sentiment_update: new Date().toISOString()
    })
    .eq('id', leadId);
  
  if (error) {
    console.error(`Erro ao atualizar análise de sentimento para lead ${leadId}:`, error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  processBihourlyAnalysis()
    .then(() => {
      console.log('Análise completa');
      process.exit(0);
    })
    .catch(err => {
      console.error('Erro no processamento de análise de sentimento:', err);
      process.exit(1);
    });
}

// Exportar para uso em outros scripts
module.exports = {
  processBihourlyAnalysis
};