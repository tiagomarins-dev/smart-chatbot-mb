#!/bin/bash

# Script para verificar a configuração do ambiente

echo "Verificando a configuração do ambiente..."
curl -X GET "http://localhost:9030/api/v1/check-config" \
  -H "accept: application/json" \
  -v