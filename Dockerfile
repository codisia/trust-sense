# =============================
# Stage 1: Build frontend
# =============================
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Build args pour Vite
ARG VITE_API_URL=
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL VITE_SUPABASE_URL=$VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Copier package files et installer deps
# Force cache invalidation for frontend build - updated 2026-03-07 v2
COPY frontend/package*.json ./
RUN npm install

# Copier tout le frontend (cache bust)
COPY frontend/ .
# Créer .env.production pour build
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env.production && \
    echo "VITE_SUPABASE_URL=${VITE_SUPABASE_URL}" >> .env.production && \
    echo "VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}" >> .env.production

# Build frontend
RUN npm run build

# =============================
# Stage 2: Build backend
# =============================
FROM python:3.11-slim AS backend-builder

WORKDIR /app/backend

# Installer dépendances de build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc postgresql-client libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copier et installer requirements
COPY backend/requirements-deploy.txt .
RUN pip install --no-cache-dir -r requirements-deploy.txt

# =============================
# Stage 3: Image finale
# =============================
FROM python:3.11-slim

WORKDIR /app

# Copier backend
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY backend /app/backend

# Copier frontend build
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Installer uvicorn et FastAPI (avec --break-system-packages si nécessaire)
RUN pip install --no-cache-dir fastapi uvicorn

# Créer un utilisateur non-root pour sécurité
RUN groupadd -r appuser && useradd -r -g appuser appuser && \
    chown -R appuser:appuser /app

USER appuser

# Expose un seul port pour VS Code / Fly.io
EXPOSE 8080

# Set working directory to backend
WORKDIR /app/backend

# Override entrypoint to allow CMD to work
ENTRYPOINT []

# Lancer le backend FastAPI qui sert aussi les fichiers statiques
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port 8080"]