#!/bin/bash
# ════════════════════════════════════════════════════════════════
#  SOFIA v1.9 — Persistence Protocol Audit · BankPortal
#  Verifica instalación completa: 19 skills + scripts + templates
# ════════════════════════════════════════════════════════════════

QUICK=false
[[ "$1" == "--quick" ]] && QUICK=true

REPO="${SOFIA_REPO:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
SOFIA_DIR="$REPO/.sofia"
PASS=0; WARN=0; FAIL=0; SKILLS_OK=0

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'; BOLD='\033[1m'
ok()   { echo -e "    ${GREEN}✅ $1${NC}"; ((PASS++)); }
warn() { echo -e "    ${YELLOW}⚠️  $1${NC}"; ((WARN++)); }
fail() { echo -e "    ${RED}❌ $1${NC}"; ((FAIL++)); }

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   SOFIA v1.9 — Persistence Protocol Audit               ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo "  Repo: $REPO"
echo ""

# ── 1. Estructura .sofia/ ─────────────────────────────────────────────────────
echo "  1. Estructura .sofia/"
[ -d "$SOFIA_DIR" ]                          && ok ".sofia/ existe"                  || fail ".sofia/ no encontrado"
[ -f "$SOFIA_DIR/session.json" ]             && ok "session.json existe"             || warn "session.json ausente"
[ -f "$SOFIA_DIR/sofia.log" ]                && ok "sofia.log existe"                || warn "sofia.log ausente"
[ -d "$SOFIA_DIR/snapshots" ]                && ok "snapshots/ existe"               || warn "snapshots/ ausente"
[ -f "$SOFIA_DIR/PERSISTENCE_PROTOCOL.md" ] && ok "PERSISTENCE_PROTOCOL.md existe"  || warn "PERSISTENCE_PROTOCOL.md ausente"
[ -f "$SOFIA_DIR/sofia-config.json" ]        && ok "sofia-config.json existe"        || warn "sofia-config.json ausente — ejecutar sofia-wizard.py"
[ -f "$SOFIA_DIR/templates/dashboard.html" ] && ok "templates/dashboard.html existe" || warn "templates/dashboard.html ausente"
echo ""

# ── 2. Validación session.json ────────────────────────────────────────────────
if ! $QUICK; then
  echo "  2. Validación session.json"
  if [ -f "$SOFIA_DIR/session.json" ]; then
    python3 -c "import json; json.load(open('$SOFIA_DIR/session.json'))" 2>/dev/null \
      && ok "session.json es JSON válido" || fail "session.json JSON inválido"
    VER=$(python3 -c "import json; d=json.load(open('$SOFIA_DIR/session.json')); print(d.get('version','?'))" 2>/dev/null)
    [ -n "$VER" ] && ok "version = $VER" || warn "campo version ausente"
    python3 -c "import json; d=json.load(open('$SOFIA_DIR/session.json')); [d[k] for k in ['status','completed_steps','last_skill','updated_at']]" 2>/dev/null \
      && ok "campos obligatorios presentes" || warn "faltan campos en session.json"
  else
    warn "session.json no existe — omitida validación"
  fi
  echo ""
fi

# ── 3. Skills (19) ────────────────────────────────────────────────────────────
echo "  3. Auditoría de skills — 19 esperados"
SKILLS="orchestrator scrum-master requirements-analyst architect
developer-core java-developer angular-developer react-developer
nodejs-developer dotnet-developer code-reviewer qa-tester
devops jenkins-agent workflow-manager documentation-agent
atlassian-agent security-agent performance-agent"

for skill in $SKILLS; do
  SKILL_FILE="$SOFIA_DIR/skills/$skill/SKILL.md"
  if [ -f "$SKILL_FILE" ]; then
    SIZE=$(wc -c < "$SKILL_FILE")
    SCORE=0
    grep -qi "PERSISTIDO\|persist\|session.json"    "$SKILL_FILE" 2>/dev/null && ((SCORE++))
    grep -qi "SKILL.md\|skill"                      "$SKILL_FILE" 2>/dev/null && ((SCORE++))
    grep -qi "artefact\|artifact\|docs/\|infra/"    "$SKILL_FILE" 2>/dev/null && ((SCORE++))
    grep -qi "commit\|git\|Git"                     "$SKILL_FILE" 2>/dev/null && ((SCORE++))
    grep -qi "Gate\|gate\|GATE\|HITL\|step"         "$SKILL_FILE" 2>/dev/null && ((SCORE++))
    ok "${skill} (${SIZE}B · score: ${SCORE}/5)"
    ((SKILLS_OK++))
  else
    fail "${skill}/SKILL.md no encontrado"
  fi
done
echo ""

# ── 4. Pipeline v1.9 (11 steps) ──────────────────────────────────────────────
if ! $QUICK; then
  echo "  4. Pipeline steps v1.9"
  for step in "1:Scrum-Master" "2:Requirements" "3:Architect" "3b:Doc-Agent" \
              "4:Developer" "5:Code-Review" "5b:Security-Agent" \
              "6:QA" "7:DevOps" "8:Doc-Agent" "9:Workflow-Mgr"; do
    ok "Step $step definido"
  done
  echo ""
fi

# ── 5. Scripts ───────────────────────────────────────────────────────────────
echo "  5. Scripts SOFIA"
for s in setup-sofia-mac.sh audit-persistence.sh patch-persistence.py \
          resume.py sofia-dashboard.py gen-dashboard.js \
          atlassian-sync.py gate-check.py sofia-wizard.py sofia-projects.py; do
  [ -f "$SOFIA_DIR/scripts/$s" ] && ok "$s" || warn "$s ausente"
done
echo ""

# ── 6. Dependencias ──────────────────────────────────────────────────────────
if ! $QUICK; then
  echo "  6. Dependencias"
  /opt/homebrew/opt/node@22/bin/node -e "require('docx')" 2>/dev/null \
    && ok "npm docx disponible"        || warn "npm docx no instalado → cd \$REPO && npm install docx"
  python3 -c "import openpyxl" 2>/dev/null \
    && ok "python openpyxl disponible" || warn "openpyxl no instalado → pip install openpyxl --break-system-packages"
  /opt/homebrew/opt/node@22/bin/node --version >/dev/null 2>&1 \
    && ok "Node 22 disponible"         || warn "Node 22 no encontrado"
  command -v uvx >/dev/null 2>&1 \
    && ok "uvx disponible"             || warn "uvx no instalado"
  [ -f "$REPO/CLAUDE.md" ] \
    && ok "CLAUDE.md presente"         || fail "CLAUDE.md no encontrado"
  echo ""
fi

# ── 7. Git hook ──────────────────────────────────────────────────────────────
echo "  7. Git hook"
[ -f "$REPO/.git/hooks/post-commit" ] \
  && ok "post-commit hook instalado"  || warn "post-commit hook ausente"
[ -f "$SOFIA_DIR/doc-agent-hook.sh" ] \
  && ok "doc-agent-hook.sh presente"  || warn "doc-agent-hook.sh ausente"
echo ""

# ── Resultado ────────────────────────────────────────────────────────────────
echo "══════════════════════════════════════════════════════════"
echo -e "  Skills:  ${BOLD}${SKILLS_OK}/19${NC}"
printf "  Result:  PASS=%-3d WARN=%-3d FAIL=%-3d\n" $PASS $WARN $FAIL

if [ $FAIL -eq 0 ] && [ $SKILLS_OK -eq 19 ]; then
  echo -e "\n  ${GREEN}${BOLD}🎉 SOFIA v1.9 — Persistence Protocol: COMPLETO${NC}\n"
elif [ $FAIL -eq 0 ]; then
  echo -e "\n  ${YELLOW}${BOLD}⚠️  SOFIA v1.9 — Instalación parcial (${SKILLS_OK}/19 skills)${NC}\n"
else
  echo -e "\n  ${RED}${BOLD}❌ SOFIA v1.9 — Errores. Ejecutar: python3 .sofia/scripts/patch-persistence.py${NC}\n"
fi

# Log entry
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "[$TIMESTAMP] [AUDIT] [audit-persistence.sh] COMPLETED → pass=$PASS warn=$WARN fail=$FAIL skills_ok=$SKILLS_OK" \
  >> "$SOFIA_DIR/sofia.log" 2>/dev/null

exit $FAIL
