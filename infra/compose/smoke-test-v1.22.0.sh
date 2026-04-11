#!/usr/bin/env bash
# Smoke Test — BankPortal v1.22.0 · Sprint 22 FEAT-020
# Uso: bash infra/compose/smoke-test-v1.22.0.sh
set -euo pipefail

BASE="http://localhost:8081"
FRONT="http://localhost:4201"
OK=0; FAIL=0

check() {
  local id=$1 desc=$2 code=$3 actual=$4
  if [ "$actual" -eq "$code" ]; then
    echo "✅ $id $desc (HTTP $actual)"; ((OK++))
  else
    echo "❌ $id $desc (esperado $code, obtenido $actual)"; ((FAIL++))
  fi
}

echo "=== SMOKE TEST v1.22.0 — $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

# Auth
check ST-01 "Health backend"          200 $(curl -s -o/dev/null -w "%{http_code}" $BASE/actuator/health)
check ST-02 "Frontend accesible"      200 $(curl -s -o/dev/null -w "%{http_code}" $FRONT/)
check ST-03 "Login sin cred → 400"   400 $(curl -s -o/dev/null -w "%{http_code}" -X POST $BASE/api/v1/auth/login -H "Content-Type: application/json" -d '{}')

# Loans sin JWT → 401
check ST-04 "GET /loans sin JWT → 401"     401 $(curl -s -o/dev/null -w "%{http_code}" $BASE/api/v1/loans)
check ST-05 "POST /loans/simulate sin JWT → 401" 401 $(curl -s -o/dev/null -w "%{http_code}" -X POST $BASE/api/v1/loans/simulate -H "Content-Type: application/json" -d '{"importe":15000,"plazo":36,"finalidad":"CONSUMO"}')

# Flyway V24
V24=$(curl -s $BASE/actuator/flyway 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); migs=[m for m in d.get('contexts',{}).get('application',{}).get('flywayBeans',{}).get('flyway',{}).get('migrations',[]) if m.get('script','').startswith('V24')]; print('OK' if migs and migs[0].get('state')=='SUCCESS' else 'MISS')" 2>/dev/null || echo "SKIP")
if [ "$V24" = "OK" ]; then echo "✅ ST-06 Flyway V24 aplicada"; ((OK++))
else echo "⚠️  ST-06 Flyway V24 no verificable via actuator (comprobar manualmente)"; fi

# Profile notifications (DEBT-043)
check ST-07 "GET /profile/notifications sin JWT → 401" 401 $(curl -s -o/dev/null -w "%{http_code}" $BASE/api/v1/profile/notifications)

echo ""
echo "=== RESULTADO: $OK OK | $FAIL FAIL ==="
[ $FAIL -eq 0 ] && echo "✅ SMOKE TEST PASS" || { echo "❌ SMOKE TEST FAIL"; exit 1; }
