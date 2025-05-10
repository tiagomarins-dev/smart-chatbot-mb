#!/bin/bash
# Script para instalar o crontab para execução da análise de sentimento a cada 2 horas

# Obter o caminho absoluto do diretório do projeto
PROJECT_DIR="$(cd "$(dirname "$0")" && cd .. && pwd)"
CRON_SCRIPT="$PROJECT_DIR/cron/sentiment-analysis-cron.sh"

# Verificar se o script de análise existe
if [ ! -f "$CRON_SCRIPT" ]; then
    echo "ERRO: Script de análise de sentimento não encontrado em $CRON_SCRIPT"
    exit 1
fi

# Tornar o script executável se ainda não for
chmod +x "$CRON_SCRIPT"

# Criar uma entrada de crontab temporária
TEMP_CRONTAB=$(mktemp)

# Exportar o crontab atual
crontab -l > "$TEMP_CRONTAB" 2>/dev/null || echo "" > "$TEMP_CRONTAB"

# Verificar se a entrada já existe
if grep -q "sentiment-analysis-cron.sh" "$TEMP_CRONTAB"; then
    echo "A entrada de crontab para análise de sentimento já existe."
    rm "$TEMP_CRONTAB"
    exit 0
fi

# Adicionar a nova entrada para executar a cada 2 horas (às 0:00, 2:00, 4:00, etc.)
echo "# Análise de sentimento de leads a cada 2 horas" >> "$TEMP_CRONTAB"
echo "0 */2 * * * $CRON_SCRIPT" >> "$TEMP_CRONTAB"

# Instalar o novo crontab
crontab "$TEMP_CRONTAB"
rm "$TEMP_CRONTAB"

echo "Crontab instalado com sucesso. A análise de sentimento será executada a cada 2 horas."
echo "Comando cron instalado: 0 */2 * * * $CRON_SCRIPT"
echo "Próxima execução: $(date -d "$(date +%Y-%m-%d) $(( ($(date +%H) / 2 + 1) * 2 )):00:00")"