#!/bin/bash

# Script para ativar o modo offline e usar dados de teste
echo "Ativando modo offline para o sistema..."

# Verifica se o arquivo .env existe
if [ ! -f ".env" ]; then
  echo "Arquivo .env não encontrado. Criando um novo..."
  touch .env
fi

# Verifica se SUPABASE_OFFLINE_MODE já está definido
if grep -q "SUPABASE_OFFLINE_MODE=" .env; then
  # Substitui o valor existente
  sed -i '' 's/SUPABASE_OFFLINE_MODE=.*/SUPABASE_OFFLINE_MODE=true/g' .env
  echo "Valor SUPABASE_OFFLINE_MODE atualizado para 'true'"
else
  # Adiciona a variável
  echo "" >> .env
  echo "# Configuração de modo offline" >> .env
  echo "SUPABASE_OFFLINE_MODE=true" >> .env
  echo "Adicionado SUPABASE_OFFLINE_MODE=true ao arquivo .env"
fi

# Verifica se a pasta de dados offline existe
if [ ! -d "backend/src/data" ]; then
  echo "Criando diretório para dados offline..."
  mkdir -p backend/src/data
fi

echo ""
echo "Modo offline ativado com sucesso!"
echo ""
echo "Para aplicar as alterações:"
echo "1. Reinicie todos os serviços Docker"
echo "2. Ou reinicie manualmente o backend"
echo ""