# Sistema de Eventos de Leads

Este documento descreve o sistema de rastreamento de eventos de leads, que permite registrar e analisar todas as interações e atividades dos leads ao longo do ciclo de vida do cliente.

## Visão Geral

O sistema de eventos de leads foi projetado para:

- Rastrear todos os tipos de interações com leads (mensagens WhatsApp, visitas ao site, envios de formulários, etc.)
- Manter um histórico completo de atividades de cada lead
- Permitir análises avançadas do comportamento do cliente
- Facilitar a integração com sistemas externos

## Modelo de Dados

### Evento de Lead
```
{
  "id": "uuid",
  "lead_id": "uuid", // Referência ao lead associado
  "event_type": "whatsapp_message", // Tipo do evento
  "event_data": { // Dados específicos do evento em formato JSON
    "direction": "incoming",
    "message": "Olá, gostaria de saber mais sobre o produto X",
    "messageId": "MESSAGE_ID",
    "timestamp": "2023-06-01T12:00:00Z"
  },
  "origin": "whatsapp", // Origem do evento
  "created_at": "2023-06-01T12:00:00Z" // Data de criação do registro
}
```

## Endpoints da API

### Capturar Evento de Lead

**URL**: `/api/events`  
**Método**: `POST`  
**Autenticação**: Bearer Token JWT ou API Key (opcional dependendo da configuração)

**Corpo da Requisição**:
```json
{
  "phone": "5521999998877", // Opcional, mas pelo menos phone ou email deve ser fornecido
  "email": "cliente@email.com", // Opcional, mas pelo menos phone ou email deve ser fornecido
  "event_type": "whatsapp_message", // Obrigatório
  "event_text": "Olá, gostaria de saber mais sobre o produto X", // Texto do evento
  "origin": "whatsapp", // Origem do evento
  "additional_data": { // Dados adicionais (opcional)
    "direction": "incoming",
    "messageId": "MESSAGE_ID",
    "timestamp": "2023-06-01T12:00:00Z"
  }
}
```

**Campos Obrigatórios**:
- `event_type`: Tipo do evento
- `phone` OU `email`: Pelo menos um identificador de lead deve ser fornecido

**Resposta de Sucesso**:
- Código: `200 OK`
- Conteúdo:
```json
{
  "success": true,
  "data": {
    "message": "Event captured successfully",
    "lead_id": "123e4567-e89b-12d3-a456-426614174000",
    "event_id": "123e4567-e89b-12d3-a456-426614174001"
  }
}
```

### Obter Eventos de um Lead

**URL**: `/api/lead-events/:id/events`  
**Método**: `GET`  
**Autenticação**: Bearer Token JWT ou API Key

**Parâmetros de URL**:
- `id`: UUID do lead

**Parâmetros de Consulta** (opcionais):
- `type`: Filtrar por tipo de evento
- `origin`: Filtrar por origem do evento

**Resposta de Sucesso**:
- Código: `200 OK`
- Conteúdo:
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "lead_id": "123e4567-e89b-12d3-a456-426614174000",
        "event_type": "whatsapp_message",
        "event_data": {
          "direction": "incoming",
          "message": "Olá, gostaria de saber mais sobre o produto X",
          "messageId": "MESSAGE_ID",
          "timestamp": "2023-06-01T12:00:00Z"
        },
        "origin": "whatsapp",
        "created_at": "2023-06-01T12:00:00Z"
      },
      {
        "id": "223e4567-e89b-12d3-a456-426614174002",
        "lead_id": "123e4567-e89b-12d3-a456-426614174000",
        "event_type": "form_submit",
        "event_data": {
          "form_id": "contact_form",
          "form_fields": {
            "name": "João da Silva",
            "message": "Preciso de mais informações"
          }
        },
        "origin": "website",
        "created_at": "2023-06-02T14:30:00Z"
      }
    ],
    "lead_id": "123e4567-e89b-12d3-a456-426614174000",
    "filters": {
      "type": null,
      "origin": null
    }
  }
}
```

### Obter Resumo de Eventos de um Lead

**URL**: `/api/lead-events/:id/events/summary`  
**Método**: `GET`  
**Autenticação**: Bearer Token JWT ou API Key

**Parâmetros de URL**:
- `id`: UUID do lead

**Resposta de Sucesso**:
- Código: `200 OK`
- Conteúdo:
```json
{
  "success": true,
  "data": {
    "lead_id": "123e4567-e89b-12d3-a456-426614174000",
    "total_events": 15,
    "last_activity": "2023-06-10T09:45:00Z",
    "events_by_type": {
      "whatsapp_message": 8,
      "form_submit": 2,
      "page_view": 5
    },
    "events_by_origin": {
      "whatsapp": 8,
      "website": 7
    }
  }
}
```

### Criar Evento para um Lead Específico

**URL**: `/api/lead-events/:id/events`  
**Método**: `POST`  
**Autenticação**: Bearer Token JWT ou API Key

**Parâmetros de URL**:
- `id`: UUID do lead

**Corpo da Requisição**:
```json
{
  "event_type": "whatsapp_message",
  "event_data": {
    "direction": "outgoing",
    "message": "Obrigado pelo contato, como posso ajudar?",
    "messageId": "MESSAGE_ID",
    "timestamp": "2023-06-01T12:10:00Z"
  },
  "origin": "whatsapp"
}
```

**Campos Obrigatórios**:
- `event_type`: Tipo do evento
- `event_data`: Dados específicos do evento

**Resposta de Sucesso**:
- Código: `200 OK`
- Conteúdo:
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "323e4567-e89b-12d3-a456-426614174003",
      "lead_id": "123e4567-e89b-12d3-a456-426614174000",
      "event_type": "whatsapp_message",
      "event_data": {
        "direction": "outgoing",
        "message": "Obrigado pelo contato, como posso ajudar?",
        "messageId": "MESSAGE_ID",
        "timestamp": "2023-06-01T12:10:00Z"
      },
      "origin": "whatsapp",
      "created_at": "2023-06-01T12:10:00Z"
    }
  }
}
```

## Integração com WhatsApp

O sistema de eventos de leads está integrado com o WhatsApp para registrar automaticamente:

1. **Mensagens Recebidas**: Quando um lead envia uma mensagem via WhatsApp, um evento é criado automaticamente
2. **Mensagens Enviadas**: Quando um usuário envia uma mensagem para um lead, um evento é registrado

### Campos Específicos de Eventos WhatsApp

Os eventos de tipo `whatsapp_message` incluem os seguintes dados:

```json
{
  "event_type": "whatsapp_message",
  "event_data": {
    "direction": "incoming|outgoing",
    "message": "Texto da mensagem",
    "messageId": "ID único da mensagem no WhatsApp",
    "timestamp": "Data/hora da mensagem"
  },
  "origin": "whatsapp"
}
```

## Tipos de Eventos Comuns

O sistema suporta diversos tipos de eventos, incluindo:

| Tipo de Evento | Descrição | Origens Típicas |
|----------------|-----------|----------------|
| `whatsapp_message` | Mensagem de WhatsApp enviada ou recebida | whatsapp |
| `form_submit` | Envio de formulário | website, landing_page |
| `page_view` | Visualização de página | website, landing_page |
| `email_opened` | Email aberto pelo lead | email |
| `email_clicked` | Link em email clicado | email |
| `status_change` | Mudança de status do lead | crm |
| `checkout_started` | Início de processo de checkout | website, app |
| `purchase` | Compra realizada | website, app, loja |
| `call` | Chamada telefônica | telefone |

## Exemplo de Uso para Rastreamento de Eventos via API

### Rastreando uma Visita ao Site

```javascript
// Exemplo de código JavaScript para frontend
async function trackPageView(leadEmail, pageName) {
  try {
    const response = await fetch('https://api.seudominio.com/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'SUA_API_KEY'
      },
      body: JSON.stringify({
        email: leadEmail, // Email do lead
        event_type: 'page_view',
        event_text: `Visitou a página ${pageName}`,
        origin: 'website',
        additional_data: {
          page: pageName,
          referrer: document.referrer,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    const result = await response.json();
    console.log('Evento registrado:', result);
  } catch (error) {
    console.error('Erro ao registrar evento:', error);
  }
}

// Usar a função quando um lead identificado visualiza uma página
trackPageView('cliente@email.com', 'Página de Produtos');
```

## Considerações de Segurança

- A API de captura de eventos (`/api/events`) pode ser configurada como pública para facilitar a integração com sistemas externos
- Para evitar spam, considere implementar limites de taxa (rate limiting) para esta API
- Verifique sempre se o lead existe antes de registrar eventos
- Considere utilizar HTTPS e tokens de API com escopo limitado para sistemas externos

## Compartilhamento de Acesso via Empresas

O sistema de eventos de leads suporta acesso compartilhado via a relação de usuários com empresas. Isso permite que múltiplos usuários da mesma empresa tenham acesso aos mesmos leads e seus eventos.

### Como Funciona o Acesso Compartilhado:

1. **Tabela `company_users`**:
   - Relaciona usuários com empresas
   - Define o papel (role) do usuário na empresa
   - Permite que usuários sejam membros de múltiplas empresas

2. **Políticas de Acesso**:
   - Usuários têm acesso direto aos eventos de leads que eles próprios criaram
   - Usuários também têm acesso aos eventos de leads associados a projetos de empresas às quais pertencem
   - O acesso é controlado por Row Level Security (RLS) no nível do banco de dados

3. **Fluxo de Compartilhamento**:
   ```
   Usuário 1 (dono da empresa) -> Adiciona Usuário 2 como membro da empresa
   Usuário 1 cria projeto na empresa
   Leads são capturados para o projeto
   Eventos são registrados para os leads
   Usuário 2 pode ver e gerenciar os leads e eventos por ser membro da empresa
   ```

### Considerações sobre Segurança

- Apenas donos de empresas podem adicionar novos membros
- Todas as ações são registradas com o usuário que as executou
- Acesso é automaticamente revogado quando um usuário é removido da empresa
- Políticas de RLS garantem que dados de diferentes empresas permaneçam isolados

## Próximos Passos

- Implementar visualização de linha do tempo de eventos na interface do usuário
- Adicionar métricas avançadas e análises de comportamento
- Integrar com sistema de automação de marketing para disparar ações com base em eventos
- Implementar segmentação de leads com base em padrões de eventos
- Adicionar controles de permissão mais granulares para o acesso compartilhado