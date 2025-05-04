#!/bin/bash

# Script para testar autenticação via REST API

# Substitua esta API Key pela sua chave real
API_KEY="key_giKtUyw3hS0KAYUdOyVQevbS"

# Cores para melhor visualização
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testando autenticação via REST API com API Key...${NC}"
echo ""

# Executar o teste e armazenar a saída
response=$(curl -s -X GET "http://localhost:9030/api/v1/companies" \
  -H "accept: application/json" \
  -H "X-API-Key: $API_KEY")

# Verificar o status baseado na resposta
if [[ $response == *"\"authenticated\":true"* ]] || [[ $response == *"\"companies\":"* ]]; then
  echo -e "${GREEN}✓ Autenticação bem-sucedida!${NC}"
  echo ""
  echo "Resposta:"
  echo "$response" | jq .
else
  echo -e "${RED}✗ Falha na autenticação${NC}"
  echo ""
  echo "Resposta de erro:"
  echo "$response" | jq .
  
  echo ""
  echo -e "${YELLOW}Executando diagnóstico de autenticação...${NC}"
  echo ""
  ./auth-diagnostic.sh
fi

echo ""
echo "Para mais informações sobre a autenticação com Supabase, consulte o arquivo AUTENTICACAO_SUPABASE.md"