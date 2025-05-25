#!/bin/bash

# Exemplo de criação de lead com campos obrigatórios
echo "=== Criando lead com campos obrigatórios ==="
curl -X POST http://localhost:9033/api/leads \
  -H "Authorization: Bearer api_b2abae5d5b03e1e91c93909c44ea3459" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João da Silva",
    "email": "joao.silva@exemplo.com",
    "phone": "(21) 99999-8877",
    "project_id": "123e4567-e89b-12d3-a456-426614174000"
  }'

echo -e "\n\n"

# Exemplo de criação de lead com todos os campos
echo "=== Criando lead com todos os campos (incluindo UTM) ==="
curl -X POST http://localhost:9033/api/leads \
  -H "Authorization: Bearer api_b2abae5d5b03e1e91c93909c44ea3459" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Santos",
    "first_name": "Maria",
    "email": "maria.santos@exemplo.com",
    "phone": "(11) 98765-4321",
    "project_id": "123e4567-e89b-12d3-a456-426614174000",
    "notes": "Cliente interessado em imóvel de alto padrão",
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "black-friday-2025",
    "utm_term": "imoveis-luxo",
    "utm_content": "banner-topo"
  }'

echo -e "\n"