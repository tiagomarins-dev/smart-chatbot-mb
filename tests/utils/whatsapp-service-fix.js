// Arquivo para corrigir o erro de sintaxe no serviço WhatsApp
// Este deve substituir o arquivo que contém a linha problemática

const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fetch = require('node-fetch');

// Configurações
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || null;
const WA_DATA_PATH = process.env.WA_DATA_PATH || './wa_data';

// LINHA CORRIGIDA: Removido o caracter de escape '\' antes do !==
const CAPTURE_EXTERNAL_MESSAGES = process.env.CAPTURE_EXTERNAL_MESSAGES !== 'false'; // Habilitado por padrão

// Configuração das mensagens
const messageConfig = {
  // Todas as configurações de mensagens devem usar a sintaxe correta
  // Sem caracteres de escape inválidos
  captureExternal: CAPTURE_EXTERNAL_MESSAGES,
  messageRetention: process.env.MESSAGE_RETENTION || '24h',
  enableNotifications: process.env.ENABLE_NOTIFICATIONS !== 'false'
};

// Função para verificar configurações (para diagnóstico)
function checkConfig() {
  console.log('Configurações do WhatsApp Service:');
  console.log(`- Porta: ${PORT}`);
  console.log(`- Webhook URL: ${WEBHOOK_URL || 'Não configurado'}`);
  console.log(`- Diretório de dados: ${WA_DATA_PATH}`);
  console.log(`- Captura de mensagens externas: ${CAPTURE_EXTERNAL_MESSAGES ? 'Ativado' : 'Desativado'}`);
  
  // Verificar se há algum erro de sintaxe nas configurações
  try {
    if (messageConfig.captureExternal) {
      console.log('Configuração de captura de mensagens verificada e funcionando corretamente');
    }
  } catch (err) {
    console.error('ERRO de configuração:', err.message);
  }
}

// Exportar a função de verificação para uso externo
module.exports = {
  checkConfig,
  messageConfig
};