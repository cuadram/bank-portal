#!/bin/bash
# smoke-test-v1.21.0.sh — BankPortal Sprint 21 FEAT-019
# SOFIA QA Tester v2.3 — LA-019-07: smoke test obligatorio por sprint
# Ejecutar contra STG con JPA-REAL activo
# Uso: ./smoke-test-v1.21.0.sh [BASE_URL] [USER_JWT] [ADMIN_JWT]

BASE_URL="${1:-http://localhost:8080}"
USER_JWT="${2:-}"
ADMIN_JWT="${3:-}"
OK=0; FAIL=0

check() {
  local desc="$1"; local expected="$2"; local actual="$3"
  if [ "$actual" = "$expected" ]; then
    printf "  \033[32m✅\033[0m %s\n" "$desc"
    OK=$((OK+1))
  else
    printf "  \033[31m❌\033[0m %s (esperado: %s, obtenido: %s)\n" "$desc" "$expected" "$actual"
    FAIL=$((FAIL+1))
  fi
}

echo "=============================================="
echo " BankPortal Smoke Test v1.21.0 — FEAT-019"
echo " BASE: $BASE_URL"
echo " $(date -u)"
echo "=============================================="

# ── [1] Health ────────────────────────────────────
echo ""
echo "[1] Health Check"
SC=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/actuator/health")
check "GET /actuator/health → 200" "200" "$SC"

# ── [2] Auth barrier ─────────────────────────────
echo ""
echo "[2] Auth — barreras de autenticación"
SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Accept: application/json" "$BASE_URL/api/v1/profile")
check "GET /profile sin JWT → 401" "401" "$SC"
SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Accept: application/json" "$BASE_URL/api/v1/privacy/consents")
check "GET /privacy/consents sin JWT → 401" "401" "$SC"
SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Accept: application/json" "$BASE_URL/api/v1/admin/gdpr-requests")
check "GET /admin/gdpr-requests sin JWT → 401" "401" "$SC"

# ── [3] Profile (RF-019-01/02) ────────────────────
echo ""
echo "[3] Profile — RF-019-01/02"
SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_JWT" "$BASE_URL/api/v1/profile")
check "GET /profile con JWT → 200" "200" "$SC"

SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_JWT" \
  -X PATCH -H "Content-Type: application/json" \
  -d '{"email":"hack@test.com"}' "$BASE_URL/api/v1/profile")
check "PATCH /profile con email (RN-F019-01) → 400" "400" "$SC"

# ── [4] Sessions (RF-019-03) ─────────────────────
echo ""
echo "[4] Sessions — RF-019-03"
SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_JWT" \
  "$BASE_URL/api/v1/profile/sessions")
check "GET /profile/sessions → 200" "200" "$SC"

SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_JWT" \
  -X DELETE "$BASE_URL/api/v1/profile/sessions/current-session-id-placeholder")
check "DELETE sesión actual (RN-F019-07) → 409" "409" "$SC"

# ── [5] Privacy Consents (RF-019-04) ─────────────
echo ""
echo "[5] Privacy Consents — RF-019-04"
SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_JWT" \
  "$BASE_URL/api/v1/privacy/consents")
check "GET /privacy/consents → 200" "200" "$SC"

SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_JWT" \
  -X PATCH -H "Content-Type: application/json" \
  -d '{"tipo":"SECURITY","activo":false}' "$BASE_URL/api/v1/privacy/consents")
check "PATCH SECURITY=false (RN-F019-10) → 422" "422" "$SC"

SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_JWT" \
  -X PATCH -H "Content-Type: application/json" \
  -d '{"tipo":"MARKETING","activo":false}' "$BASE_URL/api/v1/privacy/consents")
check "PATCH MARKETING=false → 200" "200" "$SC"

SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_JWT" \
  -X PATCH -H "Content-Type: application/json" \
  -d '{"tipo":"ANALYTICS","activo":true}' "$BASE_URL/api/v1/privacy/consents")
check "PATCH ANALYTICS=true → 200" "200" "$SC"

# ── [6] Data Export (RF-019-05) ──────────────────
echo ""
echo "[6] Data Export — RF-019-05"
SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_JWT" \
  -X POST "$BASE_URL/api/v1/privacy/data-export")
check "POST /data-export 1ª vez → 202" "202" "$SC"

SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_JWT" \
  -X POST "$BASE_URL/api/v1/privacy/data-export")
check "POST /data-export 2ª vez (RN-F019-12) → 409" "409" "$SC"

SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_JWT" \
  "$BASE_URL/api/v1/privacy/data-export/status")
check "GET /data-export/status → 200" "200" "$SC"

# ── [7] Deletion (RF-019-06) ─────────────────────
echo ""
echo "[7] Deletion — RF-019-06"
# Solo verifica que el endpoint responde con formato esperado
SC=$(curl -s -o /dev/null -w "%{http_code}" \
  -X GET "$BASE_URL/api/v1/privacy/deletion-request/confirm?requestId=00000000-0000-0000-0000-000000000000")
check "GET /deletion-request/confirm UUID inexistente → 404" "404" "$SC"

# NOTE: POST /deletion-request no se ejecuta en smoke (requiere OTP real)
# DEBT-041: cuando OTP esté implementado, añadir TC aquí

# ── [8] Admin GDPR (RF-019-07) ───────────────────
echo ""
echo "[8] Admin GDPR — RF-019-07"
SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_JWT" \
  "$BASE_URL/api/v1/admin/gdpr-requests")
check "GET /admin/gdpr-requests rol USER → 403" "403" "$SC"

if [ -n "$ADMIN_JWT" ]; then
  SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ADMIN_JWT" \
    "$BASE_URL/api/v1/admin/gdpr-requests")
  check "GET /admin/gdpr-requests rol ADMIN → 200" "200" "$SC"
else
  echo "  ⚠️  ADMIN_JWT no proporcionado — TC-admin omitido"
fi

# ── [9] Regresión sprints anteriores ─────────────
echo ""
echo "[9] Regresión — Sprints anteriores"
SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_JWT" \
  "$BASE_URL/api/v1/accounts")
check "GET /accounts → 200 (FEAT-001/FEAT-003)" "200" "$SC"

SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_JWT" \
  "$BASE_URL/api/v1/notifications/preferences")
check "GET /notifications/preferences → 200 (FEAT-014)" "200" "$SC"

SC=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $USER_JWT" \
  -X POST -H "Content-Type: application/json" \
  -d '{"accountId":"00000000-0000-0000-0000-000000000000","format":"CSV"}' \
  "$BASE_URL/api/v1/export/transactions")
check "POST /export/transactions (FEAT-018) → 202 o 404" "202" "$SC" 2>/dev/null || \
check "POST /export/transactions (FEAT-018) → 404 (account no existe)" "404" "$SC"

# ── Resultado final ───────────────────────────────
echo ""
echo "=============================================="
TOTAL=$((OK+FAIL))
printf " RESULTADO: %d/%d OK | %d FAIL\n" "$OK" "$TOTAL" "$FAIL"
echo "=============================================="
if [ $FAIL -eq 0 ]; then
  printf " \033[32m✅ SMOKE TEST PASS — v1.21.0\033[0m\n"
  exit 0
else
  printf " \033[31m❌ SMOKE TEST FAIL — revisar endpoints\033[0m\n"
  exit 1
fi
