// Este script amplia a funcionalidade do WhatsApp API para capturar todas as mensagens,
// incluindo as enviadas por outros meios (como WhatsApp Web ou aplicativo móvel)

// Identificar mensagens enviadas (outgoing) que não foram enviadas pela interface
client.on('message_create', async (message) => {
  // Esta função é chamada quando uma mensagem é criada, 
  // independente se foi enviada pela API ou por outro meio (como WhatsApp Web)
  
  // Apenas processar se for uma mensagem enviada por nós e não recebida
  if (message.fromMe) {
    console.log('Outgoing message detected (sent from another source):', message.body);
    
    // Verificar se a mensagem não foi criada pela nossa API
    // Isso evita duplicações com mensagens já registradas via /api/send
    if (!message._data.isApi) {
      // Enviar webhook para a mensagem enviada externamente
      sendWebhook('message', {
        from: message.from,
        to: message.to,
        body: message.body,
        timestamp: message.timestamp,
        type: message.type,
        id: message.id.id,
        fromMe: true, // Marcar explicitamente como outgoing
        source: 'external' // Identificar que foi enviada externamente
      });
    }
  }
});

// Modificar a função sendMessage para marcar mensagens enviadas pela API
const originalSendMessage = client.sendMessage;
client.sendMessage = async function(chatId, content, options = {}) {
  // Adicionar metadados à mensagem para identificar que foi enviada pela nossa API
  if (!options.metadata) options.metadata = {};
  options.metadata.isApi = true;
  
  // Chamar a função original
  return originalSendMessage.call(this, chatId, content, options);
};

// Modificar a função original de webhook para incluir mais dados sobre o contato
function enhancedSendWebhook(event, data) {
  if (!WEBHOOK_URL) return;
  
  // Enriquecer dados para eventos de mensagem
  if (event === 'message' && data) {
    // Adicionar informações do contato se possível
    try {
      // Obter número de telefone do chat para buscar contato
      const chatId = data.fromMe ? data.to : data.from;
      if (chatId) {
        client.getContactById(chatId).then(contact => {
          if (contact) {
            data.contactName = contact.name || contact.pushname;
            data.contactNumber = contact.number;
          }
          
          // Enviar webhook com dados enriquecidos
          sendOriginalWebhook(event, data);
        }).catch(err => {
          console.error('Error getting contact details:', err);
          sendOriginalWebhook(event, data);
        });
        return;
      }
    } catch (err) {
      console.error('Error enriching webhook data:', err);
    }
  }
  
  // Caso não seja mensagem ou tenha erro, envia webhook normal
  sendOriginalWebhook(event, data);
}

// Preservar função original
const sendOriginalWebhook = sendWebhook;

// Substituir pela versão aprimorada
sendWebhook = enhancedSendWebhook;

// Exportar função para o módulo principal
module.exports = {
  initListeners: (clientInstance) => {
    // Caso precise de inicialização adicional
    console.log('WhatsApp message listeners initialized');
  }
};