#!/bin/bash

# Script para executar diagnóstico completo de autenticação

echo "Executando diagnóstico completo de autenticação..."

# Testar endpoint de diagnóstico
curl -X GET "http://localhost:9030/api/v1/auth-diagnostic" \
  -H "accept: application/json" \
  -v | jq .

echo ""
echo "Diagnóstico completo. Verifique os resultados acima."