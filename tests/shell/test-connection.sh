#!/bin/bash

# Script para testar a conexão com o Supabase

echo "Testando a conexão com o Supabase..."
curl -X GET "http://localhost:9030/api/v1/test-connection" \
  -H "accept: application/json" \
  -v

echo -e "\n\nCertifique-se de preencher as seguintes variáveis no arquivo .env:"
echo "- SUPABASE_URL"
echo "- SUPABASE_ANON_KEY"
echo "- SUPABASE_SERVICE_ROLE_KEY (obrigatório)"
echo "- SUPABASE_JWT_SECRET (obrigatório)"