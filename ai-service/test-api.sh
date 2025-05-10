#\!/bin/bash

# Obter a API_KEY do arquivo .env
API_KEY=$(grep API_KEY .env | cut -d '=' -f2)

# Verificar se a API está online
echo "Verificando a API..."
curl -s http://localhost:8000/health | jq

echo "Testando o endpoint de mensagens do chatbot Ruth..."
curl -s -X POST http://localhost:8000/v1/lead-messages/ruth \
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
