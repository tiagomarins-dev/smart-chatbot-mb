#!/bin/bash

# Script para testar endpoints de projetos com API key

# Cores para saída
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
API_URL="http://localhost:9030"
API_KEY="key_123456789" # Substitua pela sua API key real

# Endpoint a ser testado (fornecido como argumento ou padrão)
METHOD=${1:-GET}
ENDPOINT=${2:-"/api/v1/projects"}

echo -e "${BLUE}Testando endpoint de projetos: ${METHOD} ${ENDPOINT}${NC}"
echo -e "${BLUE}Usando API key: ${API_KEY}${NC}"

# Executar requisição com API key
response=$(curl -s -X "${METHOD}" "${API_URL}${ENDPOINT}" \
  -H "accept: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json")

# Verificar se a resposta contém um erro
if echo "${response}" | grep -q "error"; then
  echo -e "${RED}Erro na requisição:${NC}"
  echo "${response}" | jq . 2>/dev/null || echo "${response}"
else
  echo -e "${GREEN}Sucesso:${NC}"
  echo "${response}" | jq . 2>/dev/null || echo "${response}"
fi

# Imprimir linha divisória
echo -e "${BLUE}-------------------------------------------------------${NC}"