#!/bin/bash

# Script para iniciar o AI Service com Docker

echo "🚀 Iniciando AI Service na porta 9035..."

# Verificar se a chave OpenAI está configurada
if grep -q "sk-COLOQUE_SUA_CHAVE_OPENAI_AQUI" .env; then
    echo "⚠️  ATENÇÃO: Você precisa configurar sua chave OpenAI no arquivo .env!"
    echo "   Substitua 'sk-COLOQUE_SUA_CHAVE_OPENAI_AQUI' pela sua chave real."
    echo "   Obtenha sua chave em: https://platform.openai.com/api-keys"
    exit 1
fi

# Parar containers existentes do AI Service
echo "Parando containers existentes..."
docker-compose stop ai-service redis 2>/dev/null
docker-compose rm -f ai-service redis 2>/dev/null

# Construir e iniciar os serviços
echo "Construindo e iniciando serviços..."
docker-compose up -d ai-service redis

# Aguardar os serviços iniciarem
echo "Aguardando serviços iniciarem..."
sleep 5

# Verificar se os serviços estão rodando
if docker-compose ps | grep -q "smart-chatbox-ai-service.*Up"; then
    echo "✅ AI Service iniciado com sucesso na porta 9035!"
    echo ""
    echo "📋 Informações:"
    echo "   - URL: http://localhost:9035"
    echo "   - Docs: http://localhost:9035/docs"
    echo "   - API Key: internal-api-key-2024"
    echo ""
    echo "🔍 Para ver os logs:"
    echo "   docker-compose logs -f ai-service"
else
    echo "❌ Erro ao iniciar AI Service!"
    echo "Verifique os logs com: docker-compose logs ai-service"
    exit 1
fi