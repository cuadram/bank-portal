#!/bin/bash
# =============================================================================
# SOFIA v1.6.1 — patch-persistence.sh
# Añade el Persistence Protocol a los skills que lo necesitan.
# NO sobreescribe los skills — añade una sección al final de cada SKILL.md.
# Uso: bash patch-persistence.sh [repo_path]
# =============================================================================

REPO="${1:-$HOME/proyectos/bank-portal}"
SKILLS_DIR="$REPO/.sofia/skills"
LOG="$REPO/.sofia/sofia.log"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'
BOLD='\033[1m'; RESET='\033[0m'

ok()   { echo -e "  ${GREEN}✅${RESET} $1"; }
warn() { echo -e "  ${YELLOW}⚠️ ${RESET} $1"; }
fail() { echo -e "  ${RED}❌${RESET} $1"; }

int() {
  local v; v=$(echo "$1" | tr -d '[:space:][:alpha:]' | head -c 6)
  printf '%d' "${v:-0}" 2>/dev/null || echo 0
}
count_in() { local n; n=$(grep -c "$1" "$2" 2>/dev/null) || n=0; int "$n"; }

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   SOFIA v1.6.1 — Patch Persistence Protocol             ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════╝${RESET}"
echo ""

PATCHED=0; SKIPPED=0; ERRORS=0

# Lista de skills que necesitan el parche (los que el audit marcó ❌ o ⚠️)
# orchestrator y security-agent ya tienen score 5/5 — se saltan automáticamente
SKILLS=(
  "scrum-master"
  "requirements-analyst"
  "architect"
  "developer-core"
  "java-developer"
  "angular-developer"
  "react-developer"
  "nodejs-developer"
  "dotnet-developer"
  "code-reviewer"
  "qa-tester"
  "devops"
  "jenkins-agent"
  "workflow-manager"
  "documentation-agent"
  "atlassian-agent"
)

for skill in "${SKILLS[@]}"; do
  SKILL_PATH="$SKILLS_DIR/$skill/SKILL.md"

  if [ ! -f "$SKILL_PATH" ]; then
    fail "$skill → SKILL.md no encontrado, saltando"
    ERRORS=$((ERRORS+1))
    continue
  fi

  # Comprobar si ya tiene el protocolo (score >= 4)
  S=$(count_in "session\.json"         "$SKILL_PATH")
  L=$(count_in "sofia\.log"            "$SKILL_PATH")
  C=$(count_in "PERSISTENCE CONFIRMED" "$SKILL_PATH")
  N=$(count_in "snapshot"              "$SKILL_PATH")
  A=$(count_in "artifacts"             "$SKILL_PATH")
  SCORE=$(( (S>0) + (L>0) + (C>0) + (N>0) + (A>0) ))

  if [ "$SCORE" -ge 4 ]; then
    warn "$skill → ya tiene score $SCORE/5, sin cambios"
    SKIPPED=$((SKIPPED+1))
    continue
  fi

  # Hacer backup antes de parchear
  cp "$SKILL_PATH" "${SKILL_PATH}.bak"

  # Determinar el step del skill para personalizar el bloque
  case "$skill" in
    "scrum-master")         STEP="1";  STEP_NAME="scrum-master" ;;
    "requirements-analyst") STEP="2";  STEP_NAME="requirements-analyst" ;;
    "architect")            STEP="3";  STEP_NAME="architect" ;;
    "developer-core")       STEP="4";  STEP_NAME="developer-core" ;;
    "java-developer")       STEP="4";  STEP_NAME="java-developer" ;;
    "angular-developer")    STEP="4";  STEP_NAME="angular-developer" ;;
    "react-developer")      STEP="4";  STEP_NAME="react-developer" ;;
    "nodejs-developer")     STEP="4";  STEP_NAME="nodejs-developer" ;;
    "dotnet-developer")     STEP="4";  STEP_NAME="dotnet-developer" ;;
    "code-reviewer")        STEP="5";  STEP_NAME="code-reviewer" ;;
    "qa-tester")            STEP="6";  STEP_NAME="qa-tester" ;;
    "devops")               STEP="7";  STEP_NAME="devops" ;;
    "jenkins-agent")        STEP="7";  STEP_NAME="jenkins-agent" ;;
    "workflow-manager")     STEP="*";  STEP_NAME="workflow-manager" ;;
    "documentation-agent")  STEP="3b"; STEP_NAME="documentation-agent" ;;
    "atlassian-agent")      STEP="*";  STEP_NAME="atlassian-agent" ;;
    *)                      STEP="N";  STEP_NAME="$skill" ;;
  esac

  # Determinar ruta de output típica del skill
  case "$skill" in
    "scrum-master")         OUTPUT_PATH="docs/backlog/" ;;
    "requirements-analyst") OUTPUT_PATH="docs/requirements/" ;;
    "architect")            OUTPUT_PATH="docs/architecture/" ;;
    "developer-core"|"java-developer"|"angular-developer"|"react-developer"|"nodejs-developer"|"dotnet-developer")
                            OUTPUT_PATH="src/" ;;
    "code-reviewer")        OUTPUT_PATH="docs/quality/" ;;
    "qa-tester")            OUTPUT_PATH="docs/quality/" ;;
    "devops"|"jenkins-agent") OUTPUT_PATH="infra/" ;;
    "workflow-manager")     OUTPUT_PATH=".sofia/" ;;
    "documentation-agent")  OUTPUT_PATH="docs/deliverables/" ;;
    "atlassian-agent")      OUTPUT_PATH="jira/confluence" ;;
    *)                      OUTPUT_PATH="docs/" ;;
  esac

  # Añadir sección de Persistence Protocol al final del SKILL.md
  cat >> "$SKILL_PATH" << PERSISTENCE_BLOCK

---

## Persistence Protocol — Implementación obligatoria (SOFIA v1.6)

**Este skill DEBE ejecutar los siguientes pasos antes de retornar al Orchestrator.**
Ver protocolo completo en \`.sofia/PERSISTENCE_PROTOCOL.md\`.

### Al INICIAR

\`\`\`
1. Leer .sofia/session.json
2. Escribir en sofia.log:
   [TIMESTAMP] [STEP-${STEP}] [${STEP_NAME}] STARTED → descripción breve
3. Actualizar session.json: status = "in_progress", pipeline_step = "${STEP}", updated_at = now
\`\`\`

### Al COMPLETAR

\`\`\`javascript
// Ejecutar en Node.js o adaptar a Python según contexto
const fs = require('fs');
const now = new Date().toISOString();

// 1. Actualizar session.json
const session = JSON.parse(fs.readFileSync('.sofia/session.json', 'utf8'));
const step = '${STEP}';
if (!session.completed_steps.includes(step)) session.completed_steps.push(step);
session.pipeline_step     = step;
session.pipeline_step_name = '${STEP_NAME}';
session.last_skill        = '${STEP_NAME}';
session.last_skill_output_path = '${OUTPUT_PATH}';
session.updated_at        = now;
session.status            = 'completed'; // o 'gate_pending' si hay gate
if (!session.artifacts) session.artifacts = {};
session.artifacts[step]   = [ /* lista de rutas de artefactos generados */ ];
fs.writeFileSync('.sofia/session.json', JSON.stringify(session, null, 2));

// 2. Escribir en sofia.log (append-only)
const logEntry = \`[\${now}] [STEP-${STEP}] [${STEP_NAME}] COMPLETED → ${OUTPUT_PATH} | <detalles>\n\`;
fs.appendFileSync('.sofia/sofia.log', logEntry);

// 3. Crear snapshot
const snapPath = \`.sofia/snapshots/step-${STEP}-\${Date.now()}.json\`;
fs.copyFileSync('.sofia/session.json', snapPath);
\`\`\`

### Bloque de confirmación — incluir al final de la respuesta

\`\`\`
---
✅ PERSISTENCE CONFIRMED — ${STEP_NAME^^} STEP-${STEP}
- session.json: updated (step ${STEP} added to completed_steps)
- sofia.log: entry written [TIMESTAMP]
- snapshot: .sofia/snapshots/step-${STEP}-[timestamp].json
- artifacts:
  · ${OUTPUT_PATH}<artefacto-principal>
---
\`\`\`

> Si este skill **no** genera artefactos de fichero (ej: atlassian-agent opera
> sobre Jira/Confluence), adaptar el campo \`artifacts\` con las URLs o IDs
> de los recursos creados/actualizados en el sistema externo.
PERSISTENCE_BLOCK

  if [ $? -eq 0 ]; then
    NEW_SCORE=$(( $(count_in "session\.json" "$SKILL_PATH") > 0 ? 1 : 0 ))
    NEW_SCORE=$(( NEW_SCORE + ($(count_in "sofia\.log" "$SKILL_PATH") > 0 ? 1 : 0) ))
    NEW_SCORE=$(( NEW_SCORE + ($(count_in "PERSISTENCE CONFIRMED" "$SKILL_PATH") > 0 ? 1 : 0) ))
    NEW_SCORE=$(( NEW_SCORE + ($(count_in "snapshot" "$SKILL_PATH") > 0 ? 1 : 0) ))
    NEW_SCORE=$(( NEW_SCORE + ($(count_in "artifacts" "$SKILL_PATH") > 0 ? 1 : 0) ))
    ok "$skill → parcheado (score: $SCORE/5 → $NEW_SCORE/5)"
    PATCHED=$((PATCHED+1))
  else
    fail "$skill → error al escribir el parche"
    cp "${SKILL_PATH}.bak" "$SKILL_PATH"
    ERRORS=$((ERRORS+1))
  fi
done

# ── Actualizar session.json con los campos faltantes ──────────────────────────
echo ""
echo -e "${BOLD}  Actualizando session.json${RESET}"
SESSION="$REPO/.sofia/session.json"
if [ -f "$SESSION" ]; then
  python3 - "$SESSION" << 'PYEOF'
import json, sys, datetime

path = sys.argv[1]
with open(path) as f:
    d = json.load(f)

# Añadir campos faltantes sin tocar los existentes
if 'version' not in d:              d['version'] = '1.6'
if 'updated_at' not in d:          d['updated_at'] = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
if 'pipeline_step_name' not in d:  d['pipeline_step_name'] = None
if 'started_at' not in d:          d['started_at'] = None
if 'artifacts' not in d:           d['artifacts'] = {}
if 'gates' not in d:               d['gates'] = {}
if 'ncs' not in d:                 d['ncs'] = {}
if 'security' not in d:
    d['security'] = {
        'scan_status': None, 'semaphore': None,
        'cve_critical': 0, 'cve_high': 0, 'cve_medium': 0,
        'secrets_found': 0, 'report_path': None, 'gate_result': None
    }

with open(path, 'w') as f:
    json.dump(d, f, indent=2)

print('  ✅ session.json actualizado con campos v1.6')
PYEOF
else
  warn "session.json no encontrado"
fi

# ── Crear directorio snapshots si no existe ───────────────────────────────────
mkdir -p "$REPO/.sofia/snapshots"
ok "snapshots/ creado"

# ── Escribir en sofia.log ─────────────────────────────────────────────────────
if [ -f "$LOG" ]; then
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [PATCH] [patch-persistence.sh] COMPLETED → patched=$PATCHED skipped=$SKIPPED errors=$ERRORS" >> "$LOG"
fi

# ── Resumen ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${GREEN}✅ Parcheados: $PATCHED${RESET}"
echo -e "  ${YELLOW}⚠️  Saltados (ya OK): $SKIPPED${RESET}"
echo -e "  ${RED}❌ Errores: $ERRORS${RESET}"
echo ""
echo "  Backups en: ${skill}.bak (junto a cada SKILL.md)"
echo "  Para verificar: bash $REPO/.sofia/scripts/audit-persistence.sh"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
