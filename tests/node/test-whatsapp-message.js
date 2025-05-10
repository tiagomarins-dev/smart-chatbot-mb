/**
 * Teste de envio de mensagem WhatsApp e verificação no Supabase
 *
 * Este script envia uma mensagem para um número específico e verifica se
 * foi corretamente salva no banco de dados Supabase.
 */

const axios = require('axios');
require('dotenv').config();

// Configurações
const PHONE_NUMBER = '5521998739574';
const TEST_MESSAGE = 'Esta é uma mensagem de teste enviada em ' + new Date().toISOString();
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'http://localhost:9029';
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Função para formatar números de telefone
function formatPhoneNumber(phone) {
  if (!phone) return '';
  // Remove todos os caracteres não-numéricos
  return phone.replace(/\D/g, '');
}

async function runTest() {
  console.log('='.repeat(80));
  console.log('TESTE DE ENVIO DE MENSAGEM WHATSAPP');
  console.log('='.repeat(80));
  console.log(`Número de destino: ${PHONE_NUMBER}`);
  console.log(`Mensagem: ${TEST_MESSAGE}`);
  console.log('-'.repeat(80));

  try {
    // Verificar status do WhatsApp
    console.log('1. Verificando status do WhatsApp...');
    const statusResponse = await axios.get(`${WHATSAPP_API_URL}/api/whatsapp/status`);
    console.log(`Status do WhatsApp: ${statusResponse.data.status}`);

    if (statusResponse.data.status !== 'connected') {
      console.error('ERRO: WhatsApp não está conectado!');
      console.log('Dica: Execute a conexão do WhatsApp antes de executar este teste.');
      return;
    }

    // Enviar mensagem
    console.log('\n2. Enviando mensagem...');
    const messageResponse = await axios.post(`${WHATSAPP_API_URL}/api/whatsapp/send`, {
      phoneNumber: formatPhoneNumber(PHONE_NUMBER),
      message: TEST_MESSAGE
    });

    if (!messageResponse.data.success) {
      throw new Error(`Falha ao enviar mensagem: ${messageResponse.data.error}`);
    }

    console.log('Mensagem enviada com sucesso!');
    console.log(`ID da mensagem: ${messageResponse.data.messageId}`);
    console.log(`Timestamp: ${messageResponse.data.timestamp}`);

    // Aguardar para dar tempo da mensagem ser processada e salva no banco
    console.log('\nAguardando processamento da mensagem (5 segundos)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verificar se a mensagem está no Supabase
    console.log('\n3. Verificando registro no Supabase...');

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('ERRO: Credenciais do Supabase não configuradas!');
      console.log('Configure as variáveis de ambiente SUPABASE_URL e SUPABASE_KEY.');
      return;
    }

    // Criar cliente Supabase (usando fetch diretamente via API REST)
    const cleanNumber = formatPhoneNumber(PHONE_NUMBER);

    // Buscar na tabela whatsapp_conversations
    const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_conversations?phone_number=eq.${cleanNumber}&content=eq.${encodeURIComponent(TEST_MESSAGE)}&select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    const messages = await supabaseResponse.json();

    if (messages.length > 0) {
      console.log('SUCESSO! Mensagem encontrada no banco de dados:');
      console.log(JSON.stringify(messages[0], null, 2));
    } else {
      console.log('Buscando por mensagens recentes para este número...');

      const recentMessagesResponse = await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_conversations?phone_number=eq.${cleanNumber}&select=*&order=created_at.desc&limit=5`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });

      const recentMessages = await recentMessagesResponse.json();

      if (recentMessages.length > 0) {
        console.log('Mensagens recentes encontradas para este número:');
        recentMessages.forEach(msg => {
          console.log(`- ${msg.created_at}: "${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}"`);
        });
        console.log('\nA mensagem específica de teste não foi encontrada, mas existem outras mensagens para este contato.');
      } else {
        console.error('FALHA! Nenhuma mensagem encontrada para este número no banco de dados.');
        console.log('Verifique os logs do backend e do whatsapp-api para mais detalhes.');
      }
    }

  } catch (error) {
    console.error('Erro durante o teste:', error.message);
    if (error.response) {
      console.error('Detalhes da resposta:', error.response.data);
    }
  }

  console.log('\n' + '='.repeat(80));
}

// Executar o teste
runTest().catch(console.error);