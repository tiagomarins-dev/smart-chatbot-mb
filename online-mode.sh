#!/bin/bash

# Script para ativar o modo online (acessa o Supabase)
echo "### ATIVANDO MODO ONLINE ###"
echo "Este script vai:
- Desativar o modo offline
- Corrigir todos os controladores
- Reiniciar o backend
"

# Executar o script para forçar o modo online
bash ./scripts/offline-utils/force-online-mode.sh

# Executar o script de reconstrução
bash ./scripts/service-utils/rebuild-backend.sh

echo "
### MODO ONLINE ATIVADO ###
Agora o sistema está buscando dados do Supabase.
"