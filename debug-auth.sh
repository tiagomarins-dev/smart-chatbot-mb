#!/bin/bash

# Script para depurar autenticação

# Substitua esta API Key pela sua chave real
API_KEY="key_giKtUyw3hS0KAYUdOyVQevbS"

echo "Depurando autenticação..."
curl -X GET "http://localhost:9030/api/v1/debug-auth" \
  -H "accept: application/json" \
  -H "X-API-Key: $API_KEY" \
  -v