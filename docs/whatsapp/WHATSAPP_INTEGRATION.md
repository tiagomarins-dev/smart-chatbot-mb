# WhatsApp Integration

Este documento descreve a integração do sistema CRM com o WhatsApp usando o serviço Docker whatsapp-api.

## Arquitetura

A integração é composta por três partes principais:

1. **Frontend (Next.js)**: Interface de usuário para gerenciar a conexão com WhatsApp
2. **Backend (Express)**: API que serve como proxy para o serviço WhatsApp API
3. **WhatsApp API (Docker)**: Serviço de terceiros que gerencia a conexão com WhatsApp Web

## Configuração

### Docker Compose

A configuração do Docker Compose inclui:

```yaml
# docker-compose.yml
whatsapp-api:
  image: devlikeapro/whatsapp-api
  container_name: crm-whatsapp-api
  ports:
    - '9033:3000'
  volumes:
    - whatsapp_data:/app/wa_data
  environment:
    - WHATSAPP_API_PORT=3000
    - WHATSAPP_HOOK_URL=http://backend:3000/api/whatsapp/webhooks/whatsapp
    - WHATSAPP_HOOK_EVENTS=message,status
  depends_on:
    - backend
  restart: unless-stopped
```

Importante:
- O volume `whatsapp_data` persiste a sessão do WhatsApp entre reinicializações
- O webhook é configurado para enviar eventos de mensagem e status para o backend

## Endpoints da API

### Backend (Express)

O backend atua como um proxy entre o frontend e o serviço WhatsApp API:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/whatsapp/status` | GET | Obtém o status da conexão WhatsApp |
| `/api/whatsapp/qrcode` | GET | Obtém o QR code para autenticação |
| `/api/whatsapp/connect` | POST | Inicia a conexão com WhatsApp |
| `/api/whatsapp/disconnect` | POST | Desconecta do WhatsApp |
| `/api/whatsapp/send` | POST | Envia mensagem WhatsApp |
| `/api/whatsapp/messages` | GET | Lista todas as mensagens |
| `/api/whatsapp/messages/:number` | GET | Lista mensagens de um contato específico |
| `/api/whatsapp/messages` | DELETE | Limpa todas as mensagens |
| `/api/whatsapp/webhooks/whatsapp` | POST | Webhook para receber eventos do WhatsApp |

## Frontend (Next.js)

A página de WhatsApp no frontend oferece:

1. Visualização de status da conexão
2. Exibição do QR code para conexão
3. Botões para conectar e desconectar
4. Informações da sessão atual

## Uso

1. Acesse a página de WhatsApp no frontend
2. Clique em "Conectar WhatsApp"
3. Escaneie o QR code com seu telefone usando o WhatsApp
4. Após conectado, você pode enviar mensagens através da API

## Compatibilidade Docker

A integração foi projetada para funcionar tanto em ambiente de desenvolvimento local quanto em Docker:

- Em desenvolvimento: API WhatsApp acessada via `localhost:9033`
- Em Docker: API WhatsApp acessada via nome do serviço `whatsapp-api:3000`

## Limitações

- A conexão do WhatsApp permanece ativa apenas enquanto o container estiver em execução
- Recaptchas periódicos do WhatsApp podem exigir reconexão

## Integração com o Sistema de Eventos de Leads

A integração do WhatsApp com o sistema de eventos de leads permite rastrear todas as mensagens enviadas e recebidas, criando um histórico completo de interações para cada lead.

### Como Funciona

1. **Mensagens Recebidas**: Quando uma mensagem é recebida via webhook, o sistema:
   - Identifica o lead pelo número de telefone
   - Registra automaticamente um evento de tipo `whatsapp_message` com direção `incoming`
   - Armazena o conteúdo da mensagem e metadados relevantes

2. **Mensagens Enviadas**: Quando uma mensagem é enviada através da API, o sistema:
   - Aceita um parâmetro `lead_id` opcional para associar diretamente ao lead
   - Se `lead_id` não for fornecido, tenta identificar o lead pelo número de telefone
   - Registra um evento de tipo `whatsapp_message` com direção `outgoing`

### Estrutura de Dados dos Eventos

Os eventos de WhatsApp são registrados com a seguinte estrutura:

```json
{
  "lead_id": "uuid-do-lead",
  "event_type": "whatsapp_message",
  "event_data": {
    "direction": "incoming", // ou "outgoing"
    "message": "Texto da mensagem",
    "messageId": "ID único da mensagem no WhatsApp",
    "timestamp": "2023-06-01T12:00:00Z"
  },
  "origin": "whatsapp"
}
```

### API para Envio com Registro de Eventos

Para enviar uma mensagem e registrá-la como evento para um lead:

```bash
curl -X POST "http://localhost:9030/api/whatsapp/send" \
  -H "Authorization: Bearer [SEU_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5521999998877",
    "message": "Olá, tudo bem? Como posso ajudar?",
    "lead_id": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

Para mais detalhes sobre o sistema de eventos, consulte a [documentação de Eventos de Leads](./LEAD_EVENTS.md).

## Próximos Passos

- Implementar notificações em tempo real para mensagens recebidas
- Adicionar interface para visualizar e responder conversas
- Implementar interface unificada que mostre a linha do tempo de interações com o lead
- Adicionar suporte para templates de mensagem e campanhas automatizadas