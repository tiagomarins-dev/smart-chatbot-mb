#!/bin/bash

# Script para ativar o modo offline (dados simulados)
echo "### ATIVANDO MODO OFFLINE ###"
echo "Este script vai:
- Ativar o modo offline
- Reiniciar o backend
"

# Executar o script para ativar o modo offline
bash ./scripts/offline-utils/enable-offline-mode.sh

# Executar o script de reinício
bash ./scripts/service-utils/restart-backend.sh

echo "
### MODO OFFLINE ATIVADO ###
Agora o sistema está usando dados simulados.
"