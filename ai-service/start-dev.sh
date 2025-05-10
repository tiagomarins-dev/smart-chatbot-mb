#\!/bin/bash

# Verifica se o arquivo .env existe
if [ \! -f .env ]; then
    echo "Arquivo .env não encontrado. Criando a partir do exemplo..."
    cp .env.example .env
    echo "Edite o arquivo .env para configurar suas credenciais antes de prosseguir."
    exit 1
fi

# Inicia os serviços usando Docker Compose
echo "Iniciando os serviços em modo de desenvolvimento..."
docker-compose up -d

echo "Serviços iniciados\! A API está disponível em: http://localhost:8000"
echo "Documentação OpenAPI: http://localhost:8000/docs"
