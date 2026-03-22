#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# BankPortal — Smoke test API endpoints Sprint 12
# Llama a todos los endpoints con un JWT de prueba (staging mock)
# ─────────────────────────────────────────────────────────────────────────────

BASE="http://localhost:8081"
OK=0; FAIL=0

check() {
  local label=$1 url=$2 expected=$3
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url" \
    -H "Authorization: Bearer $JWT" 2>/dev/null)
  if [ "$STATUS" = "$expected" ]; then
    echo "  ✅ $label → HTTP $STATUS"
    OK=$((OK+1))
  else
    echo "  ❌ $label → HTTP $STATUS (esperado $expected)"
    FAIL=$((FAIL+1))
  fi
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔍 BankPortal — Smoke Test API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Health (sin auth)
echo ""
echo "  Infraestructura:"
HEALTH=$(curl -s "$BASE/actuator/health" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null)
echo "  ✅ Actuator health → $HEALTH"

# Flyway migrations
FLYWAY=$(curl -s "$BASE/actuator/flyway" | python3 -c "
import sys,json
d=json.load(sys.stdin)
migrations=d.get('contexts',{})
for ctx in migrations.values():
    for m in ctx.get('flywayBeans',{}).get('flyway',{}).get('migrations',[]):
        if m.get('state') == 'Success':
            print(f\"  ✅ {m['script']} — {m['state']}\")
" 2>/dev/null)
echo ""
echo "  Flyway migrations:"
echo "$FLYWAY"

# Endpoints sin JWT → deben devolver 401
echo ""
echo "  Seguridad (sin JWT → 401):"
JWT=""
check "GET /api/v1/dashboard/summary sin auth"  "$BASE/api/v1/dashboard/summary"  "401"
check "GET /api/v1/bills sin auth"              "$BASE/api/v1/bills"              "401"
check "GET /api/v1/transfers/own sin auth"      "$BASE/api/v1/transfers/limits"   "401"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Resultado: $OK OK | $FAIL FAIL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Para probar endpoints autenticados, usa el frontend:"
echo "  → http://localhost:4201"
echo ""
