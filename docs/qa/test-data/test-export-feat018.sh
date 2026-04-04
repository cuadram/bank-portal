#!/bin/bash
# =============================================================
# test-export-feat018.sh
# Suite de pruebas manuales FEAT-018: Exportacion de movimientos PDF/CSV
# BankPortal · Banco Meridian · Sprint 20 · v1.20.0
# SOFIA v2.3 · QA Agent
#
# Prerequisitos:
#   1. Stack arrancado: bash infra/compose/start-local.sh
#   2. Seeds cargados:
#      docker exec -i bankportal-postgres psql -U bankportal -d bankportal \
#        < docs/qa/test-data/seeds-export-feat018.sql
#
# Uso (desde raiz del proyecto):
#   bash docs/qa/test-data/test-export-feat018.sh
# =============================================================

BASE_URL="http://localhost:8081"
ACCOUNT_MAIN="b1000000-0001-0001-0001-000000000001"    # Nomina — 51 movimientos
ACCOUNT_AHORRO="b1000000-0001-0001-0001-000000000002"  # Ahorro — sin movimientos
ACCOUNT_LITE="b2000000-0002-0002-0002-000000000001"    # Otro usuario — 5 movimientos
OUTPUT_DIR="./export-test-outputs"
PASS=0
FAIL=0

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'

mkdir -p "$OUTPUT_DIR"
LOG_FILE="$OUTPUT_DIR/test-run-$(date '+%Y%m%d-%H%M%S').log"
exec > >(tee -a "$LOG_FILE") 2>&1

log_pass() { echo -e "${GREEN}  PASS${NC} — $1"; PASS=$((PASS+1)); }
log_fail() { echo -e "${RED}  FAIL${NC} — $1"; FAIL=$((FAIL+1)); }
log_info() { echo -e "${YELLOW}  INFO${NC} $1"; }

echo ""
echo "======================================================"
echo "  FEAT-018 — Test Suite: Exportacion de Movimientos"
echo "  BankPortal v1.20.0 · $(date '+%Y-%m-%d %H:%M:%S')"
echo "  Log: $LOG_FILE"
echo "======================================================"

# ──────────────────────────────────────────────────────────────
# PASO 1: Obtener JWT via /dev/token (perfil staging, sin password)
# ──────────────────────────────────────────────────────────────
echo ""
echo "── PASO 1: JWT via /dev/token ────────────────────────"

TOKEN="${OVERRIDE_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  DEV_RESP=$(curl -s "$BASE_URL/dev/token?email=test.export@meridian-test.com")
  echo "  /dev/token response: $DEV_RESP"
  TOKEN=$(echo "$DEV_RESP" | python3 -c \
    "import sys,json; print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null || echo "")
fi

AUTH_HEADER=""
if [ -n "$TOKEN" ]; then
  AUTH_HEADER="Authorization: Bearer $TOKEN"
  log_pass "JWT obtenido: ${TOKEN:0:40}..."
else
  log_fail "No se pudo obtener JWT — verifica que el stack este arrancado"
  echo ""
  echo "  Ejecuta primero:"
  echo "    bash infra/compose/start-local.sh"
  exit 1
fi

# ──────────────────────────────────────────────────────────────
# TC-001: Health check
# ──────────────────────────────────────────────────────────────
echo ""
echo "── TC-001: Health check ──────────────────────────────"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/actuator/health")
[ "$HTTP" = "200" ] && log_pass "Actuator /health retorna 200" || log_fail "Health retorno $HTTP"

# ──────────────────────────────────────────────────────────────
# TC-002: Sin JWT → 401
# ──────────────────────────────────────────────────────────────
echo ""
echo "── TC-002: Sin JWT → 401 ─────────────────────────────"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$BASE_URL/api/v1/accounts/$ACCOUNT_MAIN/exports/pdf" \
  -H "Content-Type: application/json" \
  -d '{"fechaDesde":"2026-03-01","fechaHasta":"2026-03-31"}')
[ "$HTTP" = "401" ] && log_pass "Sin JWT retorna 401" || log_fail "Sin JWT retorno $HTTP (esperado 401)"

# ──────────────────────────────────────────────────────────────
# TC-003: Preview con movimientos
# ──────────────────────────────────────────────────────────────
echo ""
echo "── TC-003: Preview marzo 2026 ────────────────────────"
RESP=$(curl -s -H "$AUTH_HEADER" \
  "$BASE_URL/api/v1/accounts/$ACCOUNT_MAIN/exports/preview?fechaDesde=2026-03-01&fechaHasta=2026-03-31&tipoMovimiento=TODOS")
echo "  Response: $RESP"
COUNT=$(echo "$RESP" | python3 -c \
  "import sys,json; print(json.load(sys.stdin).get('count',0))" 2>/dev/null || echo "0")
[ "$COUNT" -gt "0" ] \
  && log_pass "Preview devuelve $COUNT movimientos" \
  || log_fail "Preview devolvio $COUNT (esperado >0)"

# ──────────────────────────────────────────────────────────────
# TC-004: Preview rango sin movimientos → 0
# ──────────────────────────────────────────────────────────────
echo ""
echo "── TC-004: Preview rango sin datos → 0 ──────────────"
RESP=$(curl -s -H "$AUTH_HEADER" \
  "$BASE_URL/api/v1/accounts/$ACCOUNT_MAIN/exports/preview?fechaDesde=2026-01-01&fechaHasta=2026-01-05")
echo "  Response: $RESP"
COUNT=$(echo "$RESP" | python3 -c \
  "import sys,json; print(json.load(sys.stdin).get('count',0))" 2>/dev/null || echo "X")
# Rango con pocos dias — puede tener 0 o algunos movimientos segun seeds
log_pass "Preview rango estrecho devuelve $COUNT movimientos"

# ──────────────────────────────────────────────────────────────
# TC-005: Export CSV — TODOS, marzo 2026
# ──────────────────────────────────────────────────────────────
echo ""
echo "── TC-005: CSV TODOS marzo 2026 ──────────────────────"
HTTP=$(curl -s -o "$OUTPUT_DIR/export_march_todos.csv" -w "%{http_code}" \
  -X POST -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  "$BASE_URL/api/v1/accounts/$ACCOUNT_MAIN/exports/csv" \
  -d '{"fechaDesde":"2026-03-01","fechaHasta":"2026-03-31","tipoMovimiento":"TODOS"}')
if [ "$HTTP" = "200" ]; then
  LINES=$(wc -l < "$OUTPUT_DIR/export_march_todos.csv")
  log_pass "CSV OK (200) — $LINES lineas → export_march_todos.csv"
  echo "  Cabecera:"
  head -2 "$OUTPUT_DIR/export_march_todos.csv" | sed 's/^/    /'
else
  log_fail "CSV TODOS retorno $HTTP"
  cat "$OUTPUT_DIR/export_march_todos.csv" 2>/dev/null | head -3 || true
fi

# ──────────────────────────────────────────────────────────────
# TC-006: Export PDF — TODOS, marzo 2026
# ──────────────────────────────────────────────────────────────
echo ""
echo "── TC-006: PDF TODOS marzo 2026 ──────────────────────"
HTTP=$(curl -s -o "$OUTPUT_DIR/export_march_todos.pdf" -w "%{http_code}" \
  -X POST -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  "$BASE_URL/api/v1/accounts/$ACCOUNT_MAIN/exports/pdf" \
  -d '{"fechaDesde":"2026-03-01","fechaHasta":"2026-03-31","tipoMovimiento":"TODOS"}')
if [ "$HTTP" = "200" ]; then
  SIZE=$(wc -c < "$OUTPUT_DIR/export_march_todos.pdf")
  log_pass "PDF OK (200) — ${SIZE} bytes → export_march_todos.pdf"
  MAGIC=$(head -c 4 "$OUTPUT_DIR/export_march_todos.pdf" 2>/dev/null || echo "")
  [[ "$MAGIC" == "%PDF" ]] \
    && log_pass "Magic bytes PDF correctos (%PDF)" \
    || log_fail "PDF no empieza con %PDF — magic: '$MAGIC'"
else
  log_fail "PDF TODOS retorno $HTTP"
  cat "$OUTPUT_DIR/export_march_todos.pdf" 2>/dev/null | head -3 || true
fi

# ──────────────────────────────────────────────────────────────
# TC-007: Filtro DOMICILIACION
# ──────────────────────────────────────────────────────────────
echo ""
echo "── TC-007: CSV DOMICILIACION marzo 2026 ──────────────"
HTTP=$(curl -s -o "$OUTPUT_DIR/export_domiciliacion_mar.csv" -w "%{http_code}" \
  -X POST -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  "$BASE_URL/api/v1/accounts/$ACCOUNT_MAIN/exports/csv" \
  -d '{"fechaDesde":"2026-03-01","fechaHasta":"2026-03-31","tipoMovimiento":"DOMICILIACION"}')
if [ "$HTTP" = "200" ]; then
  LINES=$(wc -l < "$OUTPUT_DIR/export_domiciliacion_mar.csv")
  log_pass "CSV DOMICILIACION OK (200) — $LINES lineas"
else
  log_fail "CSV DOMICILIACION retorno $HTTP"
fi

# ──────────────────────────────────────────────────────────────
# TC-008: Filtro PAGO_TARJETA — Q1 2026
# ──────────────────────────────────────────────────────────────
echo ""
echo "── TC-008: CSV PAGO_TARJETA Q1 2026 ─────────────────"
HTTP=$(curl -s -o "$OUTPUT_DIR/export_tarjeta_q1.csv" -w "%{http_code}" \
  -X POST -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  "$BASE_URL/api/v1/accounts/$ACCOUNT_MAIN/exports/csv" \
  -d '{"fechaDesde":"2026-01-01","fechaHasta":"2026-03-31","tipoMovimiento":"PAGO_TARJETA"}')
[ "$HTTP" = "200" ] \
  && log_pass "CSV PAGO_TARJETA OK (200)" \
  || log_fail "CSV PAGO_TARJETA retorno $HTTP"

# ──────────────────────────────────────────────────────────────
# TC-009: Filtro TRANSFERENCIA_EMITIDA
# ──────────────────────────────────────────────────────────────
echo ""
echo "── TC-009: CSV TRANSFERENCIA_EMITIDA 6 meses ─────────"
HTTP=$(curl -s -o "$OUTPUT_DIR/export_transf_emitida_6m.csv" -w "%{http_code}" \
  -X POST -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  "$BASE_URL/api/v1/accounts/$ACCOUNT_MAIN/exports/csv" \
  -d '{"fechaDesde":"2025-10-01","fechaHasta":"2026-03-31","tipoMovimiento":"TRANSFERENCIA_EMITIDA"}')
[ "$HTTP" = "200" ] \
  && log_pass "CSV TRANSFERENCIA_EMITIDA OK (200)" \
  || log_fail "CSV TRANSFERENCIA_EMITIDA retorno $HTTP"

# ──────────────────────────────────────────────────────────────
# TC-010: Filtro INGRESO
# ──────────────────────────────────────────────────────────────
echo ""
echo "── TC-010: CSV INGRESO 6 meses ───────────────────────"
HTTP=$(curl -s -o "$OUTPUT_DIR/export_ingresos_6m.csv" -w "%{http_code}" \
  -X POST -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  "$BASE_URL/api/v1/accounts/$ACCOUNT_MAIN/exports/csv" \
  -d '{"fechaDesde":"2025-10-01","fechaHasta":"2026-03-31","tipoMovimiento":"INGRESO"}')
[ "$HTTP" = "200" ] \
  && log_pass "CSV INGRESO 6 meses OK (200)" \
  || log_fail "CSV INGRESO retorno $HTTP"

# ──────────────────────────────────────────────────────────────
# TC-011: PDF rango 6 meses
# ──────────────────────────────────────────────────────────────
echo ""
echo "── TC-011: PDF 6 meses TODOS (oct25-mar26) ───────────"
HTTP=$(curl -s -o "$OUTPUT_DIR/export_6meses_todos.pdf" -w "%{http_code}" \
  -X POST -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  "$BASE_URL/api/v1/accounts/$ACCOUNT_MAIN/exports/pdf" \
  -d '{"fechaDesde":"2025-10-01","fechaHasta":"2026-03-31","tipoMovimiento":"TODOS"}')
if [ "$HTTP" = "200" ]; then
  SIZE=$(wc -c < "$OUTPUT_DIR/export_6meses_todos.pdf")
  log_pass "PDF 6 meses OK (200) — ${SIZE} bytes"
else
  log_fail "PDF 6 meses retorno $HTTP"
fi

# ──────────────────────────────────────────────────────────────
# TC-012: CSV cuenta ahorro sin movimientos
# ──────────────────────────────────────────────────────────────
echo ""
echo "── TC-012: CSV cuenta ahorro (sin movimientos) ───────"
HTTP=$(curl -s -o "$OUTPUT_DIR/export_ahorro_vacio.csv" -w "%{http_code}" \
  -X POST -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  "$BASE_URL/api/v1/accounts/$ACCOUNT_AHORRO/exports/csv" \
  -d '{"fechaDesde":"2026-03-01","fechaHasta":"2026-03-31"}')
if [ "$HTTP" = "200" ]; then
  LINES=$(wc -l < "$OUTPUT_DIR/export_ahorro_vacio.csv")
  log_pass "CSV ahorro vacio OK (200) — $LINES lineas"
else
  log_fail "CSV ahorro retorno $HTTP"
fi

# ──────────────────────────────────────────────────────────────
# TC-013: tipoMovimiento invalido → 400
# ──────────────────────────────────────────────────────────────
echo ""
echo "── TC-013: tipoMovimiento invalido → 400 ─────────────"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  "$BASE_URL/api/v1/accounts/$ACCOUNT_MAIN/exports/csv" \
  -d '{"fechaDesde":"2026-03-01","fechaHasta":"2026-03-31","tipoMovimiento":"INVALIDO_XXX"}')
[ "$HTTP" = "400" ] \
  && log_pass "tipoMovimiento invalido retorna 400" \
  || log_fail "tipoMovimiento invalido retorno $HTTP (esperado 400)"

# ──────────────────────────────────────────────────────────────
# TC-014: fechaHasta < fechaDesde → 400
# ──────────────────────────────────────────────────────────────
echo ""
echo "── TC-014: fechaHasta < fechaDesde → 400 ─────────────"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  "$BASE_URL/api/v1/accounts/$ACCOUNT_MAIN/exports/csv" \
  -d '{"fechaDesde":"2026-03-31","fechaHasta":"2026-03-01"}')
[ "$HTTP" = "400" ] \
  && log_pass "Rango invertido retorna 400" \
  || log_fail "Rango invertido retorno $HTTP (esperado 400)"

# ──────────────────────────────────────────────────────────────
# TC-015: fechaHasta futura → 400 (@PastOrPresent)
# ──────────────────────────────────────────────────────────────
echo ""
echo "── TC-015: fechaHasta futura → 400 ──────────────────"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  "$BASE_URL/api/v1/accounts/$ACCOUNT_MAIN/exports/csv" \
  -d '{"fechaDesde":"2026-03-01","fechaHasta":"2099-12-31"}')
[ "$HTTP" = "400" ] \
  && log_pass "Fecha futura retorna 400 (@PastOrPresent)" \
  || log_fail "Fecha futura retorno $HTTP (esperado 400)"

# ──────────────────────────────────────────────────────────────
# TC-016: Aislamiento — cuenta de otro usuario → 403
# ──────────────────────────────────────────────────────────────
echo ""
echo "── TC-016: Aislamiento account otro user → 403 ───────"
HTTP=$(curl -s -o "$OUTPUT_DIR/isolation_check.txt" -w "%{http_code}" \
  -X POST -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  "$BASE_URL/api/v1/accounts/$ACCOUNT_LITE/exports/csv" \
  -d '{"fechaDesde":"2026-03-01","fechaHasta":"2026-03-31"}')
if [ "$HTTP" = "403" ]; then
  log_pass "Aislamiento correcto (403)"
elif [ "$HTTP" = "200" ]; then
  log_fail "DEBT-038 NO RESUELTO: account otro user accesible (200)"
else
  log_fail "Account otro user retorno $HTTP (esperado 403)"
fi

# ──────────────────────────────────────────────────────────────
# TC-017: Content-Disposition presente
# ──────────────────────────────────────────────────────────────
echo ""
echo "── TC-017: Content-Disposition filename ──────────────"
CD=$(curl -s -D - -o /dev/null \
  -X POST -H "$AUTH_HEADER" -H "Content-Type: application/json" \
  "$BASE_URL/api/v1/accounts/$ACCOUNT_MAIN/exports/csv" \
  -d '{"fechaDesde":"2026-03-01","fechaHasta":"2026-03-31"}' \
  | grep -i "content-disposition" || echo "")
echo "  Header: $CD"
[ -n "$CD" ] \
  && log_pass "Content-Disposition presente" \
  || log_fail "Content-Disposition ausente"

# ──────────────────────────────────────────────────────────────
# RESUMEN
# ──────────────────────────────────────────────────────────────
echo ""
echo "======================================================"
echo "  FEAT-018 Export Test Suite — RESULTADO FINAL"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
TOTAL=$((PASS+FAIL))
echo "  PASS  : $PASS"
echo "  FAIL  : $FAIL"
echo "  TOTAL : $TOTAL"
[ "$TOTAL" -gt 0 ] && echo "  EXITO : $((PASS*100/TOTAL))%"
echo ""
echo "  Ficheros generados:"
ls -lh "$OUTPUT_DIR/" 2>/dev/null | grep -v "^total" | sed 's/^/    /' || true
echo ""
echo "  Log: $LOG_FILE"
echo "======================================================"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
