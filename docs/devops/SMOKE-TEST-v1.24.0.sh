#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════
# SMOKE TEST — BankPortal v1.24.0 — Sprint 24 — FEAT-022
# LA-019-07: Smoke test actualizado es artefacto obligatorio
# ══════════════════════════════════════════════════════════
set -euo pipefail

BASE="${BASE_URL:-http://localhost:8081}"
FE="${FE_URL:-http://localhost:4201}"
PASS=0; FAIL=0

check() {
  local id="$1" desc="$2" expected="$3"
  shift 3
  local actual
  actual=$(curl -s -o /dev/null -w "%{http_code}" "$@")
  if [ "$actual" = "$expected" ]; then
    echo "✅ $id $desc → HTTP $actual"
    PASS=$((PASS+1))
  else
    echo "❌ $id $desc → HTTP $actual (esperado $expected)"
    FAIL=$((FAIL+1))
  fi
}

echo "════════════════════════════════════════════════════"
echo " SMOKE TEST BankPortal v1.24.0 — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "════════════════════════════════════════════════════"

# ── Infraestructura ────────────────────────────────────
check SM-01 "Liveness backend"  200 "$BASE/actuator/health/liveness"
check SM-02 "Readiness backend" 200 "$BASE/actuator/health/readiness"
check SM-03 "Frontend SPA"      200 "$FE/"

# ── Auth (S1-S3) ───────────────────────────────────────
check SM-04 "Login sin credenciales → 400/401" 401 -X POST "$BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" -d '{}'
check SM-05 "Token sin JWT → 401" 401 "$BASE/api/v1/accounts"

# ── Endpoints existentes S1-S23 (sin token → 401) ─────
check SM-06  "Accounts sin token"      401 "$BASE/api/v1/accounts"
check SM-07  "Transactions sin token"  401 "$BASE/api/v1/transactions"
check SM-08  "Loans sin token"         401 "$BASE/api/v1/loans"
check SM-09  "Deposits sin token"      401 "$BASE/api/v1/deposits"
check SM-10  "Cards sin token"         401 "$BASE/api/v1/cards"
check SM-11  "Profile sin token"       401 "$BASE/api/v1/profile"
check SM-12  "Privacy sin token"       401 "$BASE/api/v1/privacy/consents"

# ── FEAT-022 Bizum — NUEVOS S24 ────────────────────────
check SM-13  "Bizum status sin token"       401 "$BASE/api/v1/bizum/status"
check SM-14  "Bizum activate sin token"     401 -X POST "$BASE/api/v1/bizum/activate" \
  -H "Content-Type: application/json" -d '{}'
check SM-15  "Bizum payments sin token"     401 -X POST "$BASE/api/v1/bizum/payments" \
  -H "Content-Type: application/json" -d '{}'
check SM-16  "Bizum transactions sin token" 401 "$BASE/api/v1/bizum/transactions"

# ── Resultado ──────────────────────────────────────────
echo "════════════════════════════════════════════════════"
echo " RESULTADO: $PASS PASS / $FAIL FAIL de $((PASS+FAIL))"
echo "════════════════════════════════════════════════════"
[ "$FAIL" -eq 0 ] && echo " ✅ SMOKE PASS — v1.24.0 operativa" && exit 0
echo " ❌ SMOKE FAIL — revisar logs antes de promover" && exit 1
