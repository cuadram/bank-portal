#!/bin/bash
# =============================================================================
# SOFIA v1.6.1 — audit-persistence.sh (fix: integer expression bug)
# Audita que todos los skills implementan el Persistence Protocol
# Uso: bash audit-persistence.sh [repo_path]
# =============================================================================

REPO="${1:-$HOME/proyectos/bank-portal}"
SKILLS_DIR="$REPO/.sofia/skills"
LOG="$REPO/.sofia/sofia.log"
SESSION="$REPO/.sofia/session.json"
PROTOCOL="$REPO/.sofia/PERSISTENCE_PROTOCOL.md"
PASS=0; WARN=0; FAIL=0; REPORT=""

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'
BLUE='\033[0;34m'; BOLD='\033[1m'; RESET='\033[0m'

# Fuerza entero puro — fix al bug de grep -c con saltos de línea
# Compatible bash macOS (no usa ${//} que falla en algunos contextos)
int() {
  local v; v=$(echo "$1" | tr -d '[:space:][:alpha:]' | head -c 6)
  printf '%d' "${v:-0}" 2>/dev/null || echo 0
}

# Cuenta ocurrencias de un patrón en un fichero de forma segura
count_in() {
  local pattern="$1" file="$2"
  local n; n=$(grep -c "$pattern" "$file" 2>/dev/null) || n=0
  int "$n"
}

check() {
  local cond="$1" pass_msg="$2" fail_msg="$3" level="${4:-FAIL}"
  if eval "$cond" 2>/dev/null; then
    echo -e "    ${GREEN}✅${RESET} $pass_msg"; PASS=$((PASS+1)); return 0
  else
    if [ "$level" = "WARN" ]; then
      echo -e "    ${YELLOW}⚠️ ${RESET} $fail_msg"; WARN=$((WARN+1))
    else
      echo -e "    ${RED}❌${RESET} $fail_msg"; FAIL=$((FAIL+1))
      REPORT="${REPORT}\n  ❌ $fail_msg"
    fi
    return 1
  fi
}

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   SOFIA v1.8 — Persistence Protocol Audit             ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════╝${RESET}"
echo -e "  Repo: ${BLUE}$REPO${RESET}\n"

# ── 1. Estructura .sofia/ ─────────────────────────────────────────────────────
echo -e "${BOLD}  1. Estructura .sofia/${RESET}"
check "[ -d '$REPO/.sofia' ]"          ".sofia/ existe"                 ".sofia/ NO existe en $REPO"
check "[ -f '$SESSION' ]"              "session.json existe"            "session.json NO existe"
check "[ -f '$LOG' ]"                  "sofia.log existe"               "sofia.log NO existe"
check "[ -d '$REPO/.sofia/snapshots' ]" "snapshots/ existe"            "snapshots/ NO existe" WARN
check "[ -f '$PROTOCOL' ]"             "PERSISTENCE_PROTOCOL.md existe" "PERSISTENCE_PROTOCOL.md NO existe" WARN
echo ""

# ── 2. Validar session.json ───────────────────────────────────────────────────
echo -e "${BOLD}  2. Validación session.json${RESET}"
if [ -f "$SESSION" ]; then
  check "python3 -c \"import json; json.load(open('$SESSION'))\" 2>/dev/null" \
    "session.json es JSON válido" "session.json tiene JSON malformado"

  VERSION=$(python3 -c "import json; d=json.load(open('$SESSION')); print(d.get('version','missing'))" 2>/dev/null)
  check "[ '$VERSION' = '1.6' ]" "version = 1.6" "version=$VERSION (esperado 1.6)" WARN

  for field in status completed_steps last_skill updated_at; do
    HAS=$(python3 -c "import json; d=json.load(open('$SESSION')); print('ok' if '$field' in d else 'missing')" 2>/dev/null)
    check "[ '$HAS' = 'ok' ]" "campo '$field' presente" "campo '$field' AUSENTE en session.json"
  done

  HAS_SEC=$(python3 -c "import json; d=json.load(open('$SESSION')); print('ok' if 'security' in d else 'missing')" 2>/dev/null)
  check "[ '$HAS_SEC' = 'ok' ]" "campo 'security' presente" "campo 'security' AUSENTE — Security Agent no integrado" WARN
else
  echo -e "    ${RED}❌${RESET} session.json no existe — saltando validaciones"
  FAIL=$((FAIL+1))
fi
echo ""

# ── 3. Auditoría de SKILL.md files ───────────────────────────────────────────
echo -e "${BOLD}  3. Auditoría de skills — Persistence Protocol${RESET}"

SKILLS=(
  "orchestrator" "scrum-master" "requirements-analyst" "architect"
  "developer-core" "java-developer" "angular-developer" "react-developer"
  "nodejs-developer" "dotnet-developer" "code-reviewer" "qa-tester"
  "devops" "jenkins-agent" "workflow-manager" "documentation-agent"
  "atlassian-agent" "security-agent" "performance-agent"
)

SKILLS_OK=0; SKILLS_WARN=0; SKILLS_FAIL=0

for skill in "${SKILLS[@]}"; do
  SKILL_PATH="$SKILLS_DIR/$skill/SKILL.md"

  if [ ! -f "$SKILL_PATH" ]; then
    echo -e "    ${RED}❌${RESET} $skill → SKILL.md NO existe"
    FAIL=$((FAIL+1)); SKILLS_FAIL=$((SKILLS_FAIL+1))
    REPORT="${REPORT}\n  ❌ $skill: SKILL.md no encontrado"
    continue
  fi

  # Contar referencias a cada pieza del protocolo (función int() garantiza entero puro)
  S=$(count_in "session\.json"         "$SKILL_PATH")
  L=$(count_in "sofia\.log"            "$SKILL_PATH")
  C=$(count_in "PERSISTENCE CONFIRMED" "$SKILL_PATH")
  N=$(count_in "snapshot"              "$SKILL_PATH")
  A=$(count_in "artifacts"             "$SKILL_PATH")

  SCORE=$(( (S>0) + (L>0) + (C>0) + (N>0) + (A>0) ))
  WSIZE=$(wc -c < "$SKILL_PATH" | tr -d ' ')

  if [ "$SCORE" -ge 4 ]; then
    echo -e "    ${GREEN}✅${RESET} $skill (${WSIZE}B · score: $SCORE/5)"
    SKILLS_OK=$((SKILLS_OK+1)); PASS=$((PASS+1))
  elif [ "$SCORE" -ge 2 ]; then
    MISSING=""
    [ "$S" -eq 0 ] && MISSING="$MISSING session.json"
    [ "$L" -eq 0 ] && MISSING="$MISSING sofia.log"
    [ "$C" -eq 0 ] && MISSING="$MISSING PERSISTENCE_CONFIRMED"
    [ "$N" -eq 0 ] && MISSING="$MISSING snapshot"
    echo -e "    ${YELLOW}⚠️ ${RESET} $skill (score: $SCORE/5) — falta:$MISSING"
    SKILLS_WARN=$((SKILLS_WARN+1)); WARN=$((WARN+1))
    REPORT="${REPORT}\n  ⚠️  $skill: incompleto (score $SCORE/5)"
  else
    echo -e "    ${RED}❌${RESET} $skill (score: $SCORE/5) — sin Persistence Protocol"
    SKILLS_FAIL=$((SKILLS_FAIL+1)); FAIL=$((FAIL+1))
    REPORT="${REPORT}\n  ❌ $skill: ausente (score $SCORE/5)"
  fi
done
echo ""

# ── 4. Validar sofia.log ──────────────────────────────────────────────────────
echo -e "${BOLD}  4. Validación sofia.log${RESET}"
if [ -f "$LOG" ]; then
  ENTRIES=$(wc -l < "$LOG" | tr -d ' ')
  check "[ '$ENTRIES' -gt 0 ]" "sofia.log tiene $ENTRIES entradas" "sofia.log está vacío" WARN
  BAD=$(grep -cv '^\[20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]T' "$LOG" 2>/dev/null || echo 0)
  BAD=$(int "$BAD")
  check "[ '$BAD' -eq 0 ]" "Formato ISO8601 correcto en todas las entradas" "$BAD entradas con formato incorrecto" WARN
  echo -e "    ${BLUE}ℹ${RESET}  Última entrada: $(tail -1 "$LOG")"
else
  echo -e "    ${YELLOW}⚠️ ${RESET} sofia.log no existe"; WARN=$((WARN+1))
fi
echo ""

# ── 5. Dependencias ───────────────────────────────────────────────────────────
echo -e "${BOLD}  5. Dependencias del sistema${RESET}"
check "[ -f '/opt/homebrew/opt/node@22/bin/node' ] || command -v node &>/dev/null" \
  "Node.js disponible" "Node.js NO encontrado"
check "command -v python3 &>/dev/null" "Python3 disponible" "Python3 NO encontrado"
check "command -v uvx &>/dev/null"     "uvx disponible"     "uvx NO encontrado" WARN

DOCX_OK=$(node -e "require('docx')" 2>/dev/null && echo ok || echo missing)
check "[ '$DOCX_OK' = 'ok' ]" "npm docx instalado" "npm docx no instalado — ejecutar: npm install docx" WARN

OPENPYXL_OK=$(python3 -c "import openpyxl" 2>/dev/null && echo ok || echo missing)
check "[ '$OPENPYXL_OK' = 'ok' ]" "openpyxl instalado" "openpyxl no instalado — ejecutar: pip3 install openpyxl" WARN
echo ""

# ── Resumen ───────────────────────────────────────────────────────────────────
TOTAL=$((PASS+WARN+FAIL))
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  Resultado${RESET}"
echo -e "  ${GREEN}✅ Passed:   $PASS${RESET}"
echo -e "  ${YELLOW}⚠️  Warnings: $WARN${RESET}"
echo -e "  ${RED}❌ Failures: $FAIL${RESET}  (total: $TOTAL)"
echo -e "  Skills: ${GREEN}$SKILLS_OK OK${RESET} · ${YELLOW}$SKILLS_WARN WARN${RESET} · ${RED}$SKILLS_FAIL FAIL${RESET}"
echo ""

if   [ "$FAIL" -eq 0 ] && [ "$WARN" -eq 0 ]; then
  echo -e "  ${GREEN}${BOLD}🎉 SOFIA v1.8 — Persistence Protocol: COMPLETO${RESET}"
  EXIT_CODE=0
elif [ "$FAIL" -eq 0 ]; then
  echo -e "  ${YELLOW}${BOLD}⚠️  SOFIA v1.8 — Persistence Protocol: FUNCIONAL (con advertencias)${RESET}"
  EXIT_CODE=1
else
  echo -e "  ${RED}${BOLD}❌ SOFIA v1.8 — Persistence Protocol: REQUIERE ATENCIÓN${RESET}"
  echo -e "\n${BOLD}  Items a corregir:${RESET}"
  echo -e "$REPORT"
  EXIT_CODE=2
fi

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

[ -f "$LOG" ] && echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [AUDIT] [audit-persistence.sh] COMPLETED → pass=$PASS warn=$WARN fail=$FAIL skills_ok=$SKILLS_OK" >> "$LOG"

exit $EXIT_CODE
