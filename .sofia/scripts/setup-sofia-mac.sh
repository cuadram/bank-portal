#!/bin/bash
# =============================================================================
# SOFIA v1.6 — setup-sofia-mac.sh
# Instalador completo para macOS (Node 22 via Homebrew + uvx)
# Uso: bash setup-sofia-mac.sh [repo_path]
# =============================================================================

REPO="${1:-$HOME/proyectos/bank-portal}"
SOFIA_DIR="$REPO/.sofia"
NODE_BIN="/opt/homebrew/opt/node@22/bin"
NODE="$NODE_BIN/node"; NPX="$NODE_BIN/npx"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_SRC="$(cd "$SCRIPT_DIR/../skills" 2>/dev/null && pwd || echo "")"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'
BLUE='\033[0;34m';  BOLD='\033[1m';      RESET='\033[0m'

step() { echo ""; echo -e "${BOLD}▶ $1${RESET}"; }
ok()   { echo -e "  ${GREEN}✅${RESET} $1"; }
warn() { echo -e "  ${YELLOW}⚠️ ${RESET} $1"; }
fail() { echo -e "  ${RED}❌${RESET} $1"; exit 1; }

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   SOFIA v1.6 — Setup para macOS                        ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════╝${RESET}"
echo -e "  Repo: ${BLUE}$REPO${RESET}"

# ── 1. Requisitos ─────────────────────────────────────────────────────────────
step "1. Verificando requisitos"
if [ -f "$NODE" ]; then ok "Node.js: $($NODE --version)"
else warn "Node.js no en $NODE_BIN — buscando en PATH...";
  command -v node &>/dev/null && ok "node en PATH: $(node --version)" || fail "Node.js no encontrado. Instalar: brew install node@22"
fi
command -v python3 &>/dev/null && ok "Python3: $(python3 --version)" || fail "Python3 no encontrado"
command -v uvx    &>/dev/null && ok "uvx disponible" || warn "uvx no encontrado — Git MCP no disponible"
command -v git    &>/dev/null && ok "Git: $(git --version)" || fail "Git no encontrado"

# ── 2. Repositorio ────────────────────────────────────────────────────────────
step "2. Preparando repositorio"
mkdir -p "$REPO"
if [ ! -d "$REPO/.git" ]; then
  cd "$REPO" && git init -b main && ok "Git inicializado (main)"
else ok "Repo git existente"; fi

# ── 3. Estructura de directorios ──────────────────────────────────────────────
step "3. Estructura de directorios"
for d in src docs/architecture docs/requirements docs/deliverables \
          docs/security docs/quality docs/backlog \
          .sofia/snapshots .sofia/scripts .sofia/skills; do
  mkdir -p "$REPO/$d"
done
ok "Directorios creados"

# ── 4. session.json v1.6 ──────────────────────────────────────────────────────
step "4. Inicializando session.json v1.6"
if [ ! -f "$SOFIA_DIR/session.json" ]; then
  cat > "$SOFIA_DIR/session.json" << 'SESSION'
{
  "version": "1.6",
  "project": "",
  "client": "",
  "sprint": 1,
  "feature": "",
  "pipeline_type": null,
  "pipeline_step": 0,
  "pipeline_step_name": null,
  "status": "idle",
  "started_at": null,
  "updated_at": null,
  "completed_steps": [],
  "last_skill": null,
  "last_skill_output_path": null,
  "artifacts": {},
  "gates": {},
  "ncs": {},
  "security": {
    "scan_status": null, "semaphore": null,
    "cve_critical": 0, "cve_high": 0, "cve_medium": 0,
    "secrets_found": 0, "report_path": null, "gate_result": null
  }
}
SESSION
  ok "session.json v1.6 creado"
else
  # Migrar session existente a v1.6
  python3 - "$SOFIA_DIR/session.json" << 'PYEOF'
import json, sys, datetime
p = sys.argv[1]
d = json.load(open(p))
d.setdefault("version", "1.6")
d.setdefault("updated_at", datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"))
d.setdefault("pipeline_step_name", None)
d.setdefault("started_at", None)
d.setdefault("artifacts", {})
d.setdefault("gates", {})
d.setdefault("ncs", {})
d.setdefault("security", {"scan_status":None,"semaphore":None,"cve_critical":0,
    "cve_high":0,"cve_medium":0,"secrets_found":0,"report_path":None,"gate_result":None})
json.dump(d, open(p,"w"), indent=2)
PYEOF
  ok "session.json existente migrado a v1.6"
fi

# ── 5. sofia.log ──────────────────────────────────────────────────────────────
if [ ! -f "$SOFIA_DIR/sofia.log" ]; then
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [INIT] [setup-sofia-mac.sh] STARTED → SOFIA v1.6 en $REPO" > "$SOFIA_DIR/sofia.log"
  ok "sofia.log inicializado"
else
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [INIT] [setup-sofia-mac.sh] UPGRADE → SOFIA v1.6 en $REPO" >> "$SOFIA_DIR/sofia.log"
  ok "sofia.log existente — entrada de upgrade añadida"
fi

# ── 6. Instalar scripts ───────────────────────────────────────────────────────
step "5. Instalando scripts SOFIA v1.6"
for script in audit-persistence.sh patch-persistence.py resume.py; do
  SRC="$SCRIPT_DIR/$script"
  DST="$SOFIA_DIR/scripts/$script"
  if [ -f "$SRC" ]; then
    cp "$SRC" "$DST"
    chmod +x "$DST" 2>/dev/null || true
    ok "$script instalado"
  else
    warn "$script no encontrado en $SCRIPT_DIR"
  fi
done

# ── 7. Instalar PERSISTENCE_PROTOCOL.md ───────────────────────────────────────
if [ -f "$SCRIPT_DIR/../PERSISTENCE_PROTOCOL.md" ]; then
  cp "$SCRIPT_DIR/../PERSISTENCE_PROTOCOL.md" "$SOFIA_DIR/PERSISTENCE_PROTOCOL.md"
  ok "PERSISTENCE_PROTOCOL.md instalado"
elif [ -f "$SCRIPT_DIR/PERSISTENCE_PROTOCOL.md" ]; then
  cp "$SCRIPT_DIR/PERSISTENCE_PROTOCOL.md" "$SOFIA_DIR/PERSISTENCE_PROTOCOL.md"
  ok "PERSISTENCE_PROTOCOL.md instalado"
fi

# ── 8. Instalar skills ────────────────────────────────────────────────────────
step "6. Instalando skills"
INSTALLED=0
if [ -n "$SKILLS_SRC" ] && [ -d "$SKILLS_SRC" ]; then
  for skill_dir in "$SKILLS_SRC"/*/; do
    name=$(basename "$skill_dir")
    if [ -f "$skill_dir/SKILL.md" ]; then
      mkdir -p "$SOFIA_DIR/skills/$name"
      cp "$skill_dir/SKILL.md" "$SOFIA_DIR/skills/$name/SKILL.md"
      INSTALLED=$((INSTALLED+1))
    fi
  done
  ok "$INSTALLED skills instalados"
  # Parchear skills sin Persistence Protocol
  if command -v python3 &>/dev/null && [ -f "$SOFIA_DIR/scripts/patch-persistence.py" ]; then
    echo "  Verificando Persistence Protocol en skills..."
    python3 "$SOFIA_DIR/scripts/patch-persistence.py" "$REPO" 2>/dev/null | grep -E "✅|⚠️|❌" | head -20
  fi
else
  warn "Directorio skills no encontrado — instala manualmente en $SOFIA_DIR/skills/"
fi

# ── 9. Git hook ───────────────────────────────────────────────────────────────
step "7. Configurando git hooks"
HOOK="$REPO/.git/hooks/post-commit"
HOOK_SRC="$SCRIPT_DIR/../hooks/doc-agent-hook.sh"
if [ -f "$HOOK_SRC" ]; then
  cp "$HOOK_SRC" "$HOOK"; chmod +x "$HOOK"
  ok "post-commit hook instalado desde fuente canónica"
else
  cat > "$HOOK" << 'HOOKEOF'
#!/bin/bash
ROOT=$(git rev-parse --show-toplevel)
LOG="$ROOT/.sofia/sofia.log"
COMMIT=$(git log -1 --pretty=format:"%H %s" 2>/dev/null)
[ -f "$LOG" ] && echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [GIT] [post-commit] COMMIT → $COMMIT" >> "$LOG"
HOOKEOF
  chmod +x "$HOOK"
  ok "post-commit hook creado (versión mínima)"
fi

# ── 10. Dependencias npm ───────────────────────────────────────────────────────
step "8. Pre-instalando dependencias"
NODE_CMD="${NODE:-node}"
NPX_CMD="${NPX:-npx}"

"$NPX_CMD" --yes @modelcontextprotocol/server-filesystem --version &>/dev/null && \
  ok "MCP filesystem server pre-instalado" || \
  warn "MCP filesystem: ejecutar manualmente '$NPX_CMD -y @modelcontextprotocol/server-filesystem'"

cd "$REPO" && "$NODE_BIN/npm" install docx --save-dev --silent 2>/dev/null && \
  ok "npm docx instalado" || warn "docx: npm install docx"

python3 -m pip install openpyxl --quiet --break-system-packages 2>/dev/null || \
python3 -m pip install openpyxl --quiet 2>/dev/null
python3 -c "import openpyxl" 2>/dev/null && ok "openpyxl instalado" || warn "pip3 install openpyxl"

# ── 11. CLAUDE.md v1.6 ────────────────────────────────────────────────────────
step "9. Generando CLAUDE.md v1.6"
cat > "$REPO/CLAUDE.md" << CLAUDEMD
# SOFIA — Software Factory IA de Experis v1.6
# Instrucciones para Claude Desktop

## INIT — Ejecutar al abrir este proyecto

\`\`\`
1. Ejecutar: python3 .sofia/scripts/resume.py --json
   → Si has_active_pipeline=true → activar RESUME PROTOCOL
   → Si has_active_pipeline=false → pipeline libre, esperar solicitud
2. Leer .sofia/sofia-config.json (si existe) para contexto del proyecto
3. Confirmar: "SOFIA v1.6 activo — [project] Sprint [N]"
\`\`\`

## Resume Protocol

Si resume.py reporta pipeline activo:
\`\`\`
⚠️  Pipeline activo: [feature] Sprint [N] — Step [N] pendiente
¿Qué deseas hacer?
[A] Retomar desde Step [siguiente]
[B] Re-ejecutar último step
[C] Reiniciar pipeline completo
[D] Ver artefactos generados
[E] Restaurar snapshot
\`\`\`
El Orchestrator NO inicia un nuevo pipeline hasta que el usuario elija.

## Skills

Los skills de SOFIA están en \`.sofia/skills/\`.
El Orchestrator los activa según el tipo de solicitud.

## Persistence Protocol (OBLIGATORIO v1.6)

Ningún step es DONE sin:
1. Actualizar \`.sofia/session.json\` (completed_steps, artifacts, updated_at)
2. Entrada en \`.sofia/sofia.log\`
3. Snapshot en \`.sofia/snapshots/\`
4. Bloque "✅ PERSISTENCE CONFIRMED" en la respuesta

Ver: \`.sofia/PERSISTENCE_PROTOCOL.md\`

## Pipeline (9 pasos)

1→Scrum Master · 2→Requirements · 3→Architect · 3b→Docs
4→Developer · 5→Code Reviewer · **5b→Security Agent** (v1.6)
6→QA · 7→DevOps · 8→Docs finales · 9→Workflow Manager

Gates: 1, 2, 3, 5(NCs), **5b(CVEs críticos bloqueante)**, 6, 7, 8, 9

## Comandos de mantenimiento

\`\`\`bash
# Ver estado del pipeline actual
python3 .sofia/scripts/resume.py

# Auditar Persistence Protocol en todos los skills
bash .sofia/scripts/audit-persistence.sh

# Parchear skills sin Persistence Protocol
python3 .sofia/scripts/patch-persistence.py
\`\`\`

## Definition of Done — CMMI L3

- [ ] Código en rama feature/ con PR aprobado
- [ ] session.json refleja el step como completado
- [ ] sofia.log tiene entrada COMPLETED para el step
- [ ] Artefactos en sus rutas designadas
- [ ] Gate humano aprobado (si aplica)
- [ ] Security scan: semáforo VERDE o AMARILLO (nunca ROJO)
CLAUDEMD
ok "CLAUDE.md v1.6 generado"

# ── 12. MCP config ────────────────────────────────────────────────────────────
step "10. Configurando Claude Desktop MCP"
CONFIG_DIR="$HOME/Library/Application Support/Claude"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
mkdir -p "$CONFIG_DIR"

MCP_FS=$(find /opt/homebrew/lib/node_modules -name "index.js" -path "*server-filesystem*" 2>/dev/null | head -1)
if [ -n "$MCP_FS" ]; then
  FS_CMD="$NODE"; FS_ARGS="[\"$MCP_FS\", \"$REPO\"]"
else
  FS_CMD="$NPX"; FS_ARGS="[\"-y\", \"@modelcontextprotocol/server-filesystem\", \"$REPO\"]"
fi

cat > "$CONFIG_FILE" << MCP
{
  "mcpServers": {
    "filesystem": {
      "command": "$FS_CMD",
      "args": $FS_ARGS
    },
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "$REPO"]
    }
  }
}
MCP
ok "claude_desktop_config.json generado"

# ── Smoke test ────────────────────────────────────────────────────────────────
step "Smoke test"
SP=0; SF=0
s() { eval "$1" 2>/dev/null && { ok "$2"; SP=$((SP+1)); } || { warn "$3"; SF=$((SF+1)); }; }

s "[ -f '$SOFIA_DIR/session.json' ]"              "session.json OK"             "session.json falta"
s "[ -f '$SOFIA_DIR/sofia.log' ]"                 "sofia.log OK"               "sofia.log falta"
s "[ -f '$REPO/CLAUDE.md' ]"                      "CLAUDE.md OK"               "CLAUDE.md falta"
s "[ -f '$SOFIA_DIR/scripts/resume.py' ]"         "resume.py OK"               "resume.py falta"
s "[ -f '$SOFIA_DIR/scripts/audit-persistence.sh' ]" "audit-persistence.sh OK" "audit-persistence.sh falta"
s "[ -f '$SOFIA_DIR/scripts/patch-persistence.py' ]" "patch-persistence.py OK" "patch-persistence.py falta"
s "[ -f '$SOFIA_DIR/skills/security-agent/SKILL.md' ]" "Security Agent OK"    "Security Agent falta"
s "python3 -c \"import json; json.load(open('$SOFIA_DIR/session.json'))\"" "session.json JSON válido" "session.json inválido"
s "python3 '$SOFIA_DIR/scripts/resume.py' '$REPO' --json > /dev/null" "resume.py ejecuta OK" "resume.py falla"

echo ""
echo "  Smoke test: ${GREEN}$SP OK${RESET} · ${YELLOW}$SF warnings${RESET}"

# ── Resumen ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  SOFIA v1.6 instalado en: $REPO${RESET}"
echo ""
echo "  Próximos pasos:"
echo "  1. Reiniciar Claude Desktop"
echo "  2. python3 .sofia/scripts/resume.py     ← ver estado"
echo "  3. bash .sofia/scripts/audit-persistence.sh ← verificar skills"
echo "  4. Empezar: 'nueva feature FEAT-XXX — descripción'"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
