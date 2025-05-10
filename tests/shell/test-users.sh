#!/bin/bash

# Script para testar consulta de usuários no Supabase

echo "Testando consulta de usuários no Supabase..."
curl -X GET "http://localhost:9030/api/v1/test-users" \
  -H "accept: application/json" \
  -v

# Para filtrar por ID específico, descomente e ajuste a linha abaixo:
# curl -X GET "http://localhost:9030/api/v1/test-users?id=SEU_ID_AQUI" -H "accept: application/json"

# Para filtrar por email, descomente e ajuste a linha abaixo:
# curl -X GET "http://localhost:9030/api/v1/test-users?email=seu_email@exemplo.com" -H "accept: application/json"