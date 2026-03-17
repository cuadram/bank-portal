#!/bin/bash
# =============================================================================
# SOFIA v1.5 — setup-sofia-mac.sh
# Setup completo para macOS · Experis Software Factory IA
# Uso: ./setup-sofia-mac.sh [ruta_destino]
# Ejemplo: ./setup-sofia-mac.sh ~/proyectos/mi-proyecto
# Cambios v1.5: CLAUDE.md con Persistence Protocol, session.json, sofia.log
# =============================================================================

set -e

SOFIA_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="${PROJECT_NAME:-bank-portal}"
DEFAULT_REPO="$HOME/proyectos/$PROJECT_NAME"
REPO="${1:-$DEFAULT_REPO}"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   SOFIA v1.5 — Software Factory IA · Experis    ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "  Repo destino : $REPO"
echo "  SOFIA dir    : $SOFIA_DIR"
echo ""

# ── 1. Verificar prerrequisitos ───────────────────────────────────────────────
echo "▶ [1/10] Verificando prerrequisitos..."

check_cmd() {
    if command -v "$1" &>/dev/null; then
        echo "  ✅ $1 $(${1} --version 2>&1 | head -1)"
    else
        echo "  ❌ $1 no encontrado — instalar con: $2"
        MISSING=1
    fi
}

MISSING=0
check_cmd "node"    "brew install node@22"
check_cmd "npm"     "brew install node@22"
check_cmd "python3" "brew install python3"
check_cmd "git"     "brew install git"
check_cmd "uvx"     "pip3 install uvx"

if brew list jenkins-lts &>/dev/null 2>&1; then
    echo "  ✅ jenkins-lts ($(brew services list | grep jenkins | awk '{print $2}'))"
else
    echo "  ⚠️  jenkins-lts no instalado — opcional: brew install jenkins-lts"
fi

if [ "$MISSING" = "1" ]; then
    echo ""
    echo "  ❌ Prerrequisitos faltantes. Instalar antes de continuar."
    exit 1
fi

# ── 2. Node version check ────────────────────────────────────────────────────
echo ""
echo "▶ [2/10] Verificando versión de Node.js..."

NODE_VER=$(node --version | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
    echo "  ❌ Node.js >= 18 requerido (actual: v$NODE_VER)"
    echo "     brew install node@22 && export PATH=/opt/homebrew/opt/node@22/bin:\$PATH"
    exit 1
fi
echo "  ✅ Node.js v$NODE_VER >= 18"

# ── 3. Instalar dependencias: docx (npm) ─────────────────────────────────────
echo ""
echo "▶ [3/10] Instalando dependencia npm: docx..."

NODE_BIN="/opt/homebrew/opt/node@22/bin/node"
[ ! -x "$NODE_BIN" ] && NODE_BIN="$(command -v node)"

if ! "$NODE_BIN" -e "require('docx')" 2>/dev/null; then
    echo "  📦 Instalando docx (npm global)..."
    npm install -g docx --silent
    echo "  ✅ docx instalado"
else
    echo "  ✅ docx ya instalado"
fi

# ── 4. Instalar dependencias: openpyxl (Python) ──────────────────────────────
echo ""
echo "▶ [4/10] Instalando dependencia Python: openpyxl..."

VENV_GLOBAL="$HOME/.sofia-venv"

if python3 -c "import openpyxl" 2>/dev/null; then
    PY_DOCS="python3"
    echo "  ✅ openpyxl disponible en sistema"
else
    if [ ! -d "$VENV_GLOBAL" ]; then
        echo "  📦 Creando venv global SOFIA en $VENV_GLOBAL..."
        python3 -m venv "$VENV_GLOBAL"
    fi
    "$VENV_GLOBAL/bin/pip" install openpyxl -q
    PY_DOCS="$VENV_GLOBAL/bin/python3"
    echo "  ✅ openpyxl instalado en $VENV_GLOBAL"
fi

# ── 5. Pre-instalar servidor MCP filesystem ──────────────────────────────────
echo ""
echo "▶ [5/10] Pre-instalando servidor MCP filesystem..."

MCP_NODE="/opt/homebrew/opt/node@22/bin/npx"
[ ! -x "$MCP_NODE" ] && MCP_NODE="$(command -v npx)"

"$MCP_NODE" --yes @modelcontextprotocol/server-filesystem "$REPO" &>/dev/null &
MCP_PID=$!
sleep 3
kill $MCP_PID 2>/dev/null || true
echo "  ✅ MCP filesystem pre-instalado (sin timeout en Claude Desktop)"

# ── 6. Crear repo y estructura de directorios ─────────────────────────────────
echo ""
echo "▶ [6/10] Configurando repo en $REPO..."

mkdir -p "$REPO"
cd "$REPO"

if [ ! -d ".git" ]; then
    git init -b main
    echo "  ✅ Repositorio git inicializado"
else
    echo "  ✅ Repositorio git existente"
fi

for dir in \
    ".sofia/skills" ".sofia/scripts" ".sofia/hooks" \
    "apps/backend/src/main" "apps/frontend/src/app" \
    "docs/architecture/adr" "docs/architecture/lld" "docs/architecture/openapi" \
    "docs/backlog" "docs/sprints" "docs/releases" "docs/qa" \
    "docs/code-review" "docs/deliverables" \
    "infra/jenkins" "infra/k8s" \
    "reports/tests" "reports/code-review"; do
    mkdir -p "$dir"
done
echo "  ✅ Estructura de directorios creada"

# ── 7. Instalar skills ───────────────────────────────────────────────────────
echo ""
echo "▶ [7/10] Instalando skills SOFIA..."

if [ -d "$SOFIA_DIR/skills" ]; then
    cp -r "$SOFIA_DIR/skills/"* "$REPO/.sofia/skills/"
    SKILL_COUNT=$(ls "$REPO/.sofia/skills/" | wc -l | tr -d ' ')
    echo "  ✅ $SKILL_COUNT skills instalados en .sofia/skills/"
else
    echo "  ⚠️  Directorio skills no encontrado en $SOFIA_DIR"
fi

# Copiar scripts SOFIA
if [ -d "$SOFIA_DIR/scripts" ]; then
    cp "$SOFIA_DIR/scripts/"*.sh "$REPO/.sofia/scripts/" 2>/dev/null || true
    echo "  ✅ Scripts copiados a .sofia/scripts/"
fi

# ── 8. Instalar Documentation Agent hook ─────────────────────────────────────
echo ""
echo "▶ [8/10] Instalando Documentation Agent (git hook post-commit)..."

HOOK_SRC="$SOFIA_DIR/hooks"
HOOK_DST="$REPO/.git/hooks"

# Copiar doc-agent-hook.sh al repo (la lógica real)
if [ -f "$HOOK_SRC/doc-agent-hook.sh" ]; then
    cp "$HOOK_SRC/doc-agent-hook.sh" "$REPO/.sofia/doc-agent-hook.sh"
    chmod +x "$REPO/.sofia/doc-agent-hook.sh"
    echo "  ✅ doc-agent-hook.sh instalado en .sofia/"
else
    # Generar inline si no viene en el paquete SOFIA
    cat > "$REPO/.sofia/doc-agent-hook.sh" << 'DOC_HOOK_EOF'
#!/bin/bash
# SOFIA — Documentation Agent Hook v1.4
REPO="$(git rev-parse --show-toplevel 2>/dev/null)"; [ -z "$REPO" ] && exit 0
DELIVERABLES="$REPO/docs/deliverables"; [ -d "$DELIVERABLES" ] || exit 0
NODE=""; for c in "/opt/homebrew/opt/node@22/bin/node" "/opt/homebrew/opt/node@20/bin/node" "$(command -v node 2>/dev/null)"; do [ -x "$c" ] && NODE="$c" && break; done
export NODE_PATH="/opt/homebrew/lib/node_modules:/usr/local/lib/node_modules:$NODE_PATH"
PY=""; VENV="$REPO/.sofia/venv"
[ -x "$VENV/bin/python3" ] && "$VENV/bin/python3" -c "import openpyxl" 2>/dev/null && PY="$VENV/bin/python3"
[ -z "$PY" ] && [ -x "$HOME/.sofia-venv/bin/python3" ] && PY="$HOME/.sofia-venv/bin/python3"
if [ -z "$PY" ]; then
    for c in "/opt/homebrew/bin/python3" "$(command -v python3 2>/dev/null)"; do
        [ -x "$c" ] && "$c" -c "import openpyxl" 2>/dev/null && PY="$c" && break
    done
fi
if [ -z "$PY" ]; then
    SYS_PY="$(command -v python3 2>/dev/null)"
    [ -n "$SYS_PY" ] && "$SYS_PY" -m venv "$VENV" && "$VENV/bin/pip" install openpyxl -q && PY="$VENV/bin/python3"
fi
CHANGED=$(git diff-tree --no-commit-id -r --name-only HEAD 2>/dev/null)
echo "$CHANGED" | grep -qE "docs/deliverables/.*\.(js|py)$" || exit 0
echo ""; echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📑 SOFIA Documentation Agent v1.4"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "$DELIVERABLES/gen_all_word.js" ] || [ -f "$DELIVERABLES/gen_all_excel.py" ]; then
    echo "  Modo: multi-sprint"
    [ -f "$DELIVERABLES/gen_all_word.js" ] && [ -n "$NODE" ] && cd "$DELIVERABLES" && "$NODE" gen_all_word.js && cd "$REPO"
    [ -f "$DELIVERABLES/gen_all_excel.py" ] && [ -n "$PY" ] && "$PY" "$DELIVERABLES/gen_all_excel.py"
else
    SPRINT_DIR=$(find "$DELIVERABLES" -name "gen_word.js" -exec dirname {} \; 2>/dev/null | sort -r | head -1)
    [ -z "$SPRINT_DIR" ] && exit 0
    [ -f "$SPRINT_DIR/gen_word.js" ] && [ -n "$NODE" ] && "$NODE" "$SPRINT_DIR/gen_word.js"
    [ -f "$SPRINT_DIR/gen_excel.py" ] && [ -n "$PY" ] && "$PY" "$SPRINT_DIR/gen_excel.py"
fi
echo ""; echo "  ✅ SOFIA: delivery packages actualizados"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DOC_HOOK_EOF
    chmod +x "$REPO/.sofia/doc-agent-hook.sh"
    echo "  ✅ doc-agent-hook.sh generado inline"
fi

# Instalar wrapper post-commit en .git/hooks/
if [ -f "$HOOK_SRC/post-commit" ]; then
    cp "$HOOK_SRC/post-commit" "$HOOK_DST/post-commit"
else
    cat > "$HOOK_DST/post-commit" << 'POST_COMMIT_EOF'
#!/bin/bash
# SOFIA — post-commit wrapper (setup-sofia-mac.sh v1.5)
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
HOOK="$REPO_ROOT/.sofia/doc-agent-hook.sh"
[ -f "$HOOK" ] && bash "$HOOK"
POST_COMMIT_EOF
fi
chmod +x "$HOOK_DST/post-commit"
echo "  ✅ .git/hooks/post-commit instalado y activo"
echo "  📌 Genera .docx/.xlsx automáticamente al commitear docs/deliverables/*.js o *.py"

# ── 9. Generar CLAUDE.md v1.5 ────────────────────────────────────────────────
echo ""
echo "▶ [9/10] Generando CLAUDE.md (skill loader v1.5)..."

# Si viene una plantilla CLAUDE.md en el paquete SOFIA, usarla
if [ -f "$SOFIA_DIR/CLAUDE.md.template" ]; then
    sed "s|__REPO__|$REPO|g" "$SOFIA_DIR/CLAUDE.md.template" > "$REPO/CLAUDE.md"
    echo "  ✅ CLAUDE.md instalado desde template"
else
    # Generar CLAUDE.md v1.5 inline
    cat > "$REPO/CLAUDE.md" << 'CLAUDEMD'
# SOFIA — Software Factory IA | Proyecto: BankPortal
## Skill Loader v1.5 · CMMI Nivel 3 · Scrumban

## Inicialización automática — EJECUTAR SIEMPRE AL ARRANCAR

Al leer este archivo, ejecutar siempre estos pasos:

```bash
# 1. Activar permisos del git hook de documentación
chmod +x "$(git rev-parse --show-toplevel)/.git/hooks/post-commit" 2>/dev/null || true
chmod +x "$(git rev-parse --show-toplevel)/.sofia/doc-agent-hook.sh" 2>/dev/null || true

# 2. Verificar dependencias del Documentation Agent
/opt/homebrew/opt/node@22/bin/node -e "require('docx')" 2>/dev/null || \
  echo "⚠️  SOFIA: instalar docx → bash .sofia/scripts/install-deps.sh"
python3 -c "import openpyxl" 2>/dev/null || \
  echo "⚠️  SOFIA: instalar openpyxl → bash .sofia/scripts/install-deps.sh"

# 3. Verificar Jenkins
brew services list | grep jenkins-lts 2>/dev/null || \
  echo "⚠️  SOFIA: Jenkins no activo → brew services start jenkins-lts"

# 4. Verificar archivos de persistencia SOFIA
[ -f "$(git rev-parse --show-toplevel)/.sofia/session.json" ] || \
  echo "⚠️  SOFIA: session.json ausente — el Orchestrator lo creará"
[ -f "$(git rev-parse --show-toplevel)/.sofia/sofia.log" ] || \
  echo "⚠️  SOFIA: sofia.log ausente — el Orchestrator lo creará"
```

## Cómo cargar un skill

Cuando el usuario diga: **"Actúa como el [ROL]"**, debes:
1. Leer el archivo `.sofia/skills/[nombre-skill]/SKILL.md`
2. Seguir sus instrucciones al pie de la letra
3. Producir los artefactos en las carpetas definidas
4. Confirmar persistencia con bloque **"✅ PERSISTIDO"** antes de cerrar el paso
5. Hacer commit con mensaje convencional correspondiente

## Roles disponibles

| Rol solicitado | Skill | Artefactos en |
|---|---|---|
| Scrum Master | `scrum-master/SKILL.md` | `docs/sprints/` |
| Requirements Analyst | `requirements-analyst/SKILL.md` | `docs/srs/` + `docs/backlog/` |
| Architect | `architect/SKILL.md` | `docs/architecture/` |
| Developer Backend Java | `java-developer/SKILL.md` + `developer-core/SKILL.md` | `apps/backend-*/src/` |
| Developer Frontend Angular | `angular-developer/SKILL.md` + `developer-core/SKILL.md` | `apps/frontend-*/src/` |
| Code Reviewer | `code-reviewer/SKILL.md` | `docs/code-review/` |
| QA Tester | `qa-tester/SKILL.md` | `docs/qa/` |
| DevOps | `devops/SKILL.md` | `infra/` |
| Jenkins Agent | `jenkins-agent/SKILL.md` | `infra/jenkins/` · `Jenkinsfile` |
| Workflow Manager | `workflow-manager/SKILL.md` | `docs/gates/` |
| Documentation Agent | `documentation-agent/SKILL.md` | `docs/deliverables/` |
| Atlassian Agent | `atlassian-agent/SKILL.md` | Jira + Confluence |
| Orchestrator | `orchestrator/SKILL.md` | (coordina a los demás) |

## ⚠️ Persistence Protocol — OBLIGATORIO en todo el pipeline

Todo agente de SOFIA que genere artefactos DEBE:
1. Escribir los artefactos a disco antes de cerrar su paso
2. Confirmar con el bloque `✅ PERSISTIDO` listando cada archivo y su ruta
3. El Orchestrator actualiza `.sofia/session.json` y añade entrada a `.sofia/sofia.log`

**El Orchestrator NO avanza al siguiente paso sin el bloque de confirmación.**

## Documentation Agent — cómo funciona

```
1. Lee Markdown fuente del repo (Filesystem:read_multiple_files)
2. Escribe gen_word.js y gen_excel.py al repo (texto ✅)
3. Hace git commit (Git MCP)
4. El hook post-commit se dispara automáticamente:
   → node gen_word.js     → genera .docx en word/
   → python3 gen_excel.py → genera .xlsx en excel/
5. Confirma con bloque ✅ PERSISTIDO
```

## Convenciones de commit

```
feat(sm):        Scrum Master
feat(req):       Requirements Analyst
feat(arch):      Architect
feat(dev):       Developer
feat(review):    Code Reviewer
feat(qa):        QA Tester
feat(devops):    DevOps / Jenkinsfile
feat(jenkins):   Jenkins Agent
feat(wm):        Workflow Manager
docs(doc-agent): Documentation Agent
fix:             Corrección de artefacto
```

## Definition of Done (DoD) v1.1

- [ ] Código implementado y mergeado en rama feature
- [ ] Cobertura tests ≥ 80% (JaCoCo / Karma)
- [ ] Quality Gate SonarQube PASS
- [ ] Code review aprobado (Tech Lead en ítems de seguridad)
- [ ] OpenAPI actualizada si hay cambios de contrato (ACT-11)
- [ ] Criterios Gherkin verificados por QA Tester
- [ ] Tests E2E Playwright PASS en Jenkins
- [ ] Aprobado en demo por Product Owner
- [ ] Pipeline CI/CD PASS en Jenkins
- [ ] Todos los artefactos confirmados con ✅ PERSISTIDO (ACT-12)
- [ ] `.sofia/session.json` y `.sofia/sofia.log` actualizados

*CLAUDE.md v1.5 — Persistence Protocol — 2026-03-17*
CLAUDEMD
    echo "  ✅ CLAUDE.md v1.5 generado"
fi

# ── Inicializar session.json y sofia.log ──────────────────────────────────────
if [ ! -f "$REPO/.sofia/session.json" ]; then
    cat > "$REPO/.sofia/session.json" << 'SESSIONEOF'
{
  "version": "1.5",
  "status": "idle",
  "sprint": null,
  "feature": null,
  "step": null,
  "gates": [],
  "lastUpdated": null
}
SESSIONEOF
    echo "  ✅ session.json inicializado"
fi

if [ ! -f "$REPO/.sofia/sofia.log" ]; then
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] INIT — SOFIA v1.5 setup completado — repo: $REPO" \
        > "$REPO/.sofia/sofia.log"
    echo "  ✅ sofia.log inicializado"
fi

# ── 10. Configurar Claude Desktop MCP ────────────────────────────────────────
echo ""
echo "▶ [10/10] Configurando Claude Desktop MCP..."

CONFIG_DIR="$HOME/Library/Application Support/Claude"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
mkdir -p "$CONFIG_DIR"

python3 << PYEOF
import json, os

config_file = "$CONFIG_FILE"
repo        = "$REPO"

existing = {}
if os.path.exists(config_file):
    try:
        with open(config_file) as f:
            existing = json.load(f)
    except Exception:
        existing = {}

existing["mcpServers"] = {
    "filesystem": {
        "command": "/opt/homebrew/opt/node@22/bin/npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", repo]
    },
    "git": {
        "command": "uvx",
        "args": ["mcp-server-git", "--repository", repo]
    }
}

with open(config_file, "w") as f:
    json.dump(existing, f, indent=2)
print("  ✅ claude_desktop_config.json actualizado")
PYEOF

# ── Commit inicial ────────────────────────────────────────────────────────────
echo ""
echo "▶ Commit inicial de setup..."
cd "$REPO"
git add -A
git diff --staged --quiet || \
    git commit -m "feat(sofia): setup SOFIA v1.5 — Persistence Protocol + Documentation Agent" \
    2>/dev/null || true
echo "  ✅ Commit realizado"

# ── Resumen final ─────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   ✅  SOFIA v1.5 — Setup completado                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  Repo     : $REPO"
echo "  Skills   : $REPO/.sofia/skills/ (17 skills)"
echo "  Hook     : $REPO/.git/hooks/post-commit ✅ (auto-activo)"
echo "  Lógica   : $REPO/.sofia/doc-agent-hook.sh"
echo "  Session  : $REPO/.sofia/session.json ✅"
echo "  Log      : $REPO/.sofia/sofia.log ✅"
echo "  Config   : $CONFIG_DIR/claude_desktop_config.json ✅"
echo ""
echo "  ── Dependencias Documentation Agent ───────────────────"
echo "  Node : $NODE_BIN (docx ✅)"
echo "  Python : $PY_DOCS (openpyxl ✅)"
echo ""
echo "  ── Pasos siguientes ───────────────────────────────────"
echo "  1. Reiniciar Claude Desktop (Cmd+Q → reabrir)"
echo "  2. Jenkins PATH: Manage Jenkins → System → Global properties"
echo "     PATH=/opt/homebrew/opt/node@22/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
echo "     SOFIA_REPO=$REPO"
echo ""
