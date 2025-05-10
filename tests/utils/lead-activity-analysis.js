/**
 * Script para analisar todas as atividades e mensagens de um lead específico
 * Combina dados de lead_events e whatsapp_conversations para uma visão completa
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

// Obter lead_id da linha de comando ou usar valor padrão
const leadId = process.argv[2];

if (!leadId) {
  console.error('Por favor, forneça um lead_id como argumento:');
  console.error('node lead-activity-analysis.js LEAD_ID');
  process.exit(1);
}

/**
 * Função principal para analisar atividades do lead
 */
async function analyzeLeadActivity(leadId) {
  try {
    console.log('='.repeat(80));
    console.log(`ANÁLISE COMPLETA DE ATIVIDADES DO LEAD: ${leadId}`);
    console.log('='.repeat(80));

    // 1. Obter informações básicas do lead
    console.log('\n1. INFORMAÇÕES BÁSICAS DO LEAD:');
    await getLeadInfo(leadId);

    // 2. Obter projetos associados ao lead
    console.log('\n2. PROJETOS ASSOCIADOS:');
    await getLeadProjects(leadId);

    // 3. Obter todos os eventos do lead_events
    console.log('\n3. CRONOLOGIA DE EVENTOS:');
    await getLeadEvents(leadId);

    // 4. Obter todas as conversas de WhatsApp
    console.log('\n4. CONVERSAS DE WHATSAPP:');
    await getWhatsAppConversations(leadId);

    // 5. Obter análise de sentimento
    console.log('\n5. ANÁLISE DE SENTIMENTO:');
    await getSentimentAnalysis(leadId);

    // 6. Gerar resumo
    console.log('\n6. RESUMO DE INTERAÇÕES:');
    await generateLeadSummary(leadId);

  } catch (error) {
    console.error('Erro ao analisar atividades do lead:', error);
  }
}

/**
 * Obter informações básicas do lead
 */
async function getLeadInfo(leadId) {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error) {
    console.error('Erro ao buscar informações do lead:', error);
    return;
  }

  if (data) {
    console.log(`Nome: ${data.name}`);
    console.log(`Email: ${data.email}`);
    console.log(`Telefone: ${data.phone}`);
    console.log(`Status: ${data.status || 'Não definido'}`);
    console.log(`Origem: ${data.source || 'Não especificada'}`);
    console.log(`Criado em: ${new Date(data.created_at).toLocaleString()}`);
    
    if (data.sentiment_status) {
      console.log(`Status de Sentimento: ${data.sentiment_status}`);
      console.log(`Lead Score: ${data.lead_score || 'N/A'}`);
      console.log(`Última atualização de sentimento: ${data.last_sentiment_update ? new Date(data.last_sentiment_update).toLocaleString() : 'N/A'}`);
    }
  } else {
    console.log('Lead não encontrado');
  }
}

/**
 * Obter projetos associados ao lead
 */
async function getLeadProjects(leadId) {
  const { data, error } = await supabase
    .from('lead_project')
    .select('project_id, projects(id, name, status, price)')
    .eq('lead_id', leadId);

  if (error) {
    console.error('Erro ao buscar projetos do lead:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log(`Encontrados ${data.length} projetos associados:`);
    data.forEach((item, index) => {
      console.log(`\n--- Projeto ${index + 1} ---`);
      console.log(`ID: ${item.projects.id}`);
      console.log(`Nome: ${item.projects.name}`);
      console.log(`Status: ${item.projects.status || 'Não definido'}`);
      console.log(`Preço: ${item.projects.price ? formatCurrency(item.projects.price) : 'Não definido'}`);
    });
  } else {
    console.log('Nenhum projeto associado a este lead');
  }
}

/**
 * Obter eventos do lead em ordem cronológica
 */
async function getLeadEvents(leadId) {
  const { data, error } = await supabase
    .from('lead_events')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao buscar eventos do lead:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log(`Encontrados ${data.length} eventos registrados:`);
    
    data.forEach((event, index) => {
      console.log(`\n--- Evento ${index + 1} | ${new Date(event.created_at).toLocaleString()} ---`);
      console.log(`Tipo: ${event.event_type}`);
      console.log(`Canal: ${event.channel || 'Não especificado'}`);
      
      // Formatação dos dados específicos por tipo de evento
      if (event.event_data) {
        console.log('Dados do evento:');
        try {
          const eventData = typeof event.event_data === 'string' 
            ? JSON.parse(event.event_data) 
            : event.event_data;
            
          // Formatação especial para mensagens
          if (event.event_type === 'whatsapp_message' || event.event_type.includes('message')) {
            console.log(`  Direção: ${eventData.direction || 'N/A'}`);
            console.log(`  Mensagem: ${eventData.message || 'N/A'}`);
          } else {
            // Exibir outros tipos de dados de evento
            Object.entries(eventData).forEach(([key, value]) => {
              console.log(`  ${key}: ${JSON.stringify(value).substring(0, 100)}`);
            });
          }
        } catch (e) {
          console.log(`  ${event.event_data}`);
        }
      }
    });
  } else {
    console.log('Nenhum evento registrado para este lead');
  }
}

/**
 * Obter todas as conversas de WhatsApp
 */
async function getWhatsAppConversations(leadId) {
  const { data, error } = await supabase
    .from('whatsapp_conversations')
    .select('*')
    .eq('lead_id', leadId)
    .order('message_timestamp', { ascending: true });

  if (error) {
    console.error('Erro ao buscar conversas de WhatsApp:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log(`Encontradas ${data.length} mensagens de WhatsApp:`);
    
    data.forEach((msg, index) => {
      // Determinar quem enviou a mensagem para legenda
      const sender = msg.direction === 'incoming' ? 'CLIENTE' : 'EMPRESA';
      
      console.log(`\n--- Mensagem ${index + 1} | ${new Date(msg.message_timestamp).toLocaleString()} | ${sender} ---`);
      console.log(`Conteúdo: ${msg.content}`);
      
      // Exibir análise de sentimento se disponível
      if (msg.sentiment !== null && msg.analyzed_at) {
        console.log(`Sentimento: ${msg.sentiment.toFixed(2)} (-1 negativo, +1 positivo)`);
        console.log(`Intenção: ${msg.intent || 'Não classificada'}`);
        
        if (msg.entities && Object.keys(msg.entities).length > 0) {
          console.log('Entidades detectadas:');
          Object.entries(msg.entities).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
          });
        }
      }
      
      // Mostrar tempo de resposta, se aplicável
      if (msg.direction === 'outgoing' && msg.response_time_seconds) {
        console.log(`Tempo de resposta: ${formatTimespan(msg.response_time_seconds)}`);
      }
    });
  } else {
    console.log('Nenhuma conversa de WhatsApp encontrada para este lead');
  }
}

/**
 * Obter análise detalhada de sentimento
 */
async function getSentimentAnalysis(leadId) {
  const { data, error } = await supabase
    .from('leads')
    .select('sentiment_status, lead_score, ai_analysis, last_sentiment_update')
    .eq('id', leadId)
    .single();

  if (error) {
    console.error('Erro ao buscar análise de sentimento:', error);
    return;
  }

  if (data && data.sentiment_status) {
    console.log(`Status de sentimento: ${data.sentiment_status}`);
    console.log(`Lead score: ${data.lead_score || 'N/A'}/100`);
    console.log(`Última atualização: ${data.last_sentiment_update ? new Date(data.last_sentiment_update).toLocaleString() : 'N/A'}`);
    
    if (data.ai_analysis) {
      console.log('\nAnálise detalhada:');
      console.log(data.ai_analysis);
    }
  } else {
    console.log('Nenhuma análise de sentimento disponível para este lead');
  }
}

/**
 * Gerar resumo de interações do lead
 */
async function generateLeadSummary(leadId) {
  try {
    // Buscar estatísticas gerais
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_lead_whatsapp_stats', { lead_id_param: leadId });
    
    if (statsError) {
      console.error('Erro ao gerar estatísticas:', statsError);
      return;
    }
    
    // Obter última mensagem
    const { data: lastMsg, error: msgError } = await supabase
      .from('whatsapp_conversations')
      .select('content, message_timestamp, direction')
      .eq('lead_id', leadId)
      .order('message_timestamp', { ascending: false })
      .limit(1)
      .single();
    
    // Dados do lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('created_at, updated_at, sentiment_status, lead_score')
      .eq('id', leadId)
      .single();
    
    if (leadError) {
      console.error('Erro ao buscar resumo do lead:', leadError);
      return;
    }
    
    // Exibir resumo
    if (statsData) {
      console.log('Estatísticas gerais:');
      console.log(`Total de mensagens: ${statsData.total_messages || 0}`);
      console.log(`Mensagens recebidas: ${statsData.incoming_messages || 0}`);
      console.log(`Mensagens enviadas: ${statsData.outgoing_messages || 0}`);
      
      if (statsData.response_time_avg) {
        console.log(`Tempo médio de resposta: ${formatTimespan(statsData.response_time_avg)}`);
      }
    }
    
    if (lead) {
      console.log('\nTempo na base:');
      const createdDays = daysSince(lead.created_at);
      console.log(`Lead cadastrado há: ${createdDays} dias`);
      
      if (lastMsg) {
        const lastContactDays = daysSince(lastMsg.message_timestamp);
        console.log(`Último contato há: ${lastContactDays} dias`);
        console.log(`Última mensagem: "${lastMsg.content.substring(0, 50)}${lastMsg.content.length > 50 ? '...' : ''}" (${lastMsg.direction === 'incoming' ? 'do cliente' : 'da empresa'})`);
      }
      
      if (lead.sentiment_status) {
        console.log('\nClassificação atual:');
        console.log(`Status: ${lead.sentiment_status}`);
        console.log(`Score: ${lead.lead_score || 'N/A'}/100`);
        
        // Recomendação com base no status e score
        let recommendation = 'Aguardar contato ativo do lead.';
        
        if (lead.sentiment_status === 'interessado') {
          recommendation = 'Contato imediato com proposta comercial concreta.';
        } else if (lead.sentiment_status === 'compra futura') {
          recommendation = 'Contato periódico com informações relevantes sobre o projeto.';
        } else if (lead.sentiment_status === 'achou caro') {
          recommendation = 'Contato com foco em demonstrar valor e benefícios que justificam o investimento.';
        } else if (lead.sentiment_status === 'quer desconto') {
          recommendation = 'Contato com proposta que ofereça valor adicional em vez de desconto direto.';
        } else if (lead.sentiment_status === 'parcelamento') {
          recommendation = 'Contato apresentando opções de parcelamento e financiamento.';
        } else if (lead.sentiment_status === 'sem interesse') {
          recommendation = 'Reavaliar necessidade de contato ativo ou buscar entender objeções.';
        }
        
        console.log('\nRecomendação de abordagem:');
        console.log(recommendation);
      }
    }
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
  }
}

/**
 * Funções auxiliares
 */

// Formatar valor monetário
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

// Formatar tempo em segundos para representação amigável
function formatTimespan(seconds) {
  if (seconds < 60) {
    return `${Math.round(seconds)} segundos`;
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)} minutos`;
  } else if (seconds < 86400) {
    return `${Math.round(seconds / 3600)} horas`;
  } else {
    return `${Math.round(seconds / 86400)} dias`;
  }
}

// Calcular dias desde uma data
function daysSince(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Executar a função principal
analyzeLeadActivity(leadId)
  .then(() => {
    console.log('\nAnálise completa!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro na execução:', error);
    process.exit(1);
  });