#!/bin/bash

# Script para corrigir a detecção de modo offline no código
# Removerá a verificação de NODE_TLS_REJECT_UNAUTHORIZED como trigger do modo offline

echo "Iniciando correção do modo offline no código..."

# Substitui a verificação em todos os arquivos TypeScript no diretório backend/src
find backend/src -name "*.ts" -type f -exec sed -i '' 's/SUPABASE_OFFLINE_MODE === .true. || \+NODE_TLS_REJECT_UNAUTHORIZED === .0./SUPABASE_OFFLINE_MODE === '\''true'\''/g' {} \;

echo "Correção completa!"
echo "Os arquivos foram modificados para usar apenas SUPABASE_OFFLINE_MODE como condição para o modo offline."

# Adiciona definição explícita de SUPABASE_OFFLINE_MODE=false no arquivo .env se necessário
if ! grep -q "SUPABASE_OFFLINE_MODE=" .env; then
  echo "" >> .env
  echo "# Configuração explícita para desativar modo offline" >> .env
  echo "SUPABASE_OFFLINE_MODE=false" >> .env
  echo "Adicionado SUPABASE_OFFLINE_MODE=false ao arquivo .env"
fi

echo ""
echo "Para aplicar as alterações:"
echo "1. Reinicie todos os serviços Docker"
echo "2. Ou reinicie manualmente o backend"
echo ""