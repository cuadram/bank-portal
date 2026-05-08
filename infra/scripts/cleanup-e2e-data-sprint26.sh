#!/bin/bash
# cleanup-e2e-data-sprint26.sh - Limpia datos seed E2E residuales QA Step 6
# Sprint 26 - Step 7 - Hallazgo 2 cosmetico (DR-S26-008)
# 
# Datos eliminados:
#   - Goals con name LIKE '<script%' (test sanitización XSS)
#   - Goals con name LIKE 'E2E %' (auto-generados E2E ownership/AR/SCA tests)
#
# Idempotente: re-ejecutable sin efectos secundarios.
# Se ejecuta SOLO en local-dev/staging. NUNCA en producción.

set -e

if [ "${SPRING_PROFILES:-staging}" = "production" ]; then
  echo "ABORT: cleanup-e2e-data NO se ejecuta en production"
  exit 1
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_NAME="${DB_NAME:-bankportal}"
DB_USER="${DB_USER:-bankportal}"

echo "[cleanup-e2e-data-sprint26] target: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Cuenta primero
docker exec bankportal-postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c \
  "SELECT COUNT(*) FROM savings_goals WHERE name LIKE '<script%' OR name LIKE 'E2E %';"

# Borra
docker exec bankportal-postgres psql -U "$DB_USER" -d "$DB_NAME" -c \
  "DELETE FROM savings_goals WHERE name LIKE '<script%' OR name LIKE 'E2E %';"

echo "[cleanup-e2e-data-sprint26] OK"
