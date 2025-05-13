#!/bin/bash

# Script wrapper para testar os endpoints do WhatsApp
echo "### TESTE DE ENDPOINTS WHATSAPP ###"
echo "Este script vai testar todos os endpoints da API WhatsApp na porta 9029.
"

# Executar o script de teste de endpoints
bash ./scripts/test-utils/test-whatsapp-endpoints.sh

echo "
### TESTE CONCLUÍDO ###
"