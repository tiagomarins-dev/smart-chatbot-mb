#!/bin/bash

# Script para testar se o sistema está realmente conectado ao Supabase (modo online)
echo "Testando acesso a empresas no modo online (Supabase)..."

# Verifica se curl está instalado
if ! command -v curl &> /dev/null; then
  echo "Erro: curl não está instalado. Por favor instale-o para continuar."
  exit 1
fi

# Define a URL base
BASE_URL="http://localhost:9034"

# Obter o conteúdo do arquivo .env
echo "Verificando configurações no arquivo .env:"
if [ -f ".env" ]; then
  grep "SUPABASE_OFFLINE_MODE" .env 2>/dev/null || echo "SUPABASE_OFFLINE_MODE não encontrado"
  grep "NODE_TLS_REJECT_UNAUTHORIZED" .env 2>/dev/null || echo "NODE_TLS_REJECT_UNAUTHORIZED não encontrado"
else
  echo "Arquivo .env não encontrado!"
fi

echo -e "\nObtendo token de autenticação..."

# Tentar fazer login
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

# Verificar se parece um JSON
if [[ $LOGIN_RESPONSE == *"token"* ]]; then
  echo "Login bem-sucedido!"
  
  # Extrai o token da resposta
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$TOKEN" ]; then
    echo "Erro: Não foi possível extrair o token da resposta."
    echo "Resposta recebida: $LOGIN_RESPONSE"
    exit 1
  fi
  
  echo "Token obtido com sucesso!"
  
  # Testar acesso à lista de empresas
  echo -e "\nTestando acesso à lista de empresas..."
  COMPANIES_RESPONSE=$(curl -s "${BASE_URL}/api/companies" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  
  # Verifica se a resposta tem a string "mode":"offline" que indicaria modo offline
  if [[ $COMPANIES_RESPONSE == *"mode"*:"offline"* ]]; then
    echo "ALERTA: O sistema ainda parece estar em modo offline!"
    echo "Verifique o Docker e reinicie os serviços."
  else
    echo "OK: O sistema parece estar em modo online (Supabase)!"
  fi
  
  # Mostrar parte da resposta para verificação
  echo -e "\nTrecho da resposta da API:"
  echo $COMPANIES_RESPONSE | head -c 500
  
  echo -e "\n\nAcesse http://localhost:9034/empresas para ver os dados na interface web."
else
  echo "Erro ao tentar fazer login. A resposta não parece um JSON válido."
  echo "Resposta: $LOGIN_RESPONSE"
  echo "Verifique se o servidor está rodando corretamente."
fi

echo -e "\nTeste concluído!"