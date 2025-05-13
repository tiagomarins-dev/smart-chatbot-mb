#!/bin/bash

# Script para testar todos os endpoints do WhatsApp
echo "==================================================="
echo "      TESTE DE ENDPOINTS WHATSAPP API (9029)       "
echo "==================================================="

# Definir URL base
WHATSAPP_API_URL="http://localhost:9029/api/whatsapp"

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar um endpoint
test_endpoint() {
  local endpoint=$1
  local method=$2
  local data=$3
  local description=$4

  echo -e "\n${YELLOW}Testando: $description${NC}"
  echo "Endpoint: $method $endpoint"
  
  if [ "$method" == "GET" ]; then
    response=$(curl -s -X GET "$endpoint" -H "accept: application/json")
  elif [ "$method" == "POST" ]; then
    if [ -z "$data" ]; then
      response=$(curl -s -X POST "$endpoint" -H "Content-Type: application/json")
    else
      response=$(curl -s -X POST "$endpoint" -H "Content-Type: application/json" -d "$data")
    fi
  fi
  
  # Verifica se a resposta contém dados JSON válidos
  if echo "$response" | jq . > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Sucesso!${NC}"
    echo "Resposta:"
    echo "$response" | jq . || echo "$response"
  else
    echo -e "${RED}✗ Falha ou resposta inválida${NC}"
    echo "Resposta bruta:"
    echo "$response"
  fi
  
  echo "---------------------------------------------------"
}

# 1. Verificar status da conexão
test_endpoint "$WHATSAPP_API_URL/status" "GET" "" "Status da conexão WhatsApp"

# 2. Obter QR Code (só é útil se não estiver conectado)
test_endpoint "$WHATSAPP_API_URL/qrcode" "GET" "" "Obter QR Code (deve falhar se já conectado)"

# 3. Testar envio de mensagem
PHONE_NUMBER="5521998739574" # Substitua pelo número real para teste
MESSAGE="Teste automatizado em $(date)"
DATA="{\"phoneNumber\":\"$PHONE_NUMBER\",\"message\":\"$MESSAGE\"}"
test_endpoint "$WHATSAPP_API_URL/send" "POST" "$DATA" "Enviar mensagem de teste"

# 4. Obter mensagens recentes
test_endpoint "$WHATSAPP_API_URL/messages" "GET" "" "Obter mensagens recentes"

# 5. Obter mensagens de um contato específico
test_endpoint "$WHATSAPP_API_URL/messages/$PHONE_NUMBER" "GET" "" "Obter mensagens do contato $PHONE_NUMBER"

# 6. Verificar número de telefone conectado
test_endpoint "$WHATSAPP_API_URL/phone" "GET" "" "Obter número de telefone conectado"

echo -e "\n${GREEN}Teste de endpoints concluído!${NC}"
echo "Todas as requisições foram enviadas para: $WHATSAPP_API_URL"
echo ""
echo "Para acessar a página de diagnóstico web, abra:"
echo "http://localhost:9034/whatsapp/diagnostico"
echo ""