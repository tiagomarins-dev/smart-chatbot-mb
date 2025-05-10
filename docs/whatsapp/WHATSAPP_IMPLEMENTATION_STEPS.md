# Implementação de Captura de Mensagens WhatsApp - Passo a Passo

Este documento fornece um guia detalhado das alterações necessárias para implementar a captura de todas as mensagens do WhatsApp, incluindo as enviadas externamente (via WhatsApp Web, app mobile, etc.).

## 1. Criação do Listener de Mensagens Externas

Crie o arquivo `message-listener.js` no diretório `backend/whatsapp-api/`:

```javascript
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
```

## 2. Modificar o Arquivo Principal da API WhatsApp

Modifique o arquivo `backend/whatsapp-api/index.js`:

### 2.1 Adicionar configuração para captura de mensagens externas

```javascript
// Adicionar após as configurações existentes
const CAPTURE_EXTERNAL_MESSAGES = process.env.CAPTURE_EXTERNAL_MESSAGES !== 'false'; // Habilitado por padrão
```

### 2.2 Modificar o handler de mensagens recebidas

```javascript
client.on('message', message => {
  console.log('Message received:', message.body);
  
  // Enviar webhook para mensagem recebida
  sendWebhook('message', {
    from: message.from,
    to: message.to || clientInfo.number ? `${clientInfo.number}@c.us` : undefined,
    body: message.body,
    timestamp: message.timestamp,
    type: message.type,
    id: message.id.id,
    fromMe: false // Explicitar que é incoming
  });
});

// Capturar mensagens enviadas por outros meios (WhatsApp Web, celular, etc.)
client.on('message_create', message => {
  // Apenas processar mensagens enviadas por nós (outgoing)
  if (message.fromMe) {
    console.log('Message sent from another source detected:', message.body);
    
    // Extrair dados da mensagem
    const messageData = {
      from: message.from,
      to: message.to,
      body: message.body,
      timestamp: message.timestamp,
      type: message.type,
      id: message.id.id,
      fromMe: true,
      source: 'external' // Marca como enviada externamente (não pela nossa API)
    };
    
    // Enviar webhook para mensagem enviada externamente
    if (CAPTURE_EXTERNAL_MESSAGES) {
      sendWebhook('message', messageData);
    }
  }
});
```

### 2.3 Modificar o endpoint de envio de mensagens

```javascript
app.post('/api/send', async (req, res) => {
  try {
    const { number, message, lead_id } = req.body;
    
    if (!number || !message) {
      return res.status(400).json({ error: 'Number and message are required' });
    }
    
    if (clientState !== 'connected') {
      return res.status(400).json({ error: 'WhatsApp client not connected' });
    }
    
    // Formatar número
    let formattedNumber = number.replace(/\D/g, '');
    
    // Adicionar @c.us se não estiver presente
    if (!formattedNumber.includes('@c.us')) {
      formattedNumber = `${formattedNumber}@c.us`;
    }
    
    // Enviar mensagem
    const response = await client.sendMessage(formattedNumber, message);
    
    // Criar objeto com informações completas para o webhook
    const messageData = {
      from: clientInfo.number ? `${clientInfo.number}@c.us` : 'unknown',
      to: formattedNumber,
      body: message,
      timestamp: new Date().toISOString(),
      type: 'chat',
      id: response.id.id,
      fromMe: true,
      source: 'api', // Marca como enviada pela nossa API
      lead_id: lead_id || undefined // Incluir ID do lead se disponível
    };
    
    // Enviar webhook manualmente para garantir que a mensagem seja capturada
    sendWebhook('message', messageData);
    
    res.json({
      success: true,
      to: number,
      status: 'sent',
      messageId: response.id.id,
      timestamp: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});
```

## 3. Modificar o Controller de Webhook no Backend

Modifique o arquivo `backend/src/controllers/whatsappController.ts`:

### 3.1 Aprimorar o processamento de eventos de webhook

```typescript
/**
 * Process a webhook event and record it to the database if applicable
 */
async function processWebhookEvent(eventData: any): Promise<void> {
  try {
    const { type, data, timestamp } = eventData;
    
    // Log detalhes do webhook para diagnóstico
    console.log(`Processando webhook: tipo=${type}, timestamp=${timestamp || 'não informado'}`);
    console.log('Dados do webhook:', JSON.stringify(data || {}).substring(0, 200) + '...');
    
    switch (type) {
      case 'message':
        await processMessageEvent(data);
        break;
      case 'qr':
        // QR code events don't relate to specific leads
        console.log('QR Code event received');
        break;
      case 'connection':
        console.log('Connection event received:', data?.state);
        break;
      default:
        console.log('Unhandled event type:', type);
    }
  } catch (error) {
    console.error('Error in processWebhookEvent:', error);
  }
}
```

### 3.2 Criar funções melhoradas para processamento de mensagens

```typescript
/**
 * Process a message event and record it to the lead_events and whatsapp_conversations tables
 */
async function processMessageEvent(data: any): Promise<void> {
  try {
    // Validação dos dados da mensagem
    if (!data) {
      console.error('Invalid message data: data is null or undefined');
      return;
    }
    
    // Log para diagnóstico
    console.log('Processing message event:', {
      id: data.id, 
      from: data.from, 
      to: data.to,
      fromMe: data.fromMe,
      source: data.source,
      body: data.body ? (data.body.length > 50 ? data.body.substring(0, 50) + '...' : data.body) : null
    });
    
    // Determinar direção da mensagem e números de telefone corretos
    const isOutgoing = data.fromMe === true;
    
    // Para mensagens enviadas, o número do lead é o destinatário (to)
    // Para mensagens recebidas, o número do lead é o remetente (from)
    const phoneNumberRaw = isOutgoing ? data.to : data.from;
    
    if (!phoneNumberRaw) {
      console.error('Missing phone number in message data');
      console.log('Message data dump:', JSON.stringify(data));
      return;
    }
    
    // Limpar o número de telefone
    const phoneNumber = phoneNumberRaw.replace('@c.us', '').replace(/\D/g, '');
    console.log(`Número de telefone extraído: ${phoneNumber} (${isOutgoing ? 'enviada para' : 'recebida de'})`);
    
    // Verificar se o lead_id foi fornecido diretamente no webhook (implementação nova)
    if (data.lead_id) {
      console.log(`ID do lead fornecido diretamente no webhook: ${data.lead_id}`);
      await processMessageForLead(data.lead_id, data, phoneNumber, isOutgoing);
      return;
    }

    // Caso contrário, tentar encontrar o lead pelo número de telefone
    console.log(`Buscando lead pelo número de telefone: ${phoneNumber}`);
    const query = `
      SELECT id FROM leads
      WHERE phone LIKE $1 OR phone LIKE $2 OR phone LIKE $3 OR phone LIKE $4
    `;

    // Try different phone number formats
    const result = await executeQuery(query, [
      `%${phoneNumber}%`,
      `%${phoneNumber.substring(phoneNumber.length - 8)}%`,
      `%${phoneNumber.substring(phoneNumber.length - 9)}%`,
      `%${phoneNumber.substring(phoneNumber.length - 11)}%` // Formato completo BR: 5521987654321
    ]);

    if (result && result.length > 0) {
      const leadId = result[0].id;
      console.log(`Lead encontrado: ${leadId}`);
      
      await processMessageForLead(leadId, data, phoneNumber, isOutgoing);
    } else {
      console.log(`Nenhum lead encontrado para o número ${phoneNumber}`);
      
      // Opção: Salvar mensagens sem lead em tabela separada ou log
      console.log('Mensagem não associada a lead (não será salva no banco):', {
        direction: isOutgoing ? 'outgoing' : 'incoming',
        phone: phoneNumber,
        message: data.body,
        timestamp: data.timestamp || new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error processing message event:', error);
  }
}

/**
 * Process a message for a specific lead
 */
async function processMessageForLead(leadId: string, data: any, phoneNumber: string, isOutgoing: boolean): Promise<void> {
  try {
    // 1. Create a lead event record (manter compatibilidade)
    await createLeadEvent(
      leadId,
      'whatsapp_message',
      {
        direction: isOutgoing ? 'outgoing' : 'incoming',
        message: data.body || '',
        messageId: data.id || '',
        timestamp: data.timestamp || new Date().toISOString(),
        source: data.source || 'webhook' // Registrar origem da mensagem
      },
      'whatsapp'
    );

    console.log(`Registrado evento WhatsApp para lead ${leadId} (${isOutgoing ? 'enviada' : 'recebida'})`);

    // 2. Salvar na tabela de conversas para análise de IA
    try {
      // Import aqui para evitar import circular
      const { createWhatsAppConversation } = require('../services/whatsappConversationsService');

      const messageTimestamp = data.timestamp
        ? new Date(data.timestamp).toISOString()
        : new Date().toISOString();

      const conversationData = {
        lead_id: leadId,
        message_id: data.id || `msg-webhook-${Date.now()}`,
        phone_number: phoneNumber,
        direction: isOutgoing ? 'outgoing' : 'incoming',
        content: data.body || '',
        media_type: data.hasMedia ? (data.type || 'media') : 'text',
        message_status: data.ack || 'received',
        message_timestamp: messageTimestamp
      };

      const savedConversation = await createWhatsAppConversation(conversationData);

      if (savedConversation) {
        console.log(`Mensagem salva na tabela de conversas: ${savedConversation.id}`);

        // Se for uma mensagem de saída (nossa), calcular tempo de resposta
        if (isOutgoing) {
          try {
            const { calculateResponseTime } = require('../services/whatsappConversationsService');
            const responseTime = await calculateResponseTime(
              leadId,
              data.id || `msg-webhook-${Date.now()}`,
              messageTimestamp
            );

            if (responseTime) {
              console.log(`Tempo de resposta calculado: ${responseTime} segundos`);
            }
          } catch (responseTimeError) {
            console.error('Erro ao calcular tempo de resposta:', responseTimeError);
          }
        }
      }
    } catch (conversationError) {
      console.error('Erro ao salvar na tabela de conversas:', conversationError);
    }
  } catch (error) {
    console.error(`Erro ao processar mensagem para lead ${leadId}:`, error);
  }
}
```

## 4. Atualizar Configuração do Docker (Opcional)

Modifique o arquivo `docker-compose.yml` para incluir a variável de ambiente e montagem correta:

```yaml
  whatsapp-api:
    build:
      context: ./backend/whatsapp-api
      dockerfile: Dockerfile
    container_name: crm-whatsapp-api
    ports:
      - '9029:3000'  # Map to port 9029 to match existing configuration
    volumes:
      - whatsapp_data:/app/wa_data
      - ./backend/whatsapp-api:/app  # Montar código-fonte para desenvolvimento
    environment:
      - PORT=3000
      - WEBHOOK_URL=http://backend:3000/api/webhooks/whatsapp
      - WA_DATA_PATH=/app/wa_data
      - CAPTURE_EXTERNAL_MESSAGES=true  # Habilitar captura de mensagens enviadas externamente
    depends_on:
      - backend
    restart: unless-stopped
```

## 5. Deploy e Aplicação das Alterações

### Opção 1: Copiando arquivos para contêineres existentes

```bash
# Copiar o arquivo message-listener.js
docker cp /path/to/message-listener.js whatsapp-web-api:/app/

# Copiar o arquivo index.js modificado
docker cp /path/to/index.js whatsapp-web-api:/app/

# Copiar o arquivo whatsappController.ts modificado
docker cp /path/to/whatsappController.ts crm-backend:/usr/src/app/src/controllers/

# Reiniciar os contêineres para aplicar as mudanças
docker restart whatsapp-web-api
docker restart crm-backend
```

### Opção 2: Reconstruir os contêineres

```bash
# Parar os contêineres existentes
docker compose down

# Reconstruir e iniciar os contêineres
docker compose up -d
```

## 6. Verificação e Monitoramento

Para verificar se a implementação está funcionando corretamente:

```bash
# Monitorar logs do WhatsApp API
docker logs -f whatsapp-web-api | grep "message_create"

# Monitorar logs do Backend
docker logs -f crm-backend | grep "Processing message event"
```

## 7. Teste de Funcionalidade

1. Envie uma mensagem pelo WhatsApp Web para um número associado a algum lead
2. Verifique os logs para confirmar que a mensagem foi capturada
3. Verifique no banco de dados se a mensagem foi registrada corretamente

## 8. Considerações Finais

- A captura de mensagens externas depende da biblioteca WhatsApp Web.js funcionando corretamente 
- Algumas configurações podem precisar de ajustes conforme as especificidades do seu ambiente
- Os logs são essenciais para diagnóstico em caso de problemas
- O sistema identifica leads pelo número de telefone, portanto, números corretos são cruciais