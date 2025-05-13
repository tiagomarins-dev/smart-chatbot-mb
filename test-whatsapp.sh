#!/bin/bash

# Script para testar a conexão com o WhatsApp
echo "### TESTE DE CONEXÃO WHATSAPP ###"
echo "Este script vai testar se o servidor WhatsApp na porta 9029 está conectado.
"

# Executar o script de teste do WhatsApp
bash ./scripts/test-utils/test-whatsapp-connection.sh

echo "
### VERIFICAÇÃO CONCLUÍDA ###
Se quiser visualizar o diagnóstico no navegador, acesse:
http://localhost:9034/whatsapp/diagnostico
"