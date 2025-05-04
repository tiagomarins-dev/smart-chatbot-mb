const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Estado global
let whatsappClient = null;
let connectionStatus = 'disconnected';
let qrCodeImage = null;
let receivedMessages = {}; // Objeto para armazenar mensagens recebidas por número

// Inicializar o cliente WhatsApp
function initializeWhatsAppClient() {
  whatsappClient = new Client({
    authStrategy: new LocalAuth({ clientId: 'smart-chatbot' }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: '/usr/bin/chromium',
    }
  });

  // Evento de QR code
  whatsappClient.on('qr', async (qr) => {
    connectionStatus = 'qr_received';
    
    try {
      qrCodeImage = await qrcode.toDataURL(qr);
      console.log('QR Code gerado');
    } catch (err) {
      console.error('Erro ao gerar QR code:', err);
    }
  });

  // Evento de autenticação
  whatsappClient.on('authenticated', () => {
    connectionStatus = 'authenticated';
    console.log('WhatsApp autenticado');
  });

  // Evento de inicialização
  whatsappClient.on('ready', () => {
    connectionStatus = 'connected';
    console.log('WhatsApp pronto para uso');
  });

  // Evento de desconexão
  whatsappClient.on('disconnected', (reason) => {
    connectionStatus = 'disconnected';
    qrCodeImage = null;
    receivedMessages = {}; // Limpar mensagens ao desconectar
    console.log('WhatsApp desconectado:', reason);
  });
  
  // Evento de mensagem recebida
  whatsappClient.on('message', (msg) => {
    const isFromMe = msg.fromMe;
    let chatId;
    
    // Determinar o ID do chat (número)
    if (isFromMe) {
      // Se a mensagem for de nós mesmos, o número está em "to"
      chatId = msg.to.split('@')[0]; // Remove o @c.us do ID
    } else {
      // Se a mensagem for de outra pessoa, o número está em "from"
      chatId = msg.from.split('@')[0]; // Remove o @c.us do ID
    }
    
    const messageBody = msg.body;
    const timestamp = new Date().toISOString();
    
    // Inicializar o array de mensagens para este número se ainda não existir
    if (!receivedMessages[chatId]) {
      receivedMessages[chatId] = [];
    }
    
    // Adicionar a nova mensagem ao início da lista (mais recentes primeiro)
    receivedMessages[chatId].unshift({
      body: messageBody,
      timestamp: timestamp,
      id: msg.id.id, // ID único da mensagem
      fromMe: isFromMe // Adicionar flag indicando se a mensagem é do usuário
    });
    
    // Limitar a 50 mensagens por número para evitar consumo excessivo de memória
    if (receivedMessages[chatId].length > 50) {
      receivedMessages[chatId] = receivedMessages[chatId].slice(0, 50);
    }
    
    if (isFromMe) {
      console.log(`Nova mensagem enviada para ${chatId}: ${messageBody}`);
    } else {
      console.log(`Nova mensagem recebida de ${chatId}: ${messageBody}`);
    }
  });
  
  // Evento de mensagem criada - captura mensagens enviadas de outros dispositivos
  whatsappClient.on('message_create', (msg) => {
    // Apenas processar mensagens enviadas por mim (do meu número) de outros dispositivos
    if (msg.fromMe) {
      const chatId = msg.to.split('@')[0]; // O destinatário da mensagem
      const messageBody = msg.body;
      const timestamp = new Date().toISOString();
      
      console.log(`Nova mensagem enviada de outro dispositivo para ${chatId}: ${messageBody}`);
      
      // Inicializar o array de mensagens para este número se ainda não existir
      if (!receivedMessages[chatId]) {
        receivedMessages[chatId] = [];
      }
      
      // Verificar se a mensagem já existe para evitar duplicatas
      const isDuplicate = receivedMessages[chatId].some(m => m.id === msg.id.id);
      
      if (!isDuplicate) {
        // Adicionar a nova mensagem ao início da lista
        receivedMessages[chatId].unshift({
          body: messageBody,
          timestamp: timestamp,
          id: msg.id.id,
          fromMe: true, // Esta mensagem foi enviada por mim
          fromOtherDevice: true // Marca que veio de outro dispositivo
        });
        
        // Limitar a 50 mensagens por número
        if (receivedMessages[chatId].length > 50) {
          receivedMessages[chatId] = receivedMessages[chatId].slice(0, 50);
        }
      }
    }
  });
  
  // Evento para capturar histórico de mensagens
  whatsappClient.on('ready', async () => {
    try {
      console.log('Carregando histórico de conversas recentes...');
      
      // Obter todas as conversas (chats)
      const chats = await whatsappClient.getChats();
      
      // Percorrer as conversas recentes (limitado a 20 para não sobrecarregar)
      for (const chat of chats.slice(0, 20)) {
        if (chat.isGroup) continue; // Pular grupos por enquanto
        
        // Obter mensagens recentes desta conversa
        const messages = await chat.fetchMessages({ limit: 20 });
        
        // Formatar o ID do chat
        const chatId = chat.id.user;
        
        // Inicializar o array para este chat se necessário
        if (!receivedMessages[chatId]) {
          receivedMessages[chatId] = [];
        }
        
        // Adicionar mensagens recentes ao histórico
        for (const msg of messages) {
          // Verificar se a mensagem já existe
          const isDuplicate = receivedMessages[chatId].some(m => m.id === msg.id.id);
          
          if (!isDuplicate) {
            receivedMessages[chatId].unshift({
              body: msg.body,
              timestamp: msg.timestamp ? new Date(msg.timestamp * 1000).toISOString() : new Date().toISOString(),
              id: msg.id.id,
              fromMe: msg.fromMe
            });
          }
        }
        
        // Ordenar mensagens por timestamp (mais recentes primeiro)
        receivedMessages[chatId].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Limitar a 50 mensagens por conversa
        if (receivedMessages[chatId].length > 50) {
          receivedMessages[chatId] = receivedMessages[chatId].slice(0, 50);
        }
      }
      
      console.log('Histórico de conversas carregado.');
    } catch (err) {
      console.error('Erro ao carregar histórico de conversas:', err);
    }
  });

  // Inicializar o cliente
  whatsappClient.initialize().catch(err => {
    console.error('Erro ao inicializar o WhatsApp:', err);
    connectionStatus = 'error';
  });
}

// Rotas API
app.get('/api/status', (req, res) => {
  res.json({
    status: connectionStatus,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/qrcode', (req, res) => {
  if (qrCodeImage) {
    res.json({ qrcode: qrCodeImage });
  } else {
    res.status(404).json({ error: 'QR Code não disponível' });
  }
});

app.post('/api/connect', (req, res) => {
  if (whatsappClient && (connectionStatus === 'connected' || connectionStatus === 'authenticated')) {
    res.status(409).json({ error: 'WhatsApp já está conectado' });
    return;
  }
  
  // Resetar a conexão existente se houver
  if (whatsappClient) {
    try {
      whatsappClient.destroy();
    } catch (err) {
      console.error('Erro ao destruir cliente anterior:', err);
    }
  }
  
  // Iniciar nova conexão
  connectionStatus = 'initializing';
  initializeWhatsAppClient();
  
  res.json({ status: 'initializing' });
});

app.post('/api/disconnect', (req, res) => {
  if (!whatsappClient || connectionStatus === 'disconnected') {
    res.status(409).json({ error: 'WhatsApp não está conectado' });
    return;
  }
  
  try {
    whatsappClient.destroy();
    whatsappClient = null;
    connectionStatus = 'disconnected';
    qrCodeImage = null;
    res.json({ status: 'disconnected' });
  } catch (err) {
    console.error('Erro ao desconectar:', err);
    res.status(500).json({ error: 'Erro ao desconectar' });
  }
});

// Endpoint para enviar mensagem
app.post('/api/send', async (req, res) => {
  if (!whatsappClient || connectionStatus !== 'connected') {
    res.status(409).json({ error: 'WhatsApp não está conectado' });
    return;
  }
  
  const { number, message } = req.body;
  
  if (!number || !message) {
    res.status(400).json({ error: 'Número e mensagem são obrigatórios' });
    return;
  }
  
  try {
    // Formatar número para o formato internacional
    const formattedNumber = formatPhoneNumber(number);
    const whatsappId = `${formattedNumber}@c.us`;
    
    console.log(`Tentando enviar mensagem para: ${whatsappId}`);
    
    // Método simplificado para enviar mensagem
    // Não verifica se o usuário está registrado para evitar possíveis erros
    await whatsappClient.sendMessage(whatsappId, message);
    
    console.log(`Mensagem enviada com sucesso para: ${whatsappId}`);
    res.json({ success: true, to: formattedNumber, status: 'sent' });
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// Endpoint para obter mensagens recebidas
app.get('/api/messages', (req, res) => {
  if (!whatsappClient || connectionStatus !== 'connected') {
    res.status(409).json({ error: 'WhatsApp não está conectado' });
    return;
  }
  
  // Retorna todas as mensagens agrupadas por número
  res.json({
    messages: receivedMessages,
    total: Object.keys(receivedMessages).length
  });
});

// Endpoint para obter mensagens de um número específico
app.get('/api/messages/:number', (req, res) => {
  if (!whatsappClient || connectionStatus !== 'connected') {
    res.status(409).json({ error: 'WhatsApp não está conectado' });
    return;
  }
  
  const number = formatPhoneNumber(req.params.number);
  
  if (!receivedMessages[number]) {
    res.json({ messages: [] });
    return;
  }
  
  res.json({ 
    number: number,
    messages: receivedMessages[number]
  });
});

// Endpoint para limpar todas as mensagens
app.delete('/api/messages', (req, res) => {
  if (!whatsappClient || connectionStatus !== 'connected') {
    res.status(409).json({ error: 'WhatsApp não está conectado' });
    return;
  }
  
  receivedMessages = {};
  res.json({ success: true, message: 'Todas as mensagens foram removidas' });
});

// Função para formatar número de telefone
function formatPhoneNumber(number) {
  // Remover caracteres não numéricos
  let cleaned = number.replace(/\D/g, '');
  
  // Para o WhatsApp Web JS, o número deve estar no formato internacional sem o '+'
  // Se não começar com 55 (código do Brasil), adicionar
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});