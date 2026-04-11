#!/bin/bash
# smoke-test-v1.20.sh — BankPortal v1.20.0
# Sprint 20 · FEAT-018 + DEBT-032..035
# LA-019-07: smoke test actualizado obligatorio por sprint

set -euo pipefail
BASE_URL="${BANKPORTAL_URL:-http://localhost:8080}"
PASS=0; FAIL=0

check() {
  local desc="$1"; local expected="$2"; local actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "  ✅ $desc"; PASS=$((PASS+1))
  else
    echo "  ❌ $desc (esperado: $expected, obtenido: $actual)"; FAIL=$((FAIL+1))
  fi
}

echo "=== Smoke Test BankPortal v1.20.0 ==="
echo "Base URL: $BASE_URL"
echo ""

# --- Health ---
echo "[ Health ]"
R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/actuator/health")
check "Health endpoint" "200" "$R"

# --- Auth ---
echo "[ Auth ]"
R=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"test@meridian.es","password":"wrong"}')
check "Login credenciales inválidas → 401" "401" "$R"

# --- Accounts ---
echo "[ Accounts ]"
R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/accounts")
check "Accounts sin JWT → 401" "401" "$R"

# --- Direct Debits (S19) ---
echo "[ Direct Debits S19 ]"
R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/accounts/00000000-0000-0000-0000-000000000001/direct-debits")
check "Direct debits sin JWT → 401" "401" "$R"

# --- Export endpoints (FEAT-018 NEW) ---
echo "[ Export FEAT-018 ]"
FAKE_ID="00000000-0000-0000-0000-000000000001"

R=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/api/v1/accounts/$FAKE_ID/exports/preview?fechaDesde=2026-01-01&fechaHasta=2026-03-30")
check "Export preview sin JWT → 401" "401" "$R"

R=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$BASE_URL/api/v1/accounts/$FAKE_ID/exports/pdf" \
  -H "Content-Type: application/json" \
  -d '{"fechaDesde":"2026-01-01","fechaHasta":"2026-03-30"}')
check "Export PDF sin JWT → 401" "401" "$R"

R=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$BASE_URL/api/v1/accounts/$FAKE_ID/exports/csv" \
  -H "Content-Type: application/json" \
  -d '{"fechaDesde":"2026-01-01","fechaHasta":"2026-03-30"}')
check "Export CSV sin JWT → 401" "401" "$R"

# --- Flyway V21 ---
echo "[ Flyway ]"
R=$(docker compose exec -T postgres psql -U bankportal -d bankportal_db -tAc \
  "SELECT COUNT(*) FROM flyway_schema_history WHERE version='21' AND success=true;" 2>/dev/null || echo "0")
check "Flyway V21 ejecutado" "1" "$R"

# --- export_audit_log tabla ---
echo "[ BD ]"
R=$(docker compose exec -T postgres psql -U bankportal -d bankportal_db -tAc \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='export_audit_log';" 2>/dev/null || echo "0")
check "Tabla export_audit_log existe" "1" "$R"

# --- Transfers (S17 regresión) ---
echo "[ Regresión S17 ]"
R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/accounts/$FAKE_ID/scheduled-transfers")
check "Scheduled transfers sin JWT → 401" "401" "$R"

# --- Cards (S18 regresión) ---
echo "[ Regresión S18 ]"
R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/accounts/$FAKE_ID/cards")
check "Cards sin JWT → 401" "401" "$R"

echo ""
echo "==================================="
echo "RESULTADO: ${PASS} PASS | ${FAIL} FAIL"
echo "==================================="
[ "$FAIL" -eq 0 ] && echo "✅ SMOKE TEST PASS" && exit 0 || echo "❌ SMOKE TEST FAIL" && exit 1
