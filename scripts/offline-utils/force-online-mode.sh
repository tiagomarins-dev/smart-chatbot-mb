#!/bin/bash

# Script para forçar o modo online, garantindo que todos os fatores de ativação do modo offline estejam desativados
echo "Forçando modo online para o sistema..."

# Verifica se o arquivo .env existe
if [ ! -f ".env" ]; then
  echo "Arquivo .env não encontrado. Criando um novo..."
  touch .env
fi

# Desativa a variável SUPABASE_OFFLINE_MODE
if grep -q "SUPABASE_OFFLINE_MODE=" .env; then
  sed -i '' 's/SUPABASE_OFFLINE_MODE=.*/SUPABASE_OFFLINE_MODE=false/g' .env
  echo "Valor SUPABASE_OFFLINE_MODE atualizado para 'false'"
else
  echo "" >> .env
  echo "# Configuração de modo offline" >> .env
  echo "SUPABASE_OFFLINE_MODE=false" >> .env
  echo "Adicionado SUPABASE_OFFLINE_MODE=false ao arquivo .env"
fi

# Remove ou desativa NODE_TLS_REJECT_UNAUTHORIZED se existir
if grep -q "NODE_TLS_REJECT_UNAUTHORIZED=" .env; then
  # Comentar a linha em vez de remover
  sed -i '' 's/^NODE_TLS_REJECT_UNAUTHORIZED=/#NODE_TLS_REJECT_UNAUTHORIZED=/g' .env
  echo "Variável NODE_TLS_REJECT_UNAUTHORIZED comentada"
  
  # Adiciona valor explícito para garantir
  echo "NODE_TLS_REJECT_UNAUTHORIZED=1" >> .env
fi

echo ""
echo "Modo online forçado com sucesso!"
echo ""
echo "Para aplicar as alterações:"
echo "1. Reinicie todos os serviços Docker com:"
echo "   docker-compose down && docker-compose up -d"
echo ""
echo "Para verificar se os dados reais estão sendo retornados:"
echo "1. Acesse http://localhost:9034/empresas"
echo "2. Os dados devem vir do Supabase, não dos dados de teste"
echo ""