#!/bin/bash

# Script para parar o AI Service

echo "🛑 Parando AI Service..."

# Parar containers
docker-compose stop ai-service redis

# Remover containers (opcional)
read -p "Deseja remover os containers? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose rm -f ai-service redis
    echo "✅ Containers removidos!"
else
    echo "✅ AI Service parado (containers mantidos)!"
fi