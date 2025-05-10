const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

// Configurações
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || null;
const WA_DATA_PATH = process.env.WA_DATA_PATH || './wa_data';
const CAPTURE_EXTERNAL_MESSAGES = process.env.CAPTURE_EXTERNAL_MESSAGES !== 'false'; // Habilitado por padrão

// Iniciar aplicação Express
const app = express();
app.use(cors());
app.use(express.json());

// Armazenar estado atual
let qrCodeData = null;
let clientState = 'disconnected'; // disconnected, initializing, qr_received, authenticated, connected, error
let clientInfo = {
  name: null,
  number: null
};
let connectionTimestamp = null;

// Iniciar cliente WhatsApp
const client = new Client({
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-component-extensions-with-background-pages',
      '--disable-default-apps',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-first-run',
      '--disable-features=site-per-process',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
    ignoreHTTPSErrors: true,
    bypassCSP: true,
    defaultViewport: {
      width: 1280,
      height: 800
    }
  },
  authStrategy: new LocalAuth({
    dataPath: WA_DATA_PATH
  }),
  webVersionCache: {
    type: 'remote'
  },
  webVersion: '2.2351.59'
});

// Eventos do cliente
client.on('qr', (qr) => {
  console.log('QR Code received');
  clientState = 'qr_received';
  
  // Gerar QR code como base64
  qrcode.toDataURL(qr, (err, url) => {
    if (!err) {
      qrCodeData = url;
      console.log('QR Code converted to base64 successfully');
    } else {
      console.error('Error generating QR code:', err);
    }
  });
});

client.on('loading_screen', (percent, message) => {
  console.log('LOADING SCREEN', percent, message);
  clientState = 'initializing';
});

client.on('ready', () => {
  console.log('WhatsApp client is ready');
  clientState = 'connected';
  connectionTimestamp = new Date().toISOString();
  
  client.getInfo().then(info => {
    console.log('Client info retrieved:', info);
    clientInfo.name = info.pushname;
    clientInfo.number = info.wid.user;
  }).catch(err => {
    console.error('Error getting client info:', err);
  });
  
  // Enviar webhook de conexão
  sendWebhook('connected', null);
});

client.on('authenticated', () => {
  console.log('WhatsApp client authenticated');
  clientState = 'authenticated';
  qrCodeData = null; // Limpar QR code após autenticação
});

client.on('auth_failure', (err) => {
  console.error('Authentication failed:', err);
  clientState = 'error';
  sendWebhook('auth_failure', { error: err });
});

client.on('disconnected', (reason) => {
  console.log('WhatsApp client disconnected:', reason);
  clientState = 'disconnected';
  clientInfo = { name: null, number: null };
  connectionTimestamp = null;
  
  // Tentar reconectar automaticamente
  console.log('Attempting to reconnect...');
  setTimeout(() => {
    client.initialize().catch(err => {
      console.error('Failed to reconnect:', err);
    });
  }, 5000);
  
  sendWebhook('disconnected', { reason });
});

client.on('change_state', state => {
  console.log('CHANGE STATE', state);
});

client.on('change_battery', batteryInfo => {
  console.log('Battery: ', batteryInfo);
});

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

// Função para enviar webhook
function sendWebhook(event, data) {
  if (!WEBHOOK_URL) return;
  
  const payload = {
    event,
    data,
    timestamp: new Date().toISOString()
  };
  
  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).catch(err => {
    console.error('Error sending webhook:', err);
  });
}

// Iniciar cliente automaticamente com retry
const initializeClient = async (retryCount = 0, maxRetries = 3) => {
  try {
    console.log(`Initializing WhatsApp client (attempt ${retryCount + 1}/${maxRetries + 1})...`);
    await client.initialize();
    console.log('WhatsApp client initialized successfully');
  } catch (err) {
    console.error('Failed to initialize WhatsApp client:', err);
    clientState = 'error';
    
    if (retryCount < maxRetries) {
      console.log(`Retrying in 5 seconds... (${retryCount + 1}/${maxRetries})`);
      setTimeout(() => initializeClient(retryCount + 1, maxRetries), 5000);
    } else {
      console.error('Max retries reached. Please check the logs for more information.');
    }
  }
};

// Start initialization
initializeClient();

// Endpoints da API
app.get('/api/status', (req, res) => {
  // Forçar verificação do estado atual
  console.log(`Current client state: ${clientState}`);
  console.log(`Client info: ${JSON.stringify(clientInfo)}`);
  console.log(`Connection timestamp: ${connectionTimestamp}`);
  
  // Verificar estado da conexão manualmente
  if (client && client.info) {
    console.log('Client is connected!');
    clientState = 'connected';
    connectionTimestamp = new Date().toISOString();
  }
  
  res.json({
    status: clientState,
    timestamp: connectionTimestamp,
    info: clientState === 'connected' ? clientInfo : null
  });
});

app.get('/api/qrcode', (req, res) => {
  if (qrCodeData) {
    res.json({ qrcode: qrCodeData });
  } else {
    res.status(404).json({ error: 'QR code not available' });
  }
});

app.get('/api/verify-connection', async (req, res) => {
  console.log('Verifying connection status...');
  
  try {
    // Check if client exists and is initialized
    if (!client) {
      return res.json({ status: 'client_not_initialized', connected: false });
    }
    
    // Check if authenticated
    const isAuthenticated = await client.isRegisteredUser('777777777777@c.us');
    console.log(`isAuthenticated check result: ${isAuthenticated}`);
    
    // Update status if authenticated
    if (isAuthenticated) {
      clientState = 'connected';
      connectionTimestamp = connectionTimestamp || new Date().toISOString();
      
      // Try to get client info
      try {
        const info = await client.getInfo();
        clientInfo.name = info.pushname;
        clientInfo.number = info.wid.user;
      } catch (infoErr) {
        console.error('Failed to get client info:', infoErr);
      }
      
      return res.json({ 
        status: 'connected', 
        connected: true,
        info: clientInfo,
        timestamp: connectionTimestamp
      });
    }
    
    res.json({ 
      status: clientState, 
      connected: false,
      timestamp: connectionTimestamp 
    });
  } catch (err) {
    console.error('Error verifying connection:', err);
    res.json({ 
      status: 'error', 
      connected: false,
      error: err.message 
    });
  }
});

app.post('/api/connect', (req, res) => {
  if (clientState === 'disconnected' || clientState === 'error') {
    initializeClient();
    clientState = 'initializing';
    res.json({ status: 'initializing' });
  } else {
    // Check if connected manually
    try {
      if (client.pupPage && client.pupBrowser) {
        // Check if we can access the info property
        if (client.info) {
          console.log('Client is connected, updating state...');
          clientState = 'connected';
          connectionTimestamp = new Date().toISOString();
          
          // Get client info if possible
          client.getInfo().then(info => {
            clientInfo.name = info.pushname;
            clientInfo.number = info.wid.user;
            console.log(`Updated client info: ${JSON.stringify(clientInfo)}`);
          }).catch(err => {
            console.error('Error getting client info:', err);
          });
        }
      }
    } catch (err) {
      console.log('Error checking connection status:', err);
    }
    
    res.json({ status: clientState });
  }
});

app.post('/api/disconnect', (req, res) => {
  client.destroy().then(() => {
    clientState = 'disconnected';
    clientInfo = { name: null, number: null };
    connectionTimestamp = null;
    qrCodeData = null;
    
    res.json({ status: 'disconnected' });
  }).catch(err => {
    console.error('Error disconnecting:', err);
    res.status(500).json({ error: 'Failed to disconnect' });
  });
});

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

app.get('/api/messages', (req, res) => {
  // Esta implementação básica não armazena mensagens
  // Em uma implementação completa, você armazenaria mensagens em um banco de dados
  res.json({
    messages: {},
    total: 0,
    note: 'This simple implementation does not store message history'
  });
});

app.get('/api/messages/:number', (req, res) => {
  // Esta implementação básica não armazena mensagens
  res.json({
    number: req.params.number,
    messages: [],
    note: 'This simple implementation does not store message history'
  });
});

app.delete('/api/messages', (req, res) => {
  // Simular limpeza de mensagens
  res.json({
    success: true,
    note: 'This simple implementation does not store message history'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`WhatsApp API server running on port ${PORT}`);
});