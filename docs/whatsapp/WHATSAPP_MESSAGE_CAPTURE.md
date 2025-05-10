# Captura de Mensagens do WhatsApp

## Visão Geral

O sistema foi projetado para capturar todas as mensagens do WhatsApp, independentemente de como foram enviadas:

1. **Mensagens enviadas pela interface do sistema** (via API)
2. **Mensagens enviadas externamente** (via WhatsApp Web ou aplicativo móvel)
3. **Mensagens recebidas** (de clientes/leads)

Todas estas mensagens são armazenadas na tabela `whatsapp_conversations` para análise e histórico completo.

## Como Funciona

### 1. Mensagens Enviadas pela Interface

Quando um usuário envia uma mensagem pela interface do sistema:

1. A mensagem é enviada via endpoint `/api/whatsapp/send`
2. O controlador `sendMessage` processa a requisição
3. A mensagem é enviada via API do WhatsApp
4. Os dados da mensagem são registrados nas tabelas `lead_events` e `whatsapp_conversations`
5. O tempo de resposta é calculado automaticamente

### 2. Mensagens Recebidas

Quando um cliente/lead envia uma mensagem:

1. O serviço WhatsApp detecta a mensagem recebida
2. Um evento `message` é disparado e o webhook é chamado
3. O controlador `webhookHandler` processa o evento
4. A função `processMessageEvent` identifica o lead associado
5. Os dados da mensagem são registrados nas tabelas `lead_events` e `whatsapp_conversations`

### 3. Mensagens Enviadas Externamente

Quando alguém da equipe envia uma mensagem via WhatsApp Web ou celular:

1. O serviço WhatsApp detecta a criação da mensagem (evento `message_create`)
2. Um webhook é enviado, marcando a mensagem como `fromMe: true`
3. O controlador `webhookHandler` processa o evento
4. A função `processMessageEvent` identifica o lead associado
5. Os dados da mensagem são registrados nas tabelas `lead_events` e `whatsapp_conversations`
6. O tempo de resposta é calculado automaticamente

## Diagrama de Fluxo

```
    ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
    │  Interface Web    │     │  WhatsApp Web     │     │  Cliente/Lead     │
    │  (envio API)      │     │  (envio externo)  │     │  (recebimento)    │
    └────────┬──────────┘     └────────┬──────────┘     └────────┬──────────┘
             │                          │                         │
             ▼                          ▼                         ▼
    ┌───────────────────────────────────────────────────────────────────────┐
    │                        API do WhatsApp                                 │
    └────────────────────────────────────┬──────────────────────────────────┘
                                         │
                                         ▼
    ┌───────────────────────────────────────────────────────────────────────┐
    │                          Webhook Handler                               │
    └────────────────────────────────────┬──────────────────────────────────┘
                                         │
                                         ▼
    ┌───────────────────────────────────────────────────────────────────────┐
    │                    Processamento da Mensagem                           │
    │                                                                        │
    │   ┌───────────────┐        ┌──────────────────┐     ┌───────────────┐ │
    │   │ Identificação │        │ Registro em      │     │ Cálculo de    │ │
    │   │ do Lead       │──────▶ │ lead_events      │────▶│ Tempo de      │ │
    │   └───────────────┘        └──────────────────┘     │ Resposta      │ │
    │                                     │                └───────────────┘ │
    │                                     ▼                                  │
    │                            ┌──────────────────┐                        │
    │                            │ Registro em      │                        │
    │                            │ whatsapp_conv.   │                        │
    │                            └──────────────────┘                        │
    └───────────────────────────────────────────────────────────────────────┘
```

## Identificação de Leads

O sistema usa as seguintes estratégias para identificar o lead associado a uma mensagem:

1. **ID do Lead direto** - Se fornecido no payload do webhook
2. **Número de telefone** - Busca leads com números de telefone semelhantes
3. **Múltiplos formatos** - Verifica diferentes formatos de número (com/sem DDD, com/sem código do país)

## Registro no Banco de Dados

Cada mensagem é registrada em duas tabelas:

1. **lead_events** - Para manter compatibilidade com sistema existente
2. **whatsapp_conversations** - Para análise completa e processamento de IA

## Configuração

Para habilitar/desabilitar a captura de mensagens externas, use a variável de ambiente:

```
CAPTURE_EXTERNAL_MESSAGES=true  # default
```

## Campos de Diagnóstico

As mensagens incluem campos de diagnóstico:

- **source** - Origem da mensagem (api, webhook, external)
- **fromMe** - Flag indicando se a mensagem foi enviada pelo sistema
- **timestamp** - Data/hora da mensagem
- **direction** - Direção (incoming/outgoing)

## Troubleshooting

Se as mensagens enviadas externamente não estiverem sendo capturadas:

1. Verifique se `CAPTURE_EXTERNAL_MESSAGES` está habilitado
2. Verifique se o webhook está configurado corretamente
3. Verifique se o WhatsApp Web está conectado e funcionando
4. Verifique os logs do container `crm-whatsapp-api` para eventos `message_create`

## Limitações

- Mensagens enviadas antes da conexão do sistema não são capturadas
- Algumas mensagens podem não ser associadas a leads se o número não for encontrado
- Requer conexão ativa com o WhatsApp Web para funcionar