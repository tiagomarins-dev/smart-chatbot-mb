#!/bin/bash

# Script para desativar o modo offline e retornar ao modo normal
echo "Desativando modo offline para o sistema..."

# Verifica se o arquivo .env existe
if [ ! -f ".env" ]; then
  echo "Arquivo .env não encontrado. Criando um novo..."
  touch .env
fi

# Verifica se SUPABASE_OFFLINE_MODE já está definido
if grep -q "SUPABASE_OFFLINE_MODE=" .env; then
  # Substitui o valor existente
  sed -i '' 's/SUPABASE_OFFLINE_MODE=.*/SUPABASE_OFFLINE_MODE=false/g' .env
  echo "Valor SUPABASE_OFFLINE_MODE atualizado para 'false'"
else
  # Adiciona a variável
  echo "" >> .env
  echo "# Configuração de modo offline" >> .env
  echo "SUPABASE_OFFLINE_MODE=false" >> .env
  echo "Adicionado SUPABASE_OFFLINE_MODE=false ao arquivo .env"
fi

echo ""
echo "Modo offline desativado com sucesso!"
echo ""
echo "Para aplicar as alterações:"
echo "1. Reinicie todos os serviços Docker"
echo "2. Ou reinicie manualmente o backend com: ./restart-backend.sh"
echo ""