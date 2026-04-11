#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# BankPortal — Script de arranque local STG
# Genera par RSA RS256, actualiza .env y levanta el stack con Docker Compose
# ─────────────────────────────────────────────────────────────────────────────

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 BankPortal — Arranque local STG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Generar par RSA-2048 para JWT RS256 ────────────────────────────────────
if grep -q "PLACEHOLDER" .env; then
  echo ""
  echo "  🔑 Generando par RSA-2048 para JWT RS256..."
  TMP=$(mktemp -d)
  openssl genrsa -out "$TMP/private.pem" 2048 2>/dev/null
  openssl rsa -in "$TMP/private.pem" -pubout -out "$TMP/public.pem" 2>/dev/null

  PRIV_B64=$(base64 -i "$TMP/private.pem" | tr -d '\n')
  PUB_B64=$(base64 -i "$TMP/public.pem" | tr -d '\n')

  # Sustituir placeholders en .env
  TOTP_KEY=$(openssl rand -base64 32 | tr -d '\n')
  sed -i.bak -e "s|JWT_PRIVATE_KEY=.*|JWT_PRIVATE_KEY=${PRIV_B64}|" .env
  sed -i.bak -e "s|JWT_PUBLIC_KEY=.*|JWT_PUBLIC_KEY=${PUB_B64}|" .env
  sed -i.bak -e "s|TOTP_ENCRYPTION_KEY=.*|TOTP_ENCRYPTION_KEY=${TOTP_KEY}|" .env
  rm -f .env.bak
  rm -rf "$TMP"
  echo "  ✅ Par RSA generado e inyectado en .env"
else
  echo "  ✅ Claves JWT ya configuradas en .env"
fi

# ── 2. Actualizar IMAGE_TAG al último sprint ──────────────────────────────────
sed -i.bak "s|IMAGE_TAG=.*|IMAGE_TAG=local-dev|" .env
sed -i.bak "s|SPRING_PROFILE=.*|SPRING_PROFILE=staging|" .env

# ── 3. Levantar stack ─────────────────────────────────────────────────────────
echo ""
echo "  🐳 Construyendo y levantando stack (puede tardar ~3 min la primera vez)..."
echo ""

# Solo infraestructura primero (postgres + redis + mailhog)
docker compose up -d postgres redis mailhog
echo "  ⏳ Esperando que PostgreSQL esté healthy..."
docker compose exec -T postgres sh -c \
  'until pg_isready -U bankportal; do sleep 1; done' 2>/dev/null || sleep 10

# Backend
echo "  🔧 Construyendo backend (Maven + Java 21)..."
docker compose up -d --build backend
echo "  ⏳ Esperando health check del backend (hasta 2 min)..."
for i in $(seq 1 24); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' bankportal-backend 2>/dev/null)
  if [ "$STATUS" = "healthy" ]; then
    echo "  ✅ Backend healthy"
    break
  fi
  echo "     Intento $i/24 — estado: $STATUS"
  sleep 5
done

# Frontend
echo "  🎨 Construyendo frontend (Angular)..."
docker compose up -d --build frontend

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ BankPortal STG ARRANCADO"
echo ""
echo "  🌐 Frontend:    http://localhost:4201"
echo "  ⚙️  API Backend: http://localhost:8081"
echo "  💊 Health:      http://localhost:8081/actuator/health"
echo "  📊 Metrics:     http://localhost:8081/actuator/metrics"
echo "  📧 MailHog:     http://localhost:8025"
echo "  🗄️  PostgreSQL:  localhost:5433 (bankportal/bankportal_stg_2026)"
echo "  🔴 Redis:       localhost:6380"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Para ver logs en tiempo real:"
echo "    docker compose -f $SCRIPT_DIR/docker-compose.yml logs -f backend"
echo ""
echo "  Para parar el stack:"
echo "    docker compose -f $SCRIPT_DIR/docker-compose.yml down"
echo ""
