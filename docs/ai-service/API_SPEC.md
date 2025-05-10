# Especificação da API do Serviço de IA

Este documento detalha as APIs REST expostas pelo serviço de IA.

## Base URL

```
https://api.seudominio.com/ai-service/v1
```

## Autenticação

Todas as requisições requerem autenticação utilizando um token JWT ou API Key.

**Usando JWT Token (Bearer Authentication)**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Usando API Key**
```
X-API-Key: seu_api_key_aqui
```

## Endpoints

### 1. Completions

#### Solicitação de Completion

**Endpoint**: `POST /completion`

**Descrição**: Gera uma completion de texto a partir de um prompt.

**Request Body**:
```json
{
  "prompt": "Escreva um parágrafo sobre inteligência artificial",
  "provider": "openai",
  "model": "gpt-3.5-turbo-instruct",
  "max_tokens": 150,
  "temperature": 0.7,
  "use_cache": true
}
```

**Parâmetros**:
- `prompt` (string, obrigatório): O texto de entrada para a IA
- `provider` (string, opcional): O provedor de IA a ser usado (default: configuração do sistema)
- `model` (string, opcional): O modelo específico a ser usado (default: configuração do sistema)
- `max_tokens` (int, opcional): Número máximo de tokens na resposta (default: 100)
- `temperature` (float, opcional): Controla aleatoriedade (0.0-1.0, default: 0.7)
- `use_cache` (boolean, opcional): Se deve usar o cache (default: true)

**Response**:
```json
{
  "text": "A inteligência artificial (IA) representa um campo da computação dedicado a criar sistemas capazes de realizar tarefas que normalmente exigiriam inteligência humana. Estas tarefas incluem reconhecimento de voz, tomada de decisões, tradução de idiomas e percepção visual. Com avanços significativos nas últimas décadas, a IA agora permeia muitos aspectos da vida cotidiana, desde assistentes virtuais e recomendações personalizadas até diagnósticos médicos e veículos autônomos.",
  "usage": {
    "prompt_tokens": 8,
    "completion_tokens": 83,
    "total_tokens": 91
  },
  "cached": false,
  "provider": "openai",
  "model": "gpt-3.5-turbo-instruct"
}
```

### 2. Chat

#### Solicitação de Resposta de Chat

**Endpoint**: `POST /chat`

**Descrição**: Gera uma resposta de chat baseada em uma sequência de mensagens.

**Request Body**:
```json
{
  "messages": [
    {"role": "system", "content": "Você é um assistente útil."},
    {"role": "user", "content": "Como posso melhorar a conversão de leads?"}
  ],
  "provider": "openai",
  "model": "gpt-4",
  "temperature": 0.5,
  "use_cache": true,
  "session_id": "user123_session_456"
}
```

**Parâmetros**:
- `messages` (array, obrigatório): Lista de mensagens na conversa
- `provider` (string, opcional): Provedor de IA (default: configuração do sistema)
- `model` (string, opcional): Modelo específico (default: configuração do sistema)
- `temperature` (float, opcional): Controla aleatoriedade (0.0-1.0, default: 0.7)
- `use_cache` (boolean, opcional): Se deve usar o cache (default: true)
- `session_id` (string, opcional): Identificador de sessão para contexto persistente

**Response**:
```json
{
  "message": {
    "role": "assistant",
    "content": "Para melhorar a conversão de leads, você pode implementar as seguintes estratégias:\n\n1. **Qualificação eficiente** - Use formulários apropriados para capturar informações relevantes\n2. **Resposta rápida** - Implemente atendimento imediato aos novos leads\n3. **Segmentação** - Adapte sua abordagem com base no perfil do lead\n4. **Nutrição de leads** - Mantenha contato regular com conteúdo de valor\n5. **Análise de comportamento** - Utilize análise de sentimento e interações para personalizar abordagens\n\nImplementar um sistema de pontuação (lead scoring) também ajuda a priorizar os leads com maior potencial de conversão."
  },
  "usage": {
    "prompt_tokens": 24,
    "completion_tokens": 142,
    "total_tokens": 166
  },
  "cached": false,
  "provider": "openai",
  "model": "gpt-4"
}
```

### 3. Embeddings

#### Solicitação de Embedding

**Endpoint**: `POST /embedding`

**Descrição**: Gera uma representação vetorial (embedding) para um texto.

**Request Body**:
```json
{
  "text": "Análise de sentimento para leads de vendas",
  "provider": "openai",
  "model": "text-embedding-ada-002",
  "use_cache": true
}
```

**Parâmetros**:
- `text` (string, obrigatório): Texto para gerar embedding
- `provider` (string, opcional): Provedor de IA (default: configuração do sistema)
- `model` (string, opcional): Modelo de embedding (default: configuração do sistema)
- `use_cache` (boolean, opcional): Se deve usar o cache (default: true)

**Response**:
```json
{
  "embedding": [0.0023651324, -0.009833820, 0.0223, ...],
  "dimensions": 1536,
  "usage": {
    "prompt_tokens": 7,
    "total_tokens": 7
  },
  "cached": false,
  "provider": "openai",
  "model": "text-embedding-ada-002"
}
```

### 4. Análise de Sentimento

#### Solicitação de Análise de Sentimento

**Endpoint**: `POST /sentiment`

**Descrição**: Analisa o sentimento e intenção de uma mensagem.

**Request Body**:
```json
{
  "text": "O preço está acima do que esperava, mas o produto parece ótimo. Vocês têm opções de parcelamento?",
  "provider": "openai",
  "model": "gpt-4",
  "use_cache": true,
  "context": {
    "product": "Apartamento",
    "previous_messages": 3
  }
}
```

**Parâmetros**:
- `text` (string, obrigatório): Texto para análise
- `provider` (string, opcional): Provedor de IA (default: configuração do sistema)
- `model` (string, opcional): Modelo específico (default: configuração do sistema)
- `use_cache` (boolean, opcional): Se deve usar o cache (default: true)
- `context` (object, opcional): Informações contextuais adicionais

**Response**:
```json
{
  "sentiment": {
    "score": 0.65,
    "label": "positive",
    "confidence": 0.85
  },
  "intent": {
    "primary": "inquiry",
    "secondary": "price_negotiation",
    "confidence": 0.92
  },
  "entities": {
    "price": {
      "sentiment": "negative",
      "confidence": 0.88
    },
    "product": {
      "sentiment": "positive",
      "confidence": 0.91
    },
    "payment_terms": {
      "sentiment": "neutral",
      "confidence": 0.94
    }
  },
  "lead_status": "achou caro",
  "lead_score": 72,
  "recommendations": [
    "Enfatizar o valor e qualidade do produto",
    "Oferecer detalhes sobre opções de parcelamento",
    "Não focar em descontos diretos"
  ],
  "cached": false,
  "provider": "openai",
  "model": "gpt-4"
}
```

### 5. Status do Serviço

#### Verificação de Saúde

**Endpoint**: `GET /health`

**Descrição**: Verifica o status do serviço e seus componentes.

**Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "providers": {
    "openai": {
      "status": "operational",
      "latency": 245
    }
  },
  "cache": {
    "status": "operational",
    "hits_ratio": 0.76
  },
  "timestamp": "2025-05-09T10:15:23Z"
}
```

### 6. Webhooks para Notificações

**Endpoint**: `POST /webhooks/register`

**Descrição**: Registra um webhook para receber notificações de eventos específicos.

**Request Body**:
```json
{
  "url": "https://seudominio.com/webhook-handler",
  "events": ["sentiment_analysis.completed", "error.rate_limit_reached"],
  "secret": "seu_webhook_secret"
}
```

**Response**:
```json
{
  "webhook_id": "wh_123456789",
  "status": "active",
  "events": ["sentiment_analysis.completed", "error.rate_limit_reached"],
  "created_at": "2025-05-09T10:20:00Z"
}
```

## Códigos de Status

- `200 OK`: Requisição bem-sucedida
- `400 Bad Request`: Parâmetros inválidos
- `401 Unauthorized`: Falha na autenticação
- `403 Forbidden`: Sem permissão para o recurso
- `404 Not Found`: Recurso não encontrado
- `429 Too Many Requests`: Limite de taxa excedido
- `500 Internal Server Error`: Erro interno do servidor
- `503 Service Unavailable`: Serviço indisponível

## Limitação de Taxa

O serviço implementa limitação de taxa por chave de API:

- Default: 60 requisições por minuto
- Tier Premium: 300 requisições por minuto

Cabeçalhos de resposta incluem:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1621972500
```

## Versionamento

A API é versionada através do caminho URL. Atualmente, a versão disponível é `v1`.

## Exemplo de Chamada Usando cURL

```bash
curl -X POST "https://api.seudominio.com/ai-service/v1/chat" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: seu_api_key_aqui" \
  -d '{
    "messages": [
      {"role": "system", "content": "Você é um assistente útil."},
      {"role": "user", "content": "Como posso melhorar a conversão de leads?"}
    ],
    "model": "gpt-4"
  }'
```