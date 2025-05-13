#!/bin/bash

# Script para testar a conexão com o servidor WhatsApp na porta 9029
echo "Testando conexão com o servidor WhatsApp..."

# Verificar se o servidor WhatsApp está acessível na porta 9029
echo -e "\nTestando endpoint de status:"
curl -s -X GET 'http://localhost:9029/api/whatsapp/status' -H 'accept: application/json'
echo -e "\n"

# Reiniciar o backend para aplicar as alterações de configuração
echo "Reiniciando o backend para aplicar as alterações..."

# Se estiver usando Docker Compose
if [ -f "docker-compose.yml" ]; then
  echo "Reiniciando serviços via Docker Compose..."
  docker-compose restart backend
else
  # Caso contrário, usar o script de reinício manual
  echo "Reiniciando backend manualmente..."
  if [ -f "./restart-backend.sh" ]; then
    bash ./restart-backend.sh
  else
    echo "Erro: Script restart-backend.sh não encontrado!"
    echo "Por favor, reinicie o backend manualmente."
    exit 1
  fi
fi

echo -e "\nAguardando reinicialização do backend (10 segundos)..."
sleep 10

# Testar novamente após o reinício
echo -e "\nTestando conexão após reinicialização:"
curl -s -X GET 'http://localhost:9034/api/whatsapp/status' -H 'accept: application/json'
echo -e "\n"

echo "Teste concluído!"
echo "Agora acesse http://localhost:9034/whatsapp para verificar a conexão na interface."