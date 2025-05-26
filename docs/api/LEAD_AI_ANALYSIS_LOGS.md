# Lead AI Analysis Logs API

## Endpoint

`GET /api/leads/:id/ai-analysis-logs`

## Descrição

Retorna os logs de análise de IA de um lead específico em formato JSON. Cada log contém informações sobre quando a análise foi executada, o resultado, métricas de desempenho e possíveis erros.

## Autenticação

Requer token JWT no header Authorization:
```
Authorization: Bearer {token}
```

## Parâmetros

### Path Parameters
- `id` (required): UUID do lead

### Query Parameters
- `limit` (optional): Número de registros a retornar (padrão: 20)
- `offset` (optional): Número de registros a pular para paginação (padrão: 0)

## Exemplo de Requisição

```bash
curl -X GET "http://localhost:9033/api/leads/123e4567-e89b-12d3-a456-426614174000/ai-analysis-logs?limit=10&offset=0" \
  -H "Authorization: Bearer {token}"
```

## Exemplo de Resposta

```json
{
  "status": "success",
  "data": {
    "logs": [
      {
        "id": "987fcdeb-51a2-43d1-b123-456789012345",
        "lead_id": "123e4567-e89b-12d3-a456-426614174000",
        "analyzed_at": "2024-01-20T14:30:00.000Z",
        "success": true,
        "sentiment_status": "interessado",
        "lead_score": 75,
        "ai_model": "gpt-3.5-turbo",
        "prompt_tokens": 1250,
        "completion_tokens": 350,
        "total_tokens": 1600,
        "response_time_ms": 2500,
        "error_message": null,
        "trigger_source": "event_creation",
        "trigger_details": {
          "event_type": "clicked_payment_link",
          "event_id": "abc123"
        },
        "created_at": "2024-01-20T14:30:02.000Z"
      },
      {
        "id": "876fcdeb-41a2-33d1-a123-345678901234",
        "lead_id": "123e4567-e89b-12d3-a456-426614174000",
        "analyzed_at": "2024-01-19T10:15:00.000Z",
        "success": false,
        "sentiment_status": null,
        "lead_score": null,
        "ai_model": "gpt-3.5-turbo",
        "prompt_tokens": null,
        "completion_tokens": null,
        "total_tokens": null,
        "response_time_ms": 5000,
        "error_message": "AI service timeout",
        "trigger_source": "manual",
        "trigger_details": {
          "user_id": "user123",
          "reason": "Manual analysis requested"
        },
        "created_at": "2024-01-19T10:15:05.000Z"
      }
    ],
    "total": 15
  }
}
```

## Campos de Resposta

### Estrutura do Log

- `id`: UUID único do log
- `lead_id`: UUID do lead analisado
- `analyzed_at`: Timestamp de quando a análise foi executada
- `success`: Boolean indicando se a análise foi bem-sucedida
- `sentiment_status`: Status de sentimento identificado (interessado, sem interesse, compra futura, etc.)
- `lead_score`: Pontuação do lead de 0 a 100
- `ai_model`: Modelo de IA utilizado na análise
- `prompt_tokens`: Número de tokens usados no prompt
- `completion_tokens`: Número de tokens na resposta
- `total_tokens`: Total de tokens consumidos
- `response_time_ms`: Tempo de resposta em milissegundos
- `error_message`: Mensagem de erro se a análise falhou
- `trigger_source`: O que disparou a análise:
  - `event_creation`: Criação de novo evento
  - `manual`: Análise manual via API
  - `cron`: Job agendado
  - `automated_message`: Sistema de mensagens automatizadas
- `trigger_details`: Detalhes adicionais sobre o trigger (JSON)
- `created_at`: Timestamp de criação do registro

## Códigos de Status

- `200 OK`: Logs retornados com sucesso
- `401 Unauthorized`: Token inválido ou ausente
- `404 Not Found`: Lead não encontrado ou não autorizado
- `500 Internal Server Error`: Erro no servidor

## Observações

- Os logs são ordenados por `analyzed_at` em ordem decrescente (mais recentes primeiro)
- Apenas usuários autenticados podem visualizar logs de seus próprios leads
- O campo `trigger_details` contém informações contextuais sobre o que disparou a análise
- Análises mal-sucedidas também são registradas com detalhes do erro