#!/bin/bash

# Script para reconstruir o backend e forçar o modo online
echo "Reconstruindo o backend e forçando modo online..."

# Verifica se o arquivo .env existe
if [ ! -f ".env" ]; then
  echo "Arquivo .env não encontrado. Criando um novo..."
  touch .env
fi

# Garante que o modo offline está explicitamente desativado
echo "Configurando ambiente para modo online..."
if grep -q "SUPABASE_OFFLINE_MODE=" .env; then
  sed -i '' 's/SUPABASE_OFFLINE_MODE=.*/SUPABASE_OFFLINE_MODE=false/g' .env
else
  echo "SUPABASE_OFFLINE_MODE=false" >> .env
fi

# Verifica se o Docker está instalado
if ! command -v docker &> /dev/null; then
  echo "Docker não encontrado! Verifique se está instalado e tente novamente."
  exit 1
fi

# Verifica se o docker-compose está instalado
if ! command -v docker-compose &> /dev/null; then
  echo "Docker Compose não encontrado! Verifique se está instalado e tente novamente."
  exit 1
fi

# Parar o serviço de backend
echo "Parando o backend..."
docker-compose stop backend

# Remover o contêiner para garantir reconstrução total
echo "Removendo o contêiner do backend..."
docker-compose rm -f backend

# Reconstruir o serviço backend com --no-cache para garantir rebuild completo
echo "Reconstruindo o backend (isso pode levar alguns minutos)..."
docker-compose build --no-cache backend

# Iniciar todos os serviços
echo "Iniciando os serviços..."
docker-compose up -d

# Exibir os logs do backend para verificar a inicialização
echo "Exibindo logs do backend (pressione Ctrl+C para sair):"
echo "Aguarde alguns instantes para verificar se o serviço conecta ao Supabase..."
docker-compose logs -f backend

# Instruções finais
echo ""
echo "Após verificar os logs, acesse: http://localhost:9034/empresas"
echo "Os dados agora devem ser carregados diretamente do Supabase."
echo ""
