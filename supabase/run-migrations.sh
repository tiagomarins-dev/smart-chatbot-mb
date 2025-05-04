#!/bin/bash

# Script para executar migrações do Supabase em ordem sequencial
# Requer o Supabase CLI instalado (https://supabase.com/docs/guides/cli)

# Cores para saída
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Iniciando execução de migrações do Supabase...${NC}"
echo

# Diretório de migrações
MIGRATIONS_DIR="./migrations"

# Verificar se o diretório existe
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}Erro: Diretório de migrações não encontrado: $MIGRATIONS_DIR${NC}"
    exit 1
fi

# Obter lista de arquivos SQL ordenados
MIGRATIONS=$(find "$MIGRATIONS_DIR" -name "*.sql" | sort)

if [ -z "$MIGRATIONS" ]; then
    echo -e "${YELLOW}Nenhum arquivo de migração encontrado.${NC}"
    exit 0
fi

# Contador para migrações
TOTAL_MIGRATIONS=$(echo "$MIGRATIONS" | wc -l)
COMPLETED=0
FAILED=0

echo -e "${GREEN}Encontradas $TOTAL_MIGRATIONS migrações para aplicar.${NC}"
echo

# Verificar se supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Supabase CLI não encontrado. Continuando sem execução automática.${NC}"
    echo -e "${YELLOW}Você precisará executar manualmente as migrações através do painel do Supabase.${NC}"
    echo
    
    echo -e "${GREEN}Lista de migrações a serem aplicadas manualmente:${NC}"
    for migration in $MIGRATIONS; do
        echo "- $(basename "$migration")"
    done
    
    exit 0
fi

# Executar migrações uma por uma
for migration in $MIGRATIONS; do
    filename=$(basename "$migration")
    echo -e "${GREEN}Aplicando migração: $filename${NC}"
    
    # Se estiver usando o CLI do Supabase
    # O comando correto para executar SQL via CLI do Supabase
    supabase db execute < "$migration"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Migração aplicada com sucesso: $filename${NC}"
        ((COMPLETED++))
    else
        echo -e "${RED}✗ Falha ao aplicar migração: $filename${NC}"
        ((FAILED++))
    fi
    
    echo
done

# Relatório final
echo -e "${GREEN}Resumo da execução:${NC}"
echo -e "Total de migrações: $TOTAL_MIGRATIONS"
echo -e "Concluídas com sucesso: ${GREEN}$COMPLETED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "Falhas: ${RED}$FAILED${NC}"
else
    echo -e "Falhas: ${GREEN}0${NC}"
fi

echo
echo -e "${GREEN}Processo de migração concluído.${NC}"

exit 0