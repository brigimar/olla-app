# =========================
# Etapa base
# =========================
FROM python:3.11-slim AS base

# Evitar prompts interactivos y mejorar logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema (ej. locales, compiladores)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements y dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY ./app ./app

# =========================
# Etapa desarrollo (hot-reload)
# =========================
FROM base AS dev

# Instalar dependencias extra para desarrollo
RUN pip install --no-cache-dir watchdog

# Comando de arranque con hot-reload
# ⚠️ IMPORTANTE: apunta a app/main.py
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# =========================
# Etapa producción
# =========================
FROM base AS prod

# Comando de arranque estable (sin reload)
# Usa múltiples workers para mayor rendimiento
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
