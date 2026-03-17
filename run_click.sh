#!/bin/bash
set -e

LOG="/home/felipe/faturamento_academia/cron_rpa.log"

echo "========================================" >> "$LOG"
echo "[DEBUG] Iniciando run_click.sh $(date -u '+%Y-%m-%d %H:%M:%S')" >> "$LOG"

# Ambiente básico para CRON
export HOME=/home/felipe
export PATH="/home/felipe/faturamento_academia/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export DISPLAY=:99
export PLAYWRIGHT_BROWSERS_PATH="/home/felipe/.cache/ms-playwright"

echo "[DEBUG] Python usado pelo CRON:" >> "$LOG"
which python >> "$LOG"
python --version >> "$LOG"

cd /home/felipe/faturamento_academia || exit 1

echo "[DEBUG] Rodando click_automatico.py..." >> "$LOG"
python click_automatico.py >> "$LOG" 2>&1

echo "✅ Script completo finalizado com sucesso." >> "$LOG"
echo "[DEBUG] Finalizado run_click.sh $(date -u '+%Y-%m-%d %H:%M:%S')" >> "$LOG"
