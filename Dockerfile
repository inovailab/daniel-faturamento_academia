FROM python:3.11-slim

# ── Dependências do sistema + cron ─────────────────────────────
RUN apt-get update && apt-get install -y \
    cron \
    curl \
    wget \
    gnupg \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    fonts-liberation \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# ── Diretório da aplicação ──────────────────────────────────────
WORKDIR /opt/app/daniel-faturamento_academia

# ── Dependências Python ─────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Playwright (chromium headless) ──────────────────────────────
RUN pip install playwright && playwright install chromium --with-deps

# ── Código da aplicação ─────────────────────────────────────────
COPY . .

# ── Permissões dos scripts shell ────────────────────────────────
RUN chmod +x run_click.sh setup_cron.sh

# ── Variáveis de ambiente ───────────────────────────────────────
ENV HOME=/root
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright
ENV HEADLESS=1
ENV PYTHONUNBUFFERED=1

# ── Cron job: 8h BRT = 11h UTC ─────────────────────────────────
RUN echo "SHELL=/bin/bash" > /etc/cron.d/rpa_faturamento && \
    echo "PATH=/opt/app/daniel-faturamento_academia/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" >> /etc/cron.d/rpa_faturamento && \
    echo "HOME=/root" >> /etc/cron.d/rpa_faturamento && \
    echo "PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright" >> /etc/cron.d/rpa_faturamento && \
    echo "HEADLESS=1" >> /etc/cron.d/rpa_faturamento && \
    echo "" >> /etc/cron.d/rpa_faturamento && \
    echo "# RPA faturamento: todo dia às 08h BRT (11h UTC)" >> /etc/cron.d/rpa_faturamento && \
    echo "0 11 * * * root bash /opt/app/daniel-faturamento_academia/run_click.sh >> /opt/app/daniel-faturamento_academia/cron_rpa.log 2>&1" >> /etc/cron.d/rpa_faturamento && \
    chmod 644 /etc/cron.d/rpa_faturamento && \
    crontab /etc/cron.d/rpa_faturamento

# ── Entrypoint: sobe cron + aplicação Flask juntos ─────────────
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 5000
ENTRYPOINT ["/docker-entrypoint.sh"]
