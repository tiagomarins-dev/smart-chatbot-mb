#!/bin/bash

# Script para aplicar a migração de leads no Supabase

# Definir variáveis (substitua com seus valores reais)
SUPABASE_PROJECT_ID="seu-project-id" # Exemplo: "abcdefghijklmnopqrst"
SUPABASE_DB_PASSWORD="sua-senha-db"  # A senha do banco de dados Postgres
MIGRATION_FILE="./supabase/migrations/00011_leads.sql"

# Verificar se o arquivo de migração existe
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "Erro: Arquivo de migração $MIGRATION_FILE não encontrado."
    exit 1
fi

echo "Aplicando migração de leads no Supabase..."
echo "NOTA IMPORTANTE: Esta migração pressupõe que a tabela public.profiles já existe no banco!"
echo "As referências de chave estrangeira (FK) serão criadas para public.profiles, não para auth.users."

# Obter host do banco de dados
DB_HOST="db.${SUPABASE_PROJECT_ID}.supabase.co"

# Aplicar migração via psql
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$DB_HOST" -p 5432 -d postgres -U postgres -f "$MIGRATION_FILE"

# Verificar resultado
if [ $? -eq 0 ]; then
    echo "Migração aplicada com sucesso!"
else
    echo "Erro ao aplicar migração."
    exit 1
fi

echo "Estrutura de dados para leads, relacionamentos e logs criada no Supabase."