#!/bin/bash

# Script para testar a conexão com o Supabase e autenticação
# Autor: Claude AI
# Data: $(date +"%d/%m/%Y")

# Cores para facilitar leitura
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parâmetros de entrada
EMAIL="tiagof7@gmail.com"
PASSWORD="##Tfm#1983"
API_URL=${API_URL:-"http://localhost:9032/api"}

echo -e "${BLUE}=== DIAGNÓSTICO DE CONEXÃO SUPABASE ===${NC}"
echo -e "${BLUE}=== $(date) ===${NC}"
echo ""

# Verificar se o backend está rodando
echo -e "${YELLOW}[1/5] Verificando se o backend está acessível...${NC}"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/status 2>/dev/null || echo "Error")

if [ "$BACKEND_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Backend está respondendo (HTTP 200)${NC}"
else
  echo -e "${RED}✗ Backend não está acessível (HTTP $BACKEND_STATUS)${NC}"
  echo -e "${YELLOW}Dica: Verifique se o servidor backend está rodando na porta correta${NC}"
  echo "  O API_URL atual é: $API_URL"
  echo ""
  echo "Quer tentar configurar o API_URL? (s/n)"
  read -r CHANGE_URL
  
  if [ "$CHANGE_URL" = "s" ]; then
    echo "Digite o novo API_URL:"
    read -r NEW_API_URL
    API_URL=$NEW_API_URL
    echo "API_URL atualizado para: $API_URL"
    
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/status 2>/dev/null || echo "Error")
    if [ "$BACKEND_STATUS" = "200" ]; then
      echo -e "${GREEN}✓ Backend está respondendo no novo URL (HTTP 200)${NC}"
    else
      echo -e "${RED}✗ Backend ainda não está acessível (HTTP $BACKEND_STATUS)${NC}"
    fi
  fi
fi

echo ""
echo -e "${YELLOW}[2/5] Testando configuração do Supabase...${NC}"
SUPABASE_CONFIG=$(curl -s $API_URL/auth/check-config)

if echo "$SUPABASE_CONFIG" | grep -q "success"; then
  echo -e "${GREEN}✓ Configuração do Supabase está correta${NC}"
  echo "$SUPABASE_CONFIG" | grep -v "serviceKey" | grep -v "anonKey"
else
  echo -e "${RED}✗ Problema na configuração do Supabase${NC}"
  echo "$SUPABASE_CONFIG" | grep -v "serviceKey" | grep -v "anonKey"
fi

echo ""
echo -e "${YELLOW}[3/5] Tentando login com as credenciais fornecidas...${NC}"

# Função para ocultar a senha nos logs
mask_password() {
  local pass=$1
  local masked_pass=${pass:0:2}
  for ((i=2; i<${#pass}-2; i++)); do
    masked_pass="${masked_pass}*"
  done
  masked_pass="${masked_pass}${pass: -2}"
  echo "$masked_pass"
}

MASKED_PASSWORD=$(mask_password "$PASSWORD")
echo "Email: $EMAIL"
echo "Senha: $MASKED_PASSWORD"

LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | grep -q "\"success\":true"; then
  echo -e "${GREEN}✓ Login bem-sucedido!${NC}"
  
  # Extrair o token para usar em testes subsequentes
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"//g' | sed 's/"//g')
  
  if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ Token JWT obtido com sucesso${NC}"
  else
    echo -e "${RED}✗ Não foi possível extrair o token JWT${NC}"
  fi
else
  echo -e "${RED}✗ Falha no login${NC}"
  echo "Resposta:"
  echo "$LOGIN_RESPONSE" | grep -v "password"
fi

echo ""
echo -e "${YELLOW}[4/5] Verificando conexão direta com o Supabase...${NC}"

# Extrair URL e chaves do Supabase do backend
CONFIG_RESPONSE=$(curl -s $API_URL/auth/get-supabase-config)
SUPABASE_URL=$(echo "$CONFIG_RESPONSE" | grep -o '"url":"[^"]*"' | sed 's/"url":"//g' | sed 's/"//g')

if [ -n "$SUPABASE_URL" ]; then
  echo -e "${GREEN}✓ URL do Supabase obtido: $SUPABASE_URL${NC}"
  
  # Verificar se o Supabase está respondendo
  SUPABASE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $SUPABASE_URL/rest/v1/ 2>/dev/null || echo "Error")
  
  if [ "$SUPABASE_STATUS" = "200" ] || [ "$SUPABASE_STATUS" = "401" ]; then
    echo -e "${GREEN}✓ Supabase está acessível (HTTP $SUPABASE_STATUS)${NC}"
  else
    echo -e "${RED}✗ Supabase não está acessível (HTTP $SUPABASE_STATUS)${NC}"
    
    # Testar DNS
    echo "Testando resolução DNS para o URL do Supabase..."
    
    # Extrair o hostname do URL
    SUPABASE_HOST=$(echo "$SUPABASE_URL" | sed -e 's|^[^/]*//||' -e 's|/.*$||' -e 's|:.*$||')
    
    if [ -n "$SUPABASE_HOST" ]; then
      DNS_TEST=$(nslookup "$SUPABASE_HOST")
      
      if echo "$DNS_TEST" | grep -q "Address"; then
        echo -e "${GREEN}✓ Resolução DNS funcionando para $SUPABASE_HOST${NC}"
        echo "$DNS_TEST" | grep "Address"
      else
        echo -e "${RED}✗ Problema na resolução DNS para $SUPABASE_HOST${NC}"
        echo "$DNS_TEST"
      fi
    fi
  fi
else
  echo -e "${RED}✗ Não foi possível obter o URL do Supabase${NC}"
fi

echo ""
echo -e "${YELLOW}[5/5] Verificando token se o login foi bem-sucedido...${NC}"

if [ -n "$TOKEN" ]; then
  # Testar o token com endpoint de verificação
  VERIFY_RESPONSE=$(curl -s -X POST $API_URL/auth/verify \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"$TOKEN\"}")
  
  if echo "$VERIFY_RESPONSE" | grep -q "\"valid\":true"; then
    echo -e "${GREEN}✓ Token é válido!${NC}"
    echo "Detalhes do usuário:"
    echo "$VERIFY_RESPONSE" | grep -o '"user":{[^}]*}' | sed 's/"user"://g'
  else
    echo -e "${RED}✗ Token é inválido${NC}"
    echo "$VERIFY_RESPONSE"
  fi
else
  echo -e "${YELLOW}! Pulando verificação de token pois o login falhou${NC}"
fi

echo ""
echo -e "${BLUE}=== DIAGNÓSTICO CONCLUÍDO ===${NC}"
echo ""
echo "Resumo:"

if [ "$BACKEND_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Backend está respondendo${NC}"
else
  echo -e "${RED}✗ Backend não está acessível${NC}"
fi

if echo "$SUPABASE_CONFIG" | grep -q "success"; then
  echo -e "${GREEN}✓ Configuração do Supabase está correta${NC}"
else
  echo -e "${RED}✗ Problema na configuração do Supabase${NC}"
fi

if echo "$LOGIN_RESPONSE" | grep -q "\"success\":true"; then
  echo -e "${GREEN}✓ Login bem-sucedido${NC}"
else
  echo -e "${RED}✗ Falha no login${NC}"
fi

if [ -n "$SUPABASE_URL" ] && [ "$SUPABASE_STATUS" = "200" ] || [ "$SUPABASE_STATUS" = "401" ]; then
  echo -e "${GREEN}✓ Supabase está acessível${NC}"
else
  echo -e "${RED}✗ Supabase não está acessível${NC}"
fi

if [ -n "$TOKEN" ] && echo "$VERIFY_RESPONSE" | grep -q "\"valid\":true"; then
  echo -e "${GREEN}✓ Token JWT é válido${NC}"
elif [ -n "$TOKEN" ]; then
  echo -e "${RED}✗ Token JWT é inválido${NC}"
fi

echo ""
echo "Para resolver problemas de conexão, verifique:"
echo "1. Backend está rodando? Tente: docker-compose ps"
echo "2. Variáveis de ambiente do Supabase estão definidas no .env do backend?"
echo "3. Rede entre sua máquina e o Supabase está funcionando? Teste: curl -v <supabase-url>"
echo "4. Credenciais do usuário estão corretas?"
echo "5. Endpoint de autenticação está funcionando corretamente no backend?"