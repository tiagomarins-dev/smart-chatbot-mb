# Guia de Testes da Integração WhatsApp

Este documento fornece instruções detalhadas para testar o sistema de integração WhatsApp, incluindo o envio de mensagens e a verificação do armazenamento no banco de dados.

## Pré-requisitos

1. Serviço WhatsApp rodando e autenticado
2. Backend conectado ao banco de dados Supabase
3. Acesso às credenciais do Supabase

## Scripts de Teste

Incluímos dois scripts para realizar testes:

### 1. Teste de Envio de Mensagem

**Arquivo**: `test-whatsapp-message.js`

Este script testa o fluxo completo:
- Verifica o status da conexão do WhatsApp
- Envia uma mensagem de teste para um número específico
- Verifica no Supabase se a mensagem foi armazenada corretamente

**Como usar**:

```bash
# Instalar dependências
npm install axios dotenv @supabase/supabase-js

# Executar o teste
node test-whatsapp-message.js
```

### 2. Verificação Direta no Supabase

**Arquivo**: `test-supabase-whatsapp.js`

Este script verifica diretamente o banco de dados:
- Testa a conexão com o Supabase
- Busca mensagens para um número específico
- Exibe as mensagens mais recentes no sistema

**Como usar**:

```bash
# Executar a verificação
node test-supabase-whatsapp.js
```

## Teste Manual

Para testar manualmente, siga os passos:

1. **Verificar status do WhatsApp**:
   ```bash
   curl http://localhost:9029/api/whatsapp/status
   ```

2. **Enviar mensagem de teste**:
   ```bash
   curl -X POST http://localhost:9029/api/whatsapp/send \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "5521998739574", "message": "Teste manual via curl"}'
   ```

3. **Verificar mensagens recentes**:
   ```bash
   curl http://localhost:9029/api/whatsapp/messages
   ```

## Verificação no Banco de Dados

Para verificar diretamente no Supabase:

1. Acesse o painel do Supabase
2. Navegue até a tabela `whatsapp_conversations`
3. Busque mensagens pelo número de telefone ou ID do lead
4. Verifique se os campos estão preenchidos corretamente:
   - ID único da mensagem
   - Referência ao lead
   - Direção (incoming/outgoing)
   - Conteúdo da mensagem
   - Timestamp

## Solução de Problemas

### Serviço WhatsApp não conecta

1. Verifique os logs do container:
   ```bash
   docker logs whatsapp-web-api
   ```

2. Reinicie o serviço:
   ```bash
   docker restart whatsapp-web-api
   ```

3. Verifique se há erros de sintaxe nos arquivos:
   - Arquivo principal: `index.js`
   - Serviço WhatsApp: `services/whatsapp.js`
   - Message Listener: `services/message-listener.js`

### Mensagens não aparecem no banco

1. Verifique se o webhook está configurado corretamente:
   ```
   WEBHOOK_URL=http://backend:3000/api/whatsapp/webhooks/whatsapp
   ```

2. Verifique os logs do backend para confirmar que está recebendo webhooks:
   ```bash
   docker logs backend
   ```

3. Teste o webhook diretamente:
   ```bash
   curl -X POST http://localhost:3000/api/whatsapp/webhooks/whatsapp \
     -H "Content-Type: application/json" \
     -d '{"event":"message","data":{"from":"5521999999999@c.us","to":"5521987654321@c.us","body":"Teste de webhook manual","fromMe":true}}'
   ```

## Formato do Webhook

O serviço WhatsApp envia webhooks no seguinte formato:

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

## Extensão da Implementação

Para implementar novos recursos ou integrações:

1. Adicione novos endpoints no arquivo `routes/whatsapp.js`
2. Implemente a lógica no controlador `controllers/whatsapp.js`
3. Se necessário, estenda o serviço `services/whatsapp.js`
4. Mantenha a documentação atualizada