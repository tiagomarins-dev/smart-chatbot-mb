#!/bin/bash

# Script para reiniciar o backend após alterações
echo "Reiniciando o serviço de backend..."

# Verifica se há um PID armazenado
if [ -f "./backend.pid" ]; then
    OLD_PID=$(cat ./backend.pid)
    if [ ! -z "$OLD_PID" ]; then
        echo "Encerrando processo anterior (PID: $OLD_PID)..."
        kill $OLD_PID 2>/dev/null || true
    fi
    rm ./backend.pid
fi

# Aguarda um momento para garantir que o processo foi encerrado
sleep 2

# Inicia o backend em segundo plano
echo "Iniciando novo processo de backend..."
cd backend
npm run start &
NEW_PID=$!
cd ..

# Salva o novo PID
echo $NEW_PID > ./backend.pid
echo "Backend reiniciado com PID: $NEW_PID"
echo "O servidor estará disponível em http://localhost:9034"
echo ""
echo "Para testar o modo offline, execute:"
echo "./test-offline-companies.sh"