#!/bin/bash

# Script para testar autenticação com API Key

# Substitua esta API Key pela sua chave real
API_KEY="key_giKtUyw3hS0KAYUdOyVQevbS"

# Testar autenticação com um endpoint que requer autenticação
echo "Testando autenticação com API Key..."
curl -X GET "http://localhost:9030/api/v1/companies" \
  -H "accept: application/json" \
  -H "X-API-Key: $API_KEY" \
  -v