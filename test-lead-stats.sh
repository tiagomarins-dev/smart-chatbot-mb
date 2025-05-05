#!/bin/bash

# Script para testar a API de estatísticas de leads

# Substitua esta API Key pela sua chave real
API_KEY="key_giKtUyw3hS0KAYUdOyVQevbS"

# Substitua este ID pelo ID de um projeto válido
PROJECT_ID="123e4567-e89b-12d3-a456-426614174000"

echo "Testando estatísticas gerais de leads..."
curl -X GET "http://localhost:9030/api/v1/leads/stats" \
  -H "accept: application/json" \
  -H "X-API-Key: $API_KEY" \
  -v

echo -e "\n\nTestando estatísticas de leads para um projeto específico..."
curl -X GET "http://localhost:9030/api/v1/leads/stats?project_id=$PROJECT_ID&period=60" \
  -H "accept: application/json" \
  -H "X-API-Key: $API_KEY" \
  -v