#!/bin/bash
# Script para executar a análise de sentimento a cada 2 horas

# Definir diretório base do projeto
PROJECT_DIR="$(dirname "$(dirname "$0")")"
LOG_DIR="$PROJECT_DIR/logs"
SCRIPT_PATH="$PROJECT_DIR/scripts/sentiment-analysis.js"

# Criar diretório de logs se não existir
mkdir -p "$LOG_DIR"

# Definir arquivo de log com timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/sentiment-analysis_$TIMESTAMP.log"

echo "====== Iniciando análise de sentimento em $(date) ======" | tee -a "$LOG_FILE"

# Verificar se o arquivo do script existe
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "ERRO: Script de análise de sentimento não encontrado em $SCRIPT_PATH" | tee -a "$LOG_FILE"
    exit 1
fi

# Carregar variáveis de ambiente se existir um arquivo .env
if [ -f "$PROJECT_DIR/.env" ]; then
    echo "Carregando variáveis de ambiente de $PROJECT_DIR/.env" | tee -a "$LOG_FILE"
    source "$PROJECT_DIR/.env"
fi

# Executar o script de análise
echo "Executando análise de sentimento..." | tee -a "$LOG_FILE"
cd "$PROJECT_DIR" && node "$SCRIPT_PATH" 2>&1 | tee -a "$LOG_FILE"

# Verificar resultado
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "Análise de sentimento concluída com sucesso em $(date)" | tee -a "$LOG_FILE"
else
    echo "ERRO: Falha na execução da análise de sentimento" | tee -a "$LOG_FILE"
    exit 1
fi

echo "====== Fim da análise de sentimento ======" | tee -a "$LOG_FILE"