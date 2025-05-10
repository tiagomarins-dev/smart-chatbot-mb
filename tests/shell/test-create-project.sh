#!/bin/bash

# Script para testar a criação de projetos com API key

# Cores para saída
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
API_URL="http://localhost:9030"
API_KEY=${1:-"your_api_key_here"} # Usar o primeiro argumento como API key ou valor padrão
COMPANY_ID=${2:-1} # ID da empresa (padrão: 1)

# Dados do projeto
PROJECT_NAME="Projeto de Teste via API Key"
PROJECT_DESCRIPTION="Projeto criado automaticamente para testar a API"
CURRENT_DATE=$(date +"%Y-%m-%d")
END_DATE=$(date -v+30d +"%Y-%m-%d" 2>/dev/null || date -d "+30 days" +"%Y-%m-%d" 2>/dev/null || echo "2023-12-31")

# Corpo da requisição
REQUEST_BODY=$(cat <<EOF
{
  "name": "${PROJECT_NAME}",
  "description": "${PROJECT_DESCRIPTION}",
  "company_id": "${COMPANY_ID}",
  "campaign_start_date": "${CURRENT_DATE}",
  "campaign_end_date": "${END_DATE}"
}
EOF
)

echo -e "${BLUE}Testando criação de projeto${NC}"
echo -e "${BLUE}URL: ${API_URL}/api/v1/projects${NC}"
echo -e "${BLUE}API Key: ${API_KEY}${NC}"
echo -e "${BLUE}Dados:${NC}"
echo "${REQUEST_BODY}" | jq . 2>/dev/null || echo "${REQUEST_BODY}"

# Executar requisição POST
response=$(curl -s -X POST "${API_URL}/api/v1/projects" \
  -H "accept: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "${REQUEST_BODY}")

# Verificar se a resposta contém um erro
if echo "${response}" | grep -q "error"; then
  echo -e "${RED}Erro na criação do projeto:${NC}"
  echo "${response}" | jq . 2>/dev/null || echo "${response}"
else
  echo -e "${GREEN}Projeto criado com sucesso:${NC}"
  echo "${response}" | jq . 2>/dev/null || echo "${response}"
fi

# Imprimir linha divisória
echo -e "${BLUE}-------------------------------------------------------${NC}"