/**
 * Script para verificar os resultados da análise de sentimento no Supabase
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

async function checkSentimentResults() {
  console.log('='.repeat(80));
  console.log('VERIFICAÇÃO DOS RESULTADOS DA ANÁLISE DE SENTIMENTO');
  console.log('='.repeat(80));
  
  // 1. Verificar leads com análise de sentimento
  console.log('\n1. Leads com análise de sentimento:');
  const { data: leadsWithSentiment, error: leadError } = await supabase
    .from('leads')
    .select('id, name, email, phone, sentiment_status, lead_score, ai_analysis, last_sentiment_update')
    .not('sentiment_status', 'is', null);
  
  if (leadError) {
    console.error('Erro ao buscar leads:', leadError);
    return;
  }
  
  if (leadsWithSentiment && leadsWithSentiment.length > 0) {
    console.log(`Encontrados ${leadsWithSentiment.length} leads com análise de sentimento:`);
    leadsWithSentiment.forEach((lead, index) => {
      console.log(`\n--- Lead ${index + 1} ---`);
      console.log(`ID: ${lead.id}`);
      console.log(`Nome: ${lead.name}`);
      console.log(`Email: ${lead.email}`);
      console.log(`Telefone: ${lead.phone}`);
      console.log(`Status: ${lead.sentiment_status}`);
      console.log(`Score: ${lead.lead_score}`);
      console.log(`Última atualização: ${lead.last_sentiment_update}`);
      console.log(`Análise: ${lead.ai_analysis}`);
    });
  } else {
    console.log('Nenhum lead com análise de sentimento encontrado.');
  }
  
  // 2. Verificar mensagens com análise 
  console.log('\n2. Mensagens WhatsApp com análise:');
  const { data: messagesWithAnalysis, error: msgError } = await supabase
    .from('whatsapp_conversations')
    .select('id, lead_id, content, direction, sentiment, intent, analyzed_at')
    .not('analyzed_at', 'is', null)
    .limit(10);
  
  if (msgError) {
    console.error('Erro ao buscar mensagens:', msgError);
    return;
  }
  
  if (messagesWithAnalysis && messagesWithAnalysis.length > 0) {
    console.log(`Encontradas ${messagesWithAnalysis.length} mensagens com análise:`);
    messagesWithAnalysis.forEach((msg, index) => {
      console.log(`\n--- Mensagem ${index + 1} ---`);
      console.log(`ID: ${msg.id}`);
      console.log(`Lead ID: ${msg.lead_id}`);
      console.log(`Direção: ${msg.direction}`);
      console.log(`Conteúdo: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
      console.log(`Sentimento: ${msg.sentiment}`);
      console.log(`Intenção: ${msg.intent}`);
      console.log(`Analisada em: ${msg.analyzed_at}`);
    });
  } else {
    console.log('Nenhuma mensagem com análise encontrada.');
  }
  
  // 3. Verificar relatório de sentimento
  console.log('\n3. Relatório de sentimento de leads:');
  const { data: reportData, error: reportError } = await supabase
    .from('lead_sentiment_report')
    .select('*')
    .limit(5);
    
  if (reportError) {
    console.error('Erro ao acessar o relatório:', reportError);
    return;
  }
  
  if (reportData && reportData.length > 0) {
    console.log(`Relatório disponível com ${reportData.length} registros.`);
    console.log('Primeiros registros do relatório:');
    reportData.forEach((row, index) => {
      console.log(`\n--- Registro ${index + 1} ---`);
      console.log(`Lead: ${row.name} (${row.email})`);
      console.log(`Status: ${row.sentiment_status}, Score: ${row.lead_score}`);
      console.log(`Mensagens: ${row.total_messages} total (${row.incoming_messages} recebidas, ${row.outgoing_messages} enviadas)`);
      console.log(`Última mensagem: ${row.last_message_date}`);
    });
  } else {
    console.log('Nenhum registro encontrado no relatório de sentimento.');
  }
  
  console.log('\n' + '='.repeat(80));
}

// Executar verificação
checkSentimentResults().catch(console.error);