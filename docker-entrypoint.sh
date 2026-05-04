# ── Variáveis de ambiente ───────────────────────────────────────
#!/bin/bash
# =============================================================
# docker-entrypoint.sh
# Inicia a aplicação Flask
# =============================================================
set -e

APP_DIR="/opt/app/daniel-faturamento_academia"

echo "🚀 Iniciando aplicação Flask com Gunicorn..."
exec gunicorn --bind 0.0.0.0:8000 --workers 2 --timeout 120 app:app
