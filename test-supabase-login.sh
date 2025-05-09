#!/bin/bash

# Script para testar login no Supabase
# Simples e focado no diagnóstico de problemas de autenticação

# Cores para facilitar leitura
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
EMAIL="tiagof7@gmail.com"
PASSWORD="##Tfm#1983"
API_URL="http://localhost:9032/api"

# Verificar portas usadas pelo backend
echo -e "${BLUE}=== VERIFICAÇÃO DE CONECTIVIDADE ===${NC}"
echo "Verificando portas em uso..."
ports=$(netstat -tuln | grep LISTEN)
echo "$ports" | grep 9032 || echo -e "${RED}Porta 9032 não está em uso!${NC}"

echo -e "\n${BLUE}=== TESTE DE LOGIN ===${NC}"
echo "Tentando login com email: $EMAIL"

# Tentar login
response=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# Verificar se a resposta contém "success": true
if echo "$response" | grep -q "\"success\":true"; then
  echo -e "${GREEN}✓ Login bem-sucedido!${NC}"
  
  # Extrair token para uso posterior
  token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}✓ Token obtido com sucesso.${NC}"
  
  # Testar chamada autenticada com o token
  echo -e "\n${BLUE}=== VERIFICANDO TOKEN ===${NC}"
  echo "Testando chamada autenticada..."
  
  verify_response=$(curl -s -X POST "$API_URL/auth/verify" \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"$token\"}")
  
  if echo "$verify_response" | grep -q "\"valid\":true"; then
    echo -e "${GREEN}✓ Token é válido! Autenticação funcionando corretamente.${NC}"
    echo -e "Detalhes do usuário:"
    echo "$verify_response" | grep -o '"user":{[^}]*}' | jq 2>/dev/null || echo "$verify_response" | grep -o '"user":{[^}]*}'
  else
    echo -e "${RED}✗ Verificação de token falhou.${NC}"
    echo "$verify_response"
  fi
else
  echo -e "${RED}✗ Falha no login!${NC}"
  echo "Detalhes do erro:"
  echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4
  
  echo -e "\n${YELLOW}Testando conectividade com o Supabase...${NC}"
  
  # Verificar se o backend está funcionando
  backend_status=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/status" 2>/dev/null || echo "Error")
  if [ "$backend_status" = "200" ]; then
    echo -e "${GREEN}✓ API do backend está respondendo (HTTP 200)${NC}"
  else
    echo -e "${RED}✗ API do backend não está acessível (HTTP $backend_status)${NC}"
    echo "Verifique se o backend está rodando."
  fi
  
  # Testar conexão de rede
  echo -e "\n${YELLOW}Teste de conectividade de rede...${NC}"
  ping -c 3 db.supabase.co > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Conectividade com o Supabase parece ok (ping bem-sucedido)${NC}"
  else
    echo -e "${RED}✗ Problema de conectividade com o Supabase (ping falhou)${NC}"
    echo "Verifique sua conexão com a internet e se há algum bloqueio na rede."
  fi
fi

echo -e "\n${BLUE}=== DIAGNÓSTICO SUGERIDO ===${NC}"
echo "1. Verifique se o backend está rodando usando 'docker-compose ps'"
echo "2. Verifique se as variáveis de ambiente estão corretas no arquivo .env:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - SUPABASE_ANON_KEY"
echo "3. Confirme se o usuário existe no Supabase Authentication"
echo "4. Verifique os logs do backend para erros específicos: 'docker-compose logs -f backend'"
echo "5. Tente reiniciar o backend: 'docker-compose restart backend'"