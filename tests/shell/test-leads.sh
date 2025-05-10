#!/bin/bash

# Script para testar a API de leads

# API Key para teste
API_KEY="key_giKtUyw3hS0KAYUdOyVQevbS"

# ID de projeto para teste
PROJECT_ID="1"

echo "Testando captura de lead..."
curl -X POST "http://localhost:9030/api/v1/leads" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "project_id": "'$PROJECT_ID'",
    "name": "João da Silva",
    "email": "joao@example.com",
    "phone": "5521999998877",
    "notes": "Lead de teste",
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "summer_promo",
    "utm_term": "marketing digital",
    "utm_content": "banner_top"
  }' \
  -v

echo -e "\n\nListando leads..."
curl -X GET "http://localhost:9030/api/v1/leads" \
  -H "accept: application/json" \
  -H "X-API-Key: $API_KEY" \
  -v