#!/bin/bash

# Script para testar o acesso a empresas em modo offline
echo "Testando acesso a empresas em modo offline..."

# Ativar o modo offline primeiro
if [ -f "./enable-offline-mode.sh" ]; then
  echo "Ativando modo offline..."
  bash ./enable-offline-mode.sh
else
  echo "Erro: Script enable-offline-mode.sh não encontrado!"
  exit 1
fi

# Verifica se curl está instalado
if ! command -v curl &> /dev/null; then
  echo "Erro: curl não está instalado. Por favor instale-o para continuar."
  exit 1
fi

# Define a URL base
BASE_URL="http://localhost:9034"

# Obter um token de autenticação (modo offline aceita qualquer credencial)
echo -e "\nObtendo token de autenticação em modo offline..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

# Extrai o token da resposta
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Erro: Não foi possível obter o token de autenticação."
  echo "Resposta recebida: $LOGIN_RESPONSE"
  exit 1
fi

echo "Token obtido com sucesso!"

# Testar acesso à lista de empresas
echo -e "\nTestando acesso à lista de empresas..."
COMPANIES_RESPONSE=$(curl -s "${BASE_URL}/api/companies" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo -e "\nResposta da API (listagem de empresas):"
echo $COMPANIES_RESPONSE | python -m json.tool 2>/dev/null || echo $COMPANIES_RESPONSE

# Testar acesso a uma empresa específica (ID 1)
echo -e "\nTestando acesso a uma empresa específica (ID 1)..."
COMPANY_RESPONSE=$(curl -s "${BASE_URL}/api/companies/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo -e "\nResposta da API (empresa específica):"
echo $COMPANY_RESPONSE | python -m json.tool 2>/dev/null || echo $COMPANY_RESPONSE

echo -e "\nTeste concluído!"
echo "Você pode acessar a interface web em: ${BASE_URL}/empresas"