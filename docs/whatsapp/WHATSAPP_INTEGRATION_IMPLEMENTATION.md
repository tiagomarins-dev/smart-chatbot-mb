# Implementação da Integração WhatsApp

Este documento descreve detalhadamente a implementação da integração do WhatsApp com o sistema, incluindo arquitetura, configuração, endpoints e solução de problemas.

## Arquitetura da Integração

A integração com o WhatsApp é realizada através de uma arquitetura de três camadas:

1. **Servidor WhatsApp API** (porta 9029)
   - Serviço Node.js independente que gerencia a conexão com o WhatsApp Web
   - Fornece endpoints REST para interagir com o WhatsApp
   - Executa em um container Docker próprio

2. **Backend** (porta 9033)
   - Atua como intermediário entre o frontend e o servidor WhatsApp
   - Armazena mensagens e interações no banco de dados Supabase
   - Gerencia associações entre leads e conversas

3. **Frontend** (porta 9034)
   - Interface de usuário para visualizar e interagir com as conversas
   - Envia requisições para o backend
   - Exibe status da conexão e QR code quando necessário

Esta separação permite que cada componente possa ser atualizado ou substituído independentemente.

## Servidor WhatsApp API

### Configuração

O servidor WhatsApp API é executado em um container Docker separado, exposto na porta 9029.

**Principais arquivos:**
- `backend/whatsapp-api/index.js` - Arquivo principal do servidor
- `backend/whatsapp-api/message-listener.js` - Gerencia eventos de mensagens
- `backend/whatsapp-api/Dockerfile` - Configuração do container

**Variáveis de ambiente:**
```
PORT=3000                         # Porta interna (mapeada para 9029)
WEBHOOK_URL=http://backend:3000/api/whatsapp/webhooks/whatsapp  # URL para envio de webhooks
WA_DATA_PATH=./wa_data            # Diretório para armazenar dados de autenticação
CAPTURE_EXTERNAL_MESSAGES=true    # Capturar mensagens de dispositivos externos
```

### Endpoints da API WhatsApp

| Endpoint | Método | Descrição | Resposta |
|----------|--------|-----------|----------|
| `/api/status` | GET | Retorna o status da conexão | `{ status, qrCode, phoneNumber }` |
| `/api/qrcode` | GET | Retorna o QR code para autenticação | `{ qrcode }` |
| `/api/connect` | POST | Inicia o processo de conexão | `{ status, message }` |
| `/api/send` | POST | Envia uma mensagem para um número | `{ messageId, timestamp }` |
| `/api/messages` | GET | Retorna histórico de mensagens | `{ messages }` |
| `/api/messages/:number` | GET | Mensagens de um contato específico | `{ number, messages }` |
| `/api/phone` | GET | Retorna o número conectado | `{ phoneNumber }` |

### Estados de Conexão

O servidor WhatsApp mantém os seguintes estados:
- `disconnected` - Não conectado ao WhatsApp
- `initializing` - Iniciando processo de conexão
- `qr_received` - QR code disponível para escaneamento
- `authenticated` - Autenticado, mas ainda não totalmente conectado
- `connected` - Totalmente conectado e pronto para uso
- `error` - Erro na conexão

## Backend (Integração)

### Controlador WhatsApp

O arquivo `backend/src/controllers/whatsappController.ts` gerencia a comunicação entre o frontend e o servidor WhatsApp API.

**Principais responsabilidades:**
- Proxy para os endpoints da API WhatsApp
- Armazenamento de mensagens no Supabase
- Associação de mensagens com leads
- Processamento de webhooks de mensagens
- Integração com chatbot para respostas automáticas

### Webhook de Mensagens

O servidor WhatsApp envia eventos para o endpoint `/api/whatsapp/webhooks/whatsapp` no backend. Estes eventos incluem:
- Mensagens recebidas
- Mensagens enviadas
- Mudanças de status da conexão

Formato do webhook:
```json
{
  "type": "message",
  "data": {
    "from": "5521998739574@c.us",
    "to": "5521987654321@c.us",
    "body": "Conteúdo da mensagem",
    "timestamp": "2025-05-09T20:27:38.885Z",
    "type": "chat",
    "id": "3EB0AFF6F25187BF061F60",
    "fromMe": true,
    "source": "api"
  },
  "timestamp": "2025-05-09T20:27:38.885Z"
}
```

### Armazenamento no Banco de Dados

As mensagens são armazenadas em duas tabelas:

1. **lead_events**
   - Registra eventos relacionados aos leads, incluindo mensagens WhatsApp
   - Mantém compatibilidade com a estrutura de eventos existente

2. **whatsapp_conversations**
   - Armazena detalhes específicos de conversas WhatsApp
   - Permite análise de sentimento e processamento por IA
   - Rastreia tempos de resposta e métricas de atendimento

## Frontend (Interface)

### API WhatsApp

O arquivo `frontend/src/api/whatsapp.ts` define os métodos para interagir com a API WhatsApp através do backend:

```typescript
export const whatsappApi = {
  getStatus,       // Verificar status da conexão
  getQRCode,       // Obter QR code para autenticação
  connect,         // Iniciar processo de conexão 
  disconnect,      // Desconectar do WhatsApp
  sendMessage,     // Enviar mensagem
  getMessages,     // Obter histórico de mensagens
  getContactMessages, // Obter mensagens de um contato
  clearMessages,   // Limpar histórico de mensagens
  getQRCodePlain,  // Obter QR code em texto plano
  getPhone,        // Obter número conectado
  mockAuthenticate // Simulação de autenticação para testes
};
```

### Interface do Usuário

A página principal de WhatsApp está em `frontend/pages/whatsapp/index.tsx`:
- Exibe o status da conexão
- Mostra QR code quando necessário para autenticação
- Lista contatos e conversas
- Permite enviar mensagens
- Exibe métricas de atendimento

Foi criada também uma página de diagnóstico em `frontend/pages/whatsapp/diagnostico.tsx` para facilitar a solução de problemas.

## Fluxo de Comunicação

1. **Autenticação Inicial**
   - Frontend verifica status através de `/api/status`
   - Se desconectado, inicia conexão com `/api/connect`
   - Exibe QR code obtido de `/api/qrcode`
   - Usuário escaneia QR code com o aplicativo WhatsApp
   - Servidor atualiza status para `connected`

2. **Envio de Mensagem**
   - Frontend envia requisição para `/api/send`
   - Backend encaminha para o servidor WhatsApp
   - Mensagem é enviada pelo WhatsApp
   - Confirmação é retornada ao frontend
   - Backend registra a mensagem no banco de dados

3. **Recebimento de Mensagem**
   - Mensagem chega no WhatsApp
   - Servidor WhatsApp envia webhook para o backend
   - Backend processa a mensagem e a associa a um lead
   - Backend registra a mensagem no banco de dados
   - Frontend busca mensagens atualizadas periodicamente

## Scripts para Testes e Diagnósticos

Foram criados diversos scripts para facilitar testes e diagnósticos:

- `test-whatsapp-connection.sh` - Verifica a conexão com o servidor WhatsApp
- `test-whatsapp-endpoints.sh` - Testa todos os endpoints da API
- `fix-whatsapp-connection.sh` - Corrige problemas de conexão

Estes scripts estão organizados no diretório `scripts/test-utils/`.

## Página de Diagnóstico

A página de diagnóstico em `http://localhost:9034/whatsapp/diagnostico` permite:
- Verificar o status atual da conexão
- Visualizar logs detalhados
- Testar a conexão diretamente
- Identificar problemas de comunicação entre componentes

## Considerações de Segurança

1. **Autenticação**
   - A sessão do WhatsApp é armazenada localmente no servidor
   - Tokens de autenticação não são expostos ao frontend
   - Utilize a página apenas em redes seguras

2. **Controle de Acesso**
   - Apenas usuários autenticados podem acessar a página do WhatsApp
   - As mensagens são associadas aos usuários que as enviaram
   - O histórico de mensagens é específico para cada lead

## Solução de Problemas

### Servidor WhatsApp não Conecta

1. Verifique se o servidor está rodando:
   ```bash
   curl http://localhost:9029/api/status
   ```

2. Reinicie o servidor:
   ```bash
   docker restart whatsapp-api
   ```

3. Verifique logs do container:
   ```bash
   docker logs whatsapp-api
   ```

### Mensagens não São Enviadas

1. Verifique o status da conexão na página de diagnóstico
2. Teste o envio de mensagem via API:
   ```bash
   curl -X POST http://localhost:9029/api/send \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber":"5521999999999", "message":"Teste"}'
   ```
3. Verifique se o número está no formato correto (apenas dígitos)

### Frontend não Exibe Status Correto

1. Verifique o console do navegador para erros
2. Execute o script de correção:
   ```bash
   ./fix-whatsapp-connection.sh
   ```
3. Reinicie o frontend:
   ```bash
   docker-compose restart frontend
   ```

## Próximos Passos e Melhorias

1. **Escalabilidade**
   - Implementar suporte a múltiplas conexões WhatsApp
   - Adicionar filas para gerenciamento de mensagens em alta escala

2. **Recursos Adicionais**
   - Suporte para mensagens multimídia (imagens, áudio, etc.)
   - Templates de mensagens predefinidos
   - Agendamento de mensagens

3. **Análise e IA**
   - Melhorar análise de sentimento nas conversas
   - Expandir capacidades do chatbot para respostas automáticas
   - Categorização automática de mensagens

## Referências

1. [WhatsApp Web.js Documentation](https://wwebjs.dev/)
2. [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/api/reference)
3. [Guia de Testes da Integração WhatsApp](./WHATSAPP_TESTING_GUIDE.md)
4. [Implementação de Chatbot Smart para WhatsApp](./WHATSAPP_SMART_CHATBOT.md)