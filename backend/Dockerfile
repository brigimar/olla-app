# =========================
# Dockerfile para FastAPI
# =========================

# Etapa base (compartida)
FROM python:3.11-slim AS base

WORKDIR /app

# Variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias de producción
RUN pip install --no-cache-dir -r requirements.txt

# 👉 Instalar dependencias de testing
RUN pip install pytest pytest-asyncio

# Copiar código fuente
COPY . .

# =========================
# Etapa desarrollo (hot-reload)
# =========================
FROM base AS dev

# Instalar watchdog para hot-reload
RUN pip install watchdog

# Puerto
EXPOSE 8000

# Comando con hot-reload (apunta a app.main:app)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# =========================
# Etapa producción (optimizada)
# =========================
FROM python:3.11-slim AS prod

WORKDIR /app

# Variables de entorno para producción
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Instalar solo dependencias esenciales del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copiar solo las dependencias instaladas desde la etapa base
COPY --from=base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=base /usr/local/bin /usr/local/bin

# Copiar código fuente (sin archivos de test)
COPY . .

# Crear usuario no-root para seguridad
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Puerto
EXPOSE 8000

# Comando para producción (sin hot-reload, con workers)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]