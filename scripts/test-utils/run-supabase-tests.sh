#!/bin/bash

# Script para executar os testes de conexão com Supabase

echo "Instalando dependências necessárias..."
npm install @supabase/supabase-js dotenv

# Solicitar credenciais para teste
echo ""
echo "Insira as credenciais para teste de autenticação:"
read -p "Email: " TEST_EMAIL
read -s -p "Senha: " TEST_PASSWORD
echo ""
echo "Credenciais armazenadas para uso nos testes."
echo ""

export SUPABASE_TEST_EMAIL="$TEST_EMAIL"
export SUPABASE_TEST_PASSWORD="$TEST_PASSWORD"

echo ""
echo "=== TESTE DE CONEXÃO BÁSICA COM SUPABASE ==="
echo ""
node test-supabase-connection.js

echo ""
echo "Pressione ENTER para continuar com o próximo teste..."
read

echo ""
echo "=== TESTE DE VERIFICAÇÃO DE TABELAS ==="
echo ""
node test-supabase-tables.js

echo ""
echo "=== TESTE DE CONTAGEM DE REGISTROS ==="
echo ""
node test-supabase-count.js

echo ""
echo "Pressione ENTER para continuar com o próximo teste..."
read

echo ""
echo "=== TESTE DE LOGIN DE USUÁRIO ==="
echo ""
echo "Testando login com as credenciais fornecidas..."
node test-supabase-login.js "$TEST_EMAIL" "$TEST_PASSWORD"

echo ""
echo "Testes concluídos!"