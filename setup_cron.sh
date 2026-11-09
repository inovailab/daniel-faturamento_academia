#!/bin/bash
# =============================================================
# setup_cron.sh
# Instala o cron job para rodar o RPA todo dia às 11h (BRT)
# Execute DENTRO do container: docker exec -it <container> bash setup_cron.sh
# OU copie para dentro e rode: bash /opt/app/daniel-faturamento_academia/setup_cron.sh
# =============================================================

set -e

APP_DIR="/opt/app/daniel-faturamento_academia"
LOG_FILE="$APP_DIR/cron_rpa.log"
SCRIPT="$APP_DIR/run_click.sh"

echo "📦 Instalando cron (se necessário)..."
apt-get update -qq && apt-get install -y -qq cron

echo "🔒 Garantindo permissão de execução no run_click.sh..."
chmod +x "$SCRIPT"

# ---------------------------------------------------------------
# Cron: 06h30 horário de Brasília (BRT = UTC-3 → 09:30 UTC)
# ---------------------------------------------------------------

echo "📝 Registrando cron em /etc/cron.d/rpa_faturamento..."
cat > /etc/cron.d/rpa_faturamento <<EOF
# Roda o RPA de faturamento todos os dias às 6h30 BRT (09h30 UTC)
SHELL=/bin/bash
PATH=/opt/app/daniel-faturamento_academia/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
HOME=/root
PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright
HEADLESS=1

30 09 * * * root bash $SCRIPT >> $LOG_FILE 2>&1
EOF

chmod 644 /etc/cron.d/rpa_faturamento

echo "✅ Cron instalado com sucesso!"
echo ""
echo "📋 Conteúdo do cron registrado:"
cat /etc/cron.d/rpa_faturamento

echo ""
echo "▶️  Iniciando serviço cron..."
service cron start || cron

echo ""
echo "🔍 Para ver os logs em tempo real, rode:"
echo "   tail -f $LOG_FILE"
