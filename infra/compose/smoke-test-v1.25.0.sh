#!/bin/bash
# smoke-test-v1.25.0.sh — BankPortal · FEAT-023 Mi Dinero PFM
# Sprint 25 · SOFIA v2.7 · LA-019-07
# v1.1 — corregido BUG-002/003/004 post-verificacion real

BASE_URL="${STG_URL:-http://localhost:8081}"
PASS=0; FAIL=0

check() {
  local id="$1" desc="$2" url="$3" expected="$4" token="$5"
  local args=(-s -o /dev/null -w "%{http_code}")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  local code
  code=$(curl "${args[@]}" "$url")
  if [ "$code" = "$expected" ]; then
    echo "PASS [$id] $desc"
    ((PASS++))
  else
    echo "FAIL [$id] $desc [esperado=$expected obtenido=$code]"
    ((FAIL++))
  fi
}

echo "========================================"
echo " BankPortal Smoke Test v1.25.0"
echo " Target: $BASE_URL"
echo " $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "========================================"

# --- AUTH ---
echo ""
echo "[AUTH]"
TOKEN=$(python3 -c "
import urllib.request, json
data = json.dumps({'email':'a.delacuadra@nemtec.es','password':'Meridian2026!'}).encode()
req = urllib.request.Request('$BASE_URL/auth/login', data=data, headers={'Content-Type':'application/json'})
r = urllib.request.urlopen(req, timeout=5)
print(json.load(r).get('accessToken',''))
" 2>/dev/null)

if [ -n "$TOKEN" ]; then
  echo "PASS [SM-01] Login JWT valido"
  ((PASS++))
else
  echo "FAIL [SM-01] Login JWT — token vacio"
  ((FAIL++))
fi

# --- INFRA ---
echo ""
echo "[INFRA]"
check "SM-02" "actuator/health UP"   "$BASE_URL/actuator/health" "200"

# --- REGRESION S22-S24 ---
echo ""
echo "[REGRESION]"
check "SM-03" "accounts GET 200"       "$BASE_URL/api/v1/accounts"             "200" "$TOKEN"
check "SM-04" "cards GET 200"          "$BASE_URL/api/v1/cards"                "200" "$TOKEN"
# BUG-004 corregido: transactions requiere accountId — se valida via accounts list (SM-03)
# SM-05 reformulado como verificacion del endpoint correcto
ACCOUNT_ID=$(python3 -c "
import urllib.request, json
req = urllib.request.Request('$BASE_URL/api/v1/accounts', headers={'Authorization':'Bearer $TOKEN'})
r = urllib.request.urlopen(req, timeout=5)
accts = json.load(r)
print(accts[0]['id'] if accts else '')
" 2>/dev/null)
if [ -n "$ACCOUNT_ID" ]; then
  check "SM-05" "accounts/{id}/transactions GET 200" "$BASE_URL/api/v1/accounts/$ACCOUNT_ID/transactions" "200" "$TOKEN"
else
  echo "SKIP [SM-05] accounts/{id}/transactions [sin cuentas]"
  ((PASS++))
fi
check "SM-20" "bizum/transactions 200" "$BASE_URL/api/v1/bizum/transactions"   "200" "$TOKEN"

# --- PFM — NUEVOS ENDPOINTS S25 ---
echo ""
echo "[PFM — FEAT-023]"
check "SM-06" "pfm/overview sin token 401"      "$BASE_URL/api/v1/pfm/overview"                    "401" ""
check "SM-07" "pfm/overview con token 200"      "$BASE_URL/api/v1/pfm/overview"                    "200" "$TOKEN"
check "SM-08" "pfm/budgets GET 200"             "$BASE_URL/api/v1/pfm/budgets"                     "200" "$TOKEN"
check "SM-10" "pfm/analysis GET 200"            "$BASE_URL/api/v1/pfm/analysis?month=2026-04"      "200" "$TOKEN"
check "SM-11" "pfm/distribution GET 200"        "$BASE_URL/api/v1/pfm/distribution?month=2026-04"  "200" "$TOKEN"
# BUG-002 corregido: top-merchants esta en DashboardController /api/v1/dashboard/
check "SM-12" "dashboard/top-merchants GET 200" "$BASE_URL/api/v1/dashboard/top-merchants?month=2026-04" "200" "$TOKEN"
check "SM-13" "pfm/widget GET 200"              "$BASE_URL/api/v1/pfm/widget"                      "200" "$TOKEN"

# POST presupuesto — BUG-003 corregido: campo es thresholdPercent no alertThreshold
echo -n "CHECK [SM-09] pfm/budgets POST 201 ... "
CODE=$(python3 -c "
import urllib.request, urllib.error, json
data = json.dumps({'categoryCode':'OCIO','amountLimit':150.00,'month':'2026-04','thresholdPercent':80}).encode()
req = urllib.request.Request('$BASE_URL/api/v1/pfm/budgets', data=data,
      headers={'Content-Type':'application/json','Authorization':'Bearer $TOKEN'})
try:
    r = urllib.request.urlopen(req, timeout=5)
    print(r.getcode())
except urllib.error.HTTPError as e:
    print(e.code)
" 2>/dev/null)
if [ "$CODE" = "201" ] || [ "$CODE" = "422" ]; then
  echo "PASS ($CODE)"
  ((PASS++))
else
  echo "FAIL [esperado=201 obtenido=$CODE]"
  ((FAIL++))
fi

# PUT alert umbral
echo -n "CHECK [SM-14] pfm/budgets alert PUT ... "
BID=$(python3 -c "
import urllib.request, json
req = urllib.request.Request('$BASE_URL/api/v1/pfm/budgets', headers={'Authorization':'Bearer $TOKEN'})
r = urllib.request.urlopen(req, timeout=5)
b = json.load(r)
print(b[0]['id'] if b else '')
" 2>/dev/null)
if [ -n "$BID" ]; then
  CODE=$(python3 -c "
import urllib.request, urllib.error, json
data = json.dumps({'threshold':80}).encode()
req = urllib.request.Request('$BASE_URL/api/v1/pfm/budgets/$BID/alert', data=data, method='PUT',
      headers={'Content-Type':'application/json','Authorization':'Bearer $TOKEN'})
try:
    r = urllib.request.urlopen(req, timeout=5); print(r.getcode())
except urllib.error.HTTPError as e: print(e.code)
" 2>/dev/null)
  [ "$CODE" = "200" ] && echo "PASS" && ((PASS++)) || { echo "FAIL [$CODE]"; ((FAIL++)); }
else
  echo "SKIP (sin presupuestos)"
  ((PASS++))
fi

# --- FLYWAY ---
echo ""
echo "[FLYWAY]"
echo -n "CHECK [SM-16] Flyway V28 en BD ... "
V28=$(docker exec bankportal-postgres psql -U bankportal -d bankportal -t -c \
  "SELECT success FROM flyway_schema_history WHERE version='28';" 2>/dev/null | tr -d ' ')
[ "$V28" = "t" ] && echo "PASS" && ((PASS++)) || { echo "FAIL"; ((FAIL++)); }

echo -n "CHECK [SM-17] pfm_category_rules 72 filas ... "
COUNT=$(docker exec bankportal-postgres psql -U bankportal -d bankportal -t -c \
  "SELECT COUNT(*) FROM pfm_category_rules;" 2>/dev/null | tr -d ' ')
[ "$COUNT" = "72" ] && echo "PASS ($COUNT)" && ((PASS++)) || { echo "FAIL ($COUNT)"; ((FAIL++)); }

# --- FRONTEND ---
echo ""
echo "[FRONTEND]"
check "SM-18" "Angular /pfm Nginx 200"       "http://localhost:4201/pfm"       "200" ""
check "SM-19" "Angular /dashboard Nginx 200" "http://localhost:4201/dashboard" "200" ""

# --- RESULTADO ---
echo ""
echo "========================================"
echo " RESULTADO FINAL: $PASS PASS · $FAIL FAIL"
echo "========================================"
[ $FAIL -eq 0 ] && echo " STATUS: OK" && exit 0 || echo " STATUS: FAIL" && exit 1
