#!/bin/bash
# =============================================================
# docker-entrypoint.sh
# Inicia o serviço cron em background e depois sobe o Flask
# =============================================================
set -e

APP_DIR="/opt/app/daniel-faturamento_academia"
LOG_FILE="$APP_DIR/cron_rpa.log"

# Garante que o arquivo de log existe para o tail funcionar logo
touch "$LOG_FILE"

echo "🕐 Iniciando serviço cron..."
service cron start

echo "✅ Cron rodando. Próxima execução RPA: 09h BRT (12h UTC) todos os dias."
echo "   Para ver logs: docker logs <container> -f  OU  tail -f $LOG_FILE"
echo ""

echo "🚀 Iniciando aplicação Flask..."
exec python -u app.py
