#!/bin/bash

# Script para executar a correção e reconstruir o backend
echo "===== SOLUÇÃO COMPLETA PARA DESATIVAR MODO OFFLINE ====="
echo "Este script:"
echo "1. Corrige todos os controllers para ignorar NODE_TLS_REJECT_UNAUTHORIZED"
echo "2. Define SUPABASE_OFFLINE_MODE=false no arquivo .env"
echo "3. Reconstrói o backend para aplicar as alterações"
echo ""

# Garante que o modo offline está explicitamente desativado no .env
echo "Passo 1: Configurando ambiente para modo online..."
if grep -q "SUPABASE_OFFLINE_MODE=" .env; then
  sed -i '' 's/SUPABASE_OFFLINE_MODE=.*/SUPABASE_OFFLINE_MODE=false/g' .env
else
  echo "SUPABASE_OFFLINE_MODE=false" >> .env
fi

# Remove ou desativa NODE_TLS_REJECT_UNAUTHORIZED se existir
if grep -q "NODE_TLS_REJECT_UNAUTHORIZED=" .env; then
  # Comentar a linha em vez de remover
  sed -i '' 's/^NODE_TLS_REJECT_UNAUTHORIZED=/#NODE_TLS_REJECT_UNAUTHORIZED=/g' .env
  echo "Variável NODE_TLS_REJECT_UNAUTHORIZED comentada"
  
  # Adiciona valor explícito para garantir
  if ! grep -q "NODE_TLS_REJECT_UNAUTHORIZED=1" .env; then
    echo "NODE_TLS_REJECT_UNAUTHORIZED=1" >> .env
  fi
fi

echo -e "\nPasso 2: Corrigindo código nos controllers..."
# Executar o script de correção do código
node fix-offline-validation.js

echo -e "\nPasso 3: Reconstruindo o backend (isso pode levar alguns minutos)..."
# Passo 1: Parar o serviço de backend
echo "Parando o backend..."
docker-compose stop backend

# Passo 2: Remover o contêiner para garantir reconstrução total
echo "Removendo o contêiner do backend..."
docker-compose rm -f backend

# Passo 3: Reconstruir o serviço backend com --no-cache para garantir rebuild completo
echo "Reconstruindo o backend..."
docker-compose build --no-cache backend

# Passo 4: Iniciar todos os serviços
echo "Iniciando os serviços..."
docker-compose up -d

echo -e "\n===== PROCESSO CONCLUÍDO ====="
echo "O modo offline foi completamente desativado em todo o sistema."
echo "Dados reais do Supabase agora serão usados em todas as páginas:"
echo "- http://localhost:9034/empresas"
echo "- http://localhost:9034/projetos"
echo "- http://localhost:9034/leads"
echo ""
echo "Para verificar se tudo está funcionando, execute:"
echo "docker-compose logs -f backend"
echo ""