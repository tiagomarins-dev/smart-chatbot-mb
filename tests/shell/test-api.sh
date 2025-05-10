#!/bin/bash

# Script para testar a API do Supabase

echo "Testando a API do Supabase..."
curl -X GET "http://localhost:9030/api/v1/test-api" \
  -H "accept: application/json" \
  -v