/**
 * Correção da API WhatsApp no Frontend
 * 
 * Este script corrige o erro de processamento na resposta da API
 * e ajusta os endpoints para corresponder aos do servidor.
 */

const fs = require('fs');
const path = require('path');

// Caminho para o arquivo da API WhatsApp
const whatsappApiFile = path.resolve(__dirname, '../../frontend/src/api/whatsapp.ts');

console.log('Corrigindo API WhatsApp no frontend...');
console.log(`Arquivo: ${whatsappApiFile}`);

// Verificar se o arquivo existe
if (!fs.existsSync(whatsappApiFile)) {
  console.error('Arquivo não encontrado!');
  process.exit(1);
}

// Ler o conteúdo do arquivo
let content = fs.readFileSync(whatsappApiFile, 'utf8');

// 1. Corrigir processamento da resposta de status
console.log('1. Corrigindo processamento da resposta de status...');
const oldStatusProcessing = `// Extrair dados da resposta seguindo a estrutura do backend
      const statusData: WhatsAppStatus = {
        status: json.data?.status || 'disconnected',
        authenticated: json.data?.authenticated || false,
        phoneNumber: json.data?.phoneNumber || null,
        timestamp: json.data?.timestamp || new Date().toISOString()
      };`;

const newStatusProcessing = `// Extrair dados da resposta seguindo a estrutura do backend
      // Nota: A API retorna diretamente {status, qrCode, phoneNumber} sem estar dentro de um campo "data"
      const statusData: WhatsAppStatus = {
        status: json.status || 'disconnected',
        authenticated: json.status === 'connected', 
        phoneNumber: json.phoneNumber || null,
        timestamp: json.timestamp || new Date().toISOString()
      };`;

content = content.replace(oldStatusProcessing, newStatusProcessing);

// 2. Corrigir a função getApiBaseUrl
console.log('2. Garantindo que a função getApiBaseUrl sempre aponte para a porta 9029...');
const oldApiBaseUrl = `// API WhatsApp - sempre apontando para a porta 9029
const getApiBaseUrl = (): string => {
  // Sempre apontar para localhost:9029, independente do ambiente
  return 'http://localhost:9029/api/whatsapp';
};`;

const newApiBaseUrl = `// API WhatsApp - sempre apontando para a porta 9029
const getApiBaseUrl = (): string => {
  // Sempre apontar para localhost:9029, independente do ambiente
  return 'http://localhost:9029';
};`;

content = content.replace(oldApiBaseUrl, newApiBaseUrl);

// 3. Corrigir os endpoints para remover o prefixo /api/whatsapp
console.log('3. Corrigindo endpoints para corresponder ao servidor...');

// Função getStatus
content = content.replace(
  `const response = await fetch(\`\${apiUrl}/status\`);`,
  `const response = await fetch(\`\${apiUrl}/api/status\`);`
);

// Função getQRCode
content = content.replace(
  `const response = await fetch(\`\${apiUrl}/qrcode\`);`,
  `const response = await fetch(\`\${apiUrl}/api/qrcode\`);`
);

// Função connect
content = content.replace(
  `const response = await fetch(\`\${apiUrl}/connect\`, {`,
  `const response = await fetch(\`\${apiUrl}/api/connect\`, {`
);

// Função disconnect
content = content.replace(
  `const response = await fetch(\`\${apiUrl}/disconnect\`, {`,
  `const response = await fetch(\`\${apiUrl}/api/disconnect\`, {`
);

// Função sendMessage
content = content.replace(
  `const response = await fetch(\`\${apiUrl}/send\`, {`,
  `const response = await fetch(\`\${apiUrl}/api/send\`, {`
);

// Função getMessages
content = content.replace(
  `const response = await fetch(\`\${apiUrl}/messages\`);`,
  `const response = await fetch(\`\${apiUrl}/api/messages\`);`
);

// Função getContactMessages
content = content.replace(
  `const response = await fetch(\`\${apiUrl}/messages/\${number}\`);`,
  `const response = await fetch(\`\${apiUrl}/api/messages/\${number}\`);`
);

// Função clearMessages
content = content.replace(
  `const response = await fetch(\`\${apiUrl}/messages\`, {`,
  `const response = await fetch(\`\${apiUrl}/api/messages\`, {`
);

// Função getQRCodePlain
content = content.replace(
  `const response = await fetch(\`\${apiUrl}/qrcode/plain\`);`,
  `const response = await fetch(\`\${apiUrl}/api/qrcode/plain\`);`
);

// Função getPhone
content = content.replace(
  `const response = await fetch(\`\${apiUrl}/phone\`);`,
  `const response = await fetch(\`\${apiUrl}/api/phone\`);`
);

// Função mockAuthenticate
content = content.replace(
  `const response = await fetch(\`\${apiUrl}/mock/authenticate\`, {`,
  `const response = await fetch(\`\${apiUrl}/api/mock/authenticate\`, {`
);

// 4. Salvar as alterações
fs.writeFileSync(whatsappApiFile, content, 'utf8');
console.log('Arquivo atualizado com sucesso!');
console.log('Para aplicar as alterações, reinicie o frontend.');