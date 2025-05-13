/**
 * Mapeamento de endpoints da API WhatsApp
 *
 * Este script lista os endpoints disponíveis na API WhatsApp
 * e como eles são chamados pelo frontend.
 */

// Endpoints disponíveis no servidor WhatsApp (localhost:9029)
const serverEndpoints = {
  // Verificação de status
  status: {
    url: '/api/status',
    method: 'GET',
    description: 'Retorna o status atual da conexão WhatsApp'
  },
  
  // QR Code
  qrcode: {
    url: '/api/qrcode',
    method: 'GET',
    description: 'Retorna o QR code para autenticação'
  },
  
  // Verificação de conexão
  verifyConnection: {
    url: '/api/verify-connection',
    method: 'GET',
    description: 'Verifica se a conexão está ativa'
  },
  
  // Iniciar conexão
  connect: {
    url: '/api/connect',
    method: 'POST',
    description: 'Inicia o processo de conexão'
  },
  
  // Enviar mensagem
  send: {
    url: '/api/send',
    method: 'POST',
    description: 'Envia uma mensagem para um número'
  },
  
  // Obter mensagens
  messages: {
    url: '/api/messages',
    method: 'GET',
    description: 'Retorna as mensagens recentes'
  },
  
  // Obter mensagens de um contato
  contactMessages: {
    url: '/api/messages/:number',
    method: 'GET',
    description: 'Retorna as mensagens de um contato específico'
  }
};

// Endpoints chamados pelo frontend
const frontendEndpoints = {
  // Verificação de status
  status: {
    url: '/api/whatsapp/status',
    method: 'GET',
    description: 'Retorna o status atual da conexão WhatsApp'
  },
  
  // QR Code
  qrcode: {
    url: '/api/whatsapp/qrcode',
    method: 'GET',
    description: 'Retorna o QR code para autenticação'
  },
  
  // Iniciar conexão
  connect: {
    url: '/api/whatsapp/connect',
    method: 'POST',
    description: 'Inicia o processo de conexão'
  },
  
  // Enviar mensagem
  send: {
    url: '/api/whatsapp/send',
    method: 'POST',
    description: 'Envia uma mensagem para um número'
  },
  
  // Obter mensagens
  messages: {
    url: '/api/whatsapp/messages',
    method: 'GET',
    description: 'Retorna as mensagens recentes'
  },
  
  // Obter mensagens de um contato
  contactMessages: {
    url: '/api/whatsapp/messages/:number',
    method: 'GET',
    description: 'Retorna as mensagens de um contato específico'
  }
};

// Mapeamento entre frontend e servidor
const mapping = {
  'api/whatsapp/status': 'api/status',
  'api/whatsapp/qrcode': 'api/qrcode',
  'api/whatsapp/connect': 'api/connect',
  'api/whatsapp/send': 'api/send',
  'api/whatsapp/messages': 'api/messages',
  'api/whatsapp/messages/:number': 'api/messages/:number'
};

console.log('Mapeamento de Endpoints WhatsApp:');
console.log('-'.repeat(50));
console.log('Frontend -> Servidor:');
Object.entries(mapping).forEach(([frontend, server]) => {
  console.log(`${frontend} -> ${server}`);
});

module.exports = {
  serverEndpoints,
  frontendEndpoints,
  mapping
};