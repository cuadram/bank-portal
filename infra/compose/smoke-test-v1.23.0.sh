#!/bin/bash
# smoke-test-v1.23.0.sh — BankPortal Sprint 23 FEAT-021
# Uso: bash infra/compose/smoke-test-v1.23.0.sh

BASE="http://localhost:8081"
FRONTEND="http://localhost:4201"
PASS=0; FAIL=0

check() {
  local desc=$1; local expected=$2; local actual=$3
  if echo "$actual" | grep -q "$expected"; then
    echo "PASS: $desc"; ((PASS++))
  else
    echo "FAIL: $desc (expected: $expected, got: $actual)"; ((FAIL++))
  fi
}

check "ST-01 Backend health"   "UP"  "$(curl -s $BASE/actuator/health | grep -o UP)"
check "ST-02 Frontend up"      "200" "$(curl -s -o /dev/null -w '%{http_code}' $FRONTEND)"
check "ST-03 GET /deposits no JWT -> 401" "401" "$(curl -s -o /dev/null -w '%{http_code}' $BASE/api/v1/deposits)"
check "ST-04 POST /simulate publico -> 200" "200" "$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{"importe":10000,"plazoMeses":12}' $BASE/api/v1/deposits/simulate)"
check "ST-05 POST /deposits no JWT -> 401" "401" "$(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/v1/deposits)"
check "ST-06 Flyway V26 aplicado" "26" "$(docker exec bankportal-postgres psql -U bankportal -d bankportal -t -c "SELECT COUNT(*) FROM flyway_schema_history WHERE version='26';" 2>/dev/null | tr -d ' ')"

echo ""
echo "Resultado: $PASS PASS | $FAIL FAIL"
[ $FAIL -eq 0 ] && echo "SMOKE TEST: OK" && exit 0 || exit 1
