#!/bin/bash

# Script para corrigir a verificação de modo offline em todos os controladores
echo "Corrigindo a verificação de modo offline em todos os controladores..."

# Diretório dos controladores
CONTROLLERS_DIR="/Users/tiagomarins/Projetos/claudeai/smart-chatbot-mb/backend/src/controllers"

# Middleware de autenticação
AUTH_MIDDLEWARE="/Users/tiagomarins/Projetos/claudeai/smart-chatbot-mb/backend/src/middleware/auth.ts"

# Arquivos a serem corrigidos
CONTROLLERS=(
    "$CONTROLLERS_DIR/projectsController.ts"
    "$CONTROLLERS_DIR/leadsController.ts"
    "$CONTROLLERS_DIR/authController.ts"
    "$AUTH_MIDDLEWARE"
)

# Padrão a ser substituído (expressão regular para encontrar a linha com NODE_TLS_REJECT_UNAUTHORIZED)
PATTERN="const OFFLINE_MODE = process.env.SUPABASE_OFFLINE_MODE === 'true' \|\|"
PATTERN2="process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0'"

# Novo código para substituir
NEW_CODE="const OFFLINE_MODE = process.env.SUPABASE_OFFLINE_MODE === 'true';\n    // Log para debug\n    console.log('SUPABASE_OFFLINE_MODE =', process.env.SUPABASE_OFFLINE_MODE);\n    console.log('Modo offline está:', OFFLINE_MODE ? 'ATIVADO' : 'DESATIVADO');"

# Função para corrigir um arquivo
fix_file() {
    local FILE=$1
    echo "Processando arquivo: $FILE"
    
    if [ ! -f "$FILE" ]; then
        echo "  Arquivo não encontrado, pulando."
        return
    fi
    
    # Busca e substitui usando sed
    # Primeiro substitui a linha com NODE_TLS_REJECT_UNAUTHORIZED pelo novo código
    sed -i '' -E "s/const OFFLINE_MODE = process\.env\.SUPABASE_OFFLINE_MODE === 'true' \|\|\s*process\.env\.NODE_TLS_REJECT_UNAUTHORIZED === '0';/$NEW_CODE/g" "$FILE"
    
    echo "  Arquivo processado com sucesso."
}

# Processa cada arquivo na lista
for FILE in "${CONTROLLERS[@]}"; do
    fix_file "$FILE"
done

echo "Processando ProjectsController para cenário específico..."
sed -i '' -E "s/const OFFLINE_MODE = process\.env\.SUPABASE_OFFLINE_MODE === 'true'/const OFFLINE_MODE = process.env.SUPABASE_OFFLINE_MODE === 'true';\n    \/\/ Log para debug\n    console.log('SUPABASE_OFFLINE_MODE =', process.env.SUPABASE_OFFLINE_MODE);\n    console.log('Modo offline está:', OFFLINE_MODE ? 'ATIVADO' : 'DESATIVADO')/g" "$CONTROLLERS_DIR/projectsController.ts"

echo ""
echo "Correção concluída!"
echo "Agora você precisa reconstruir o backend para que as alterações tenham efeito."
echo "Execute: ./rebuild-backend.sh"
echo ""