#!/bin/bash

# Script para alternar entre modo offline e modo normal com reinício dos contêineres Docker

# Função para mostrar o uso do script
show_usage() {
  echo "Uso: $0 [on|off]"
  echo "  on  - Ativa o modo offline"
  echo "  off - Desativa o modo offline"
  exit 1
}

# Verifica se foi fornecido um argumento
if [ $# -ne 1 ]; then
  show_usage
fi

# Verifica se o arquivo .env existe
if [ ! -f ".env" ]; then
  echo "Arquivo .env não encontrado. Criando um novo..."
  touch .env
fi

case "$1" in
  on)
    echo "Ativando modo offline..."
    
    # Atualiza ou adiciona a configuração
    if grep -q "SUPABASE_OFFLINE_MODE=" .env; then
      sed -i '' 's/SUPABASE_OFFLINE_MODE=.*/SUPABASE_OFFLINE_MODE=true/g' .env
    else
      echo "" >> .env
      echo "# Configuração de modo offline" >> .env
      echo "SUPABASE_OFFLINE_MODE=true" >> .env
    fi
    
    echo "Modo offline ativado com sucesso!"
    ;;
    
  off)
    echo "Desativando modo offline..."
    
    # Atualiza ou adiciona a configuração
    if grep -q "SUPABASE_OFFLINE_MODE=" .env; then
      sed -i '' 's/SUPABASE_OFFLINE_MODE=.*/SUPABASE_OFFLINE_MODE=false/g' .env
    else
      echo "" >> .env
      echo "# Configuração de modo offline" >> .env
      echo "SUPABASE_OFFLINE_MODE=false" >> .env
    fi
    
    echo "Modo offline desativado com sucesso!"
    ;;
    
  *)
    show_usage
    ;;
esac

# Reinicia os contêineres Docker
echo ""
echo "Reiniciando os contêineres Docker para aplicar as alterações..."

if [ -f "docker-compose.yml" ]; then
  docker-compose down
  docker-compose up -d
  echo "Contêineres Docker reiniciados com sucesso!"
else
  echo "ERRO: Arquivo docker-compose.yml não encontrado!"
  echo "Você precisa reiniciar os contêineres Docker manualmente."
fi

echo ""
echo "Aguarde alguns instantes para que os serviços iniciem completamente."
echo "Acesse a interface web em: http://localhost:9034/empresas"