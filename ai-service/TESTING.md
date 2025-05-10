# Guia de Testes - Smart Chatbot MB AI Service

Este documento fornece orientações para testar o serviço de IA do Smart Chatbot MB, incluindo os endpoints de geração de mensagens e o chatbot Ruth.

## Pré-requisitos

Antes de começar os testes, certifique-se de que:

1. O serviço está em execução (usando Docker ou diretamente com uvicorn)
2. Você possui uma API Key válida (configurada no arquivo `.env`)
3. Você possui uma chave de API da OpenAI válida (configurada no arquivo `.env`)

## Testando com o Script Automatizado

O projeto inclui um script de teste que verifica os principais endpoints:

```bash
./test-api.sh
```

Este script testará:
- A saúde do serviço (`/health`)
- O endpoint do chatbot Ruth (`/v1/lead-messages/ruth`)

## Testando Manualmente com cURL

### Verificação de Saúde

```bash
curl http://localhost:8000/health | jq
```

### Informações do Serviço

```bash
curl http://localhost:8000/info | jq
```

### Chatbot Ruth

```bash
export API_KEY=$(grep API_KEY .env | cut -d '=' -f2)

curl -X POST http://localhost:8000/v1/lead-messages/ruth \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "user_message": "Olá, gostaria de saber mais sobre o curso de redação",
    "conversation_history": [
      {
        "direction": "incoming",
        "content": "Olá, gostaria de saber mais sobre o curso de redação",
        "timestamp": "2023-06-01T10:15:00Z"
      }
    ]
  }' | jq
```

### Geração de Mensagem para Lead

```bash
export API_KEY=$(grep API_KEY .env | cut -d '=' -f2)

curl -X POST http://localhost:8000/v1/lead-messages/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "lead_info": {
      "id": "a5cd4a8d-1264-4752-b1a3-29e7e5740083",
      "name": "João Silva",
      "sentiment_status": "interessado",
      "lead_score": 85,
      "project_name": "Residencial Aurora"
    },
    "event_context": {
      "event_type": "visualizou_propriedade",
      "event_data": {
        "property_id": "123",
        "property_name": "Apartamento 101",
        "viewed_at": "2023-06-01T14:30:00Z"
      },
      "message_purpose": "follow_up"
    }
  }' | jq
```

## Testando com a Documentação OpenAPI

A maneira mais fácil de testar a API é usar a interface Swagger UI:

1. Abra o navegador e acesse `http://localhost:8000/docs`
2. Clique no botão "Authorize" e insira sua API Key
3. Expanda o endpoint que deseja testar
4. Clique em "Try it out"
5. Preencha os parâmetros necessários
6. Clique em "Execute"

## Monitorando os Logs

Para monitorar os logs do serviço em tempo real:

```bash
# Se estiver executando com Docker
docker-compose logs -f ai-service

# Se estiver executando diretamente
tail -f logs/app.log
```

## Testando com Python

Você também pode testar a API usando Python:

```python
import requests
import json

# Configurações
base_url = "http://localhost:8000"
api_key = "sua_api_key"  # Substitua pela sua chave

# Headers comuns
headers = {
    "Content-Type": "application/json",
    "X-API-Key": api_key
}

# Testar o chatbot Ruth
ruth_payload = {
    "user_message": "Olá, quero saber mais sobre o curso de redação para o ENEM",
    "conversation_history": []
}

response = requests.post(
    f"{base_url}/v1/lead-messages/ruth",
    headers=headers,
    data=json.dumps(ruth_payload)
)

print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
```

## Relatando Problemas

Se encontrar problemas durante os testes, verifique:

1. Os logs do serviço para erros específicos
2. Se as credenciais da OpenAI estão configuradas corretamente
3. Se o serviço Redis está funcionando (se o cache estiver habilitado)

Para problemas que persistirem, abra uma issue no repositório com:
- Detalhes do erro
- Payload da requisição
- Resposta recebida
- Logs relevantes
EOF < /dev/null