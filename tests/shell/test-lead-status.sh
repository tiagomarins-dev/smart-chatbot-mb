#!/bin/bash

# Script para testar a atualização de status de leads

# Substitua esta API Key pela sua chave real
API_KEY="key_giKtUyw3hS0KAYUdOyVQevbS"

# Substitua este ID pelo ID de um lead válido
LEAD_ID="123e4567-e89b-12d3-a456-426614174000"

echo "Atualizando status do lead para 'qualificado'..."
curl -X PUT "http://localhost:9030/api/v1/leads/$LEAD_ID/status" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "status": "qualificado",
    "notes": "Lead qualificado após contato telefônico"
  }' \
  -v