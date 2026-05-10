#!/bin/bash
# smoke-test-v1.26.0.sh - BankPortal - FEAT-024 Objetivos de Ahorro
# Sprint 26 - SOFIA v2.8 - DEBT-049
# Cobertura: 11 endpoints/escenarios canonicos + path 409 (B.4) + multi-cuenta (OBS-008)
# DR-S26-007 (B.4 retry 409), DR-S26-008 (Hallazgos 1+3 auth+multi-cuenta)

BASE_URL="\http://localhost:8081"
EMAIL=".delacuadra@nemtec.es"
PASSWORD="ngel123"
PASS=0; FAIL=0

check() {
  local id="" desc="" url="" expected="" token=""
  local args=(-s -o /dev/null -w "%{http_code}")
  [ -n "" ] && args+=(-H "Authorization: Bearer ")
  local code
  code=  if [ "" = "" ]; then
    echo "PASS [\] "
    PASS=
  else
    echo "FAIL [\] \ [esperado=\ obtenido=\]"
    FAIL=
  fi
}

echo "========================================"
echo " BankPortal Smoke Test v1.26.0"
echo " Target: "
echo " 6-05-08T13:03:05Z"
echo "========================================"

# --- AUTH ---
echo ""
echo "[AUTH]"
TOKEN=# fallback parsing if first read consumed body
if [ -z "" ]; then
  TOKEN=fi

if [ -n "" ]; then
  echo "PASS [SM-01] Login JWT valido"
  PASS=
else
  echo "FAIL [SM-01] Login JWT - token vacio"
  FAIL=
  echo ""
  echo "[ABORT] Sin token, smoke aborta para evitar falsos positivos."
  exit 1
fi

# --- INFRA ---
echo ""
echo "[INFRA]"
check "SM-02" "actuator/health UP" "\/actuator/health" "200"

# --- REGRESION S22-S25 ---
echo ""
echo "[REGRESION S22-S25]"
check "SM-03" "GET /api/v1/accounts (S07 US-701)" "\/api/v1/accounts" "200" ""
check "SM-04" "GET /api/v1/budgets (S22-S25 PFM)" "\/api/v1/budgets" "200" ""

# --- FEAT-024 ENDPOINTS PRINCIPALES ---
echo ""
echo "[FEAT-024 SAVINGS GOALS]"
check "SM-05" "GET /api/v1/savings/goals (lista)" "\/api/v1/savings/goals" "200" ""
check "SM-06" "GET /api/v1/savings/goals/{id} detalle (BUG-Q-001 fix V32 VIAJE)" "\/api/v1/savings/goals/51000000-0000-0000-0000-000000001101" "200" ""
check "SM-07" "GET /api/v1/savings/widget dashboard (S26)" "\/api/v1/savings/widget" "200" ""

# --- POST contribution baseline (BUG-Q-008 fix path normal) ---
echo ""
echo "[FEAT-024 CONTRIBUTION]"
RESP_CODE="000"
if [ "" = "201" ] || [ "" = "200" ]; then
  echo "PASS [SM-08] POST contribution baseline (status=\)"
  PASS=
else
  echo "FAIL [SM-08] POST contribution baseline [esperado=201|200 obtenido=\]"
  FAIL=
fi

# --- PUT auto-rule idempotencia (BUG-Q-003 fix) ---
PUT1="000"
PUT2="000"
if [ "" = "200" ] && [ "" = "200" ]; then
  echo "PASS [SM-09] PUT auto-rule x2 idempotente (BUG-Q-003)"
  PASS=
else
  echo "FAIL [SM-09] PUT auto-rule [PUT1=\ PUT2=\]"
  FAIL=
fi

# --- VALIDACION 400 sin sourceAccountId ---
RESP_400="000"
if [ "" = "400" ]; then
  echo "PASS [SM-10] POST contribution sin sourceAccountId (400 VALIDATION_FAILED)"
  PASS=
else
  echo "FAIL [SM-10] POST sin sourceAccountId [esperado=400 obtenido=\]"
  FAIL=
fi

# --- AUTH 401 sin token ---
check "SM-11" "GET /savings/goals sin token (401)" "\/api/v1/savings/goals" "401"

echo ""
echo "========================================"
echo " RESULTADO: \ PASS / \ FAIL"
echo "========================================"
[ \ -eq 0 ] && exit 0 || exit 1
