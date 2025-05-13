#!/bin/bash

# Script para corrigir problemas de conexão do WhatsApp
echo "### CORREÇÃO DE CONEXÃO WHATSAPP ###"
echo "Este script vai:
- Corrigir o frontend para chamar os endpoints corretos
- Verificar a disponibilidade do servidor WhatsApp
- Testar os endpoints após a correção
"

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "Erro: Node.js não está instalado. Por favor, instale o Node.js para executar este script."
    exit 1
fi

# Verificar se o servidor WhatsApp está disponível
echo "Verificando se o servidor WhatsApp está disponível..."
if curl -s "http://localhost:9029/api/status" > /dev/null; then
    echo "✅ Servidor WhatsApp está rodando na porta 9029"
else
    echo "❌ Servidor WhatsApp não está disponível na porta 9029"
    echo "Por favor, verifique se o servidor WhatsApp está rodando."
    exit 1
fi

# Executar o script de correção do frontend
echo ""
echo "Corrigindo o código do frontend para chamar os endpoints corretos..."
node ./scripts/test-utils/fix-whatsapp-frontend.js

# Informar sobre a necessidade de reiniciar o frontend
echo ""
echo "A correção do frontend foi aplicada."
echo "Agora é necessário reiniciar o frontend para aplicar as alterações."
echo ""
echo "Para reiniciar o frontend manualmente:"
echo "1. Se estiver usando Docker: docker-compose restart frontend"
echo "2. Se estiver rodando localmente: cd frontend && npm run dev"
echo ""

# Perguntar se deseja reiniciar o frontend via Docker
read -p "Deseja reiniciar o frontend via Docker agora? (s/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "Reiniciando o frontend via Docker..."
    docker-compose restart frontend
    echo "Frontend reiniciado. Aguarde alguns segundos para que ele esteja disponível."
fi

# Testar os endpoints após a correção
echo ""
echo "Testando os endpoints após a correção..."
echo "Aguardando 5 segundos para o frontend inicializar..."
sleep 5
./scripts/test-utils/test-whatsapp-endpoints.sh

echo ""
echo "### CORREÇÃO CONCLUÍDA ###"
echo "Acesse a página de diagnóstico para verificar a conexão:"
echo "http://localhost:9034/whatsapp/diagnostico"
echo ""