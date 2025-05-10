/**
 * Teste de conexão com o Supabase e verificação de mensagens do WhatsApp
 * 
 * Este script verifica a conexão com o Supabase e busca mensagens WhatsApp
 * para um número específico.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.test' });

// Configurações
const PHONE_NUMBER = '5521998739574';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Inicializa o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Função para formatar números de telefone
function formatPhoneNumber(phone) {
  if (!phone) return '';
  // Remove todos os caracteres não-numéricos
  return phone.replace(/\D/g, '');
}

async function runTest() {
  console.log('='.repeat(80));
  console.log('TESTE DE CONEXÃO COM SUPABASE E VERIFICAÇÃO DE MENSAGENS WHATSAPP');
  console.log('='.repeat(80));
  console.log(`Número alvo: ${PHONE_NUMBER}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('-'.repeat(80));

  try {
    // Testar a conexão com o Supabase
    console.log('1. Verificando conexão com o Supabase...');
    const { data: testData, error: testError } = await supabase.from('leads').select('id').limit(1);

    if (testError) {
      throw new Error(`Falha na conexão com o Supabase: ${testError.message}`);
    }

    console.log('Conexão com Supabase estabelecida com sucesso!');
    
    // Buscar mensagens WhatsApp para o número
    console.log('\n2. Buscando mensagens WhatsApp para o número...');
    const cleanNumber = formatPhoneNumber(PHONE_NUMBER);
    
    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('phone_number', cleanNumber)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (messagesError) {
      throw new Error(`Falha ao buscar mensagens: ${messagesError.message}`);
    }
    
    if (messages && messages.length > 0) {
      console.log(`Encontradas ${messages.length} mensagens para o número ${PHONE_NUMBER}:`);
      messages.forEach((msg, index) => {
        console.log(`\n--- Mensagem ${index + 1} ---`);
        console.log(`ID: ${msg.id}`);
        console.log(`Direção: ${msg.direction === 'outgoing' ? 'Enviada' : 'Recebida'}`);
        console.log(`Data: ${new Date(msg.created_at).toLocaleString()}`);
        console.log(`Conteúdo: ${msg.content}`);
        
        if (msg.lead_id) {
          console.log(`Lead ID: ${msg.lead_id}`);
        }
      });
    } else {
      console.log(`Nenhuma mensagem encontrada para o número ${PHONE_NUMBER}.`);
      
      // Verificar se existem conversas salvas para qualquer número
      console.log('\n3. Verificando conversas WhatsApp recentes no sistema...');
      
      const { data: recentMessages, error: recentError } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentError) {
        throw new Error(`Falha ao buscar mensagens recentes: ${recentError.message}`);
      }
      
      if (recentMessages && recentMessages.length > 0) {
        console.log(`Encontradas ${recentMessages.length} mensagens recentes no sistema:`);
        recentMessages.forEach((msg, index) => {
          console.log(`\n--- Mensagem ${index + 1} ---`);
          console.log(`Número: ${msg.phone_number}`);
          console.log(`Direção: ${msg.direction === 'outgoing' ? 'Enviada' : 'Recebida'}`);
          console.log(`Data: ${new Date(msg.created_at).toLocaleString()}`);
          console.log(`Conteúdo: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
        });
      } else {
        console.log('Nenhuma mensagem WhatsApp encontrada no sistema.');
      }
    }
    
  } catch (error) {
    console.error('Erro durante o teste:', error.message);
  }

  console.log('\n' + '='.repeat(80));
}

// Executar o teste
runTest().catch(console.error);