#!/bin/bash
# =============================================================================
# SOFIA v1.4 — setup-sofia-mac.sh
# Setup completo para macOS · Experis Software Factory IA
# Uso: ./setup-sofia-mac.sh [ruta_destino]
# Ejemplo: ./setup-sofia-mac.sh ~/proyectos/mi-proyecto
# =============================================================================

set -e

SOFIA_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="${PROJECT_NAME:-bank-portal}"
DEFAULT_REPO="$HOME/proyectos/$PROJECT_NAME"
REPO="${1:-$DEFAULT_REPO}"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   SOFIA v1.4 — Software Factory IA · Experis    ║"
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
    echo "  ✅ docx ya instalado ($(npm list -g docx 2>/dev/null | grep docx | head -1 | tr -d ' '))"
fi

# ── 4. Instalar dependencias: openpyxl (Python) ──────────────────────────────
echo ""
echo "▶ [4/10] Instalando dependencia Python: openpyxl..."

VENV_GLOBAL="$HOME/.sofia-venv"

# Intentar sistema primero
if python3 -c "import openpyxl" 2>/dev/null; then
    PY_DOCS="python3"
    echo "  ✅ openpyxl disponible en sistema ($(python3 -c 'import openpyxl; print(openpyxl.__version__)'))"
else
    # Crear venv global si no existe
    if [ ! -d "$VENV_GLOBAL" ]; then
        echo "  📦 Creando venv global SOFIA en $VENV_GLOBAL..."
        python3 -m venv "$VENV_GLOBAL"
    fi
    "$VENV_GLOBAL/bin/pip" install openpyxl -q
    PY_DOCS="$VENV_GLOBAL/bin/python3"
    echo "  ✅ openpyxl instalado en $VENV_GLOBAL"
    echo "     gen_excel.py usará: $PY_DOCS"
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

NODE=""; for c in "/opt/homebrew/opt/node@22/bin/node" "/opt/homebrew/opt/node@20/bin/node" "/usr/local/bin/node" "$(command -v node 2>/dev/null)"; do [ -x "$c" ] && NODE="$c" && break; done
export NODE_PATH="/opt/homebrew/lib/node_modules:/usr/local/lib/node_modules:$NODE_PATH"

PY=""
VENV_DIR="$REPO/.sofia/venv"
[ -x "$VENV_DIR/bin/python3" ] && "$VENV_DIR/bin/python3" -c "import openpyxl" 2>/dev/null && PY="$VENV_DIR/bin/python3"
[ -z "$PY" ] && [ -x "$HOME/.sofia-venv/bin/python3" ] && "$HOME/.sofia-venv/bin/python3" -c "import openpyxl" 2>/dev/null && PY="$HOME/.sofia-venv/bin/python3"
if [ -z "$PY" ]; then
    for c in "/opt/homebrew/bin/python3" "/usr/local/bin/python3" "$(command -v python3 2>/dev/null)"; do
        [ -x "$c" ] && "$c" -c "import openpyxl" 2>/dev/null && PY="$c" && break
    done
fi
if [ -z "$PY" ]; then
    SYS_PY=""; for c in "/opt/homebrew/bin/python3" "/usr/local/bin/python3" "$(command -v python3 2>/dev/null)"; do [ -x "$c" ] && SYS_PY="$c" && break; done
    if [ -n "$SYS_PY" ]; then "$SYS_PY" -m venv "$VENV_DIR"; "$VENV_DIR/bin/pip" install openpyxl -q; PY="$VENV_DIR/bin/python3"; fi
fi

CHANGED=$(git diff-tree --no-commit-id -r --name-only HEAD 2>/dev/null)
echo "$CHANGED" | grep -qE "docs/deliverables/.*\.(js|py)$" || exit 0

echo ""; echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📑 SOFIA Documentation Agent v1.4"; echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "$DELIVERABLES/gen_all_word.js" ] || [ -f "$DELIVERABLES/gen_all_excel.py" ]; then
    echo "  Modo: multi-sprint"
    [ -f "$DELIVERABLES/gen_all_word.js" ] && [ -n "$NODE" ] && echo "" && echo "  📄 Word docs..." && cd "$DELIVERABLES" && "$NODE" gen_all_word.js && cd "$REPO"
    [ -f "$DELIVERABLES/gen_all_excel.py" ] && [ -n "$PY" ] && echo "" && echo "  📊 Excel docs..." && "$PY" "$DELIVERABLES/gen_all_excel.py"
else
    SPRINT_DIR=$(find "$DELIVERABLES" -name "gen_word.js" -exec dirname {} \; 2>/dev/null | sort -r | head -1)
    [ -z "$SPRINT_DIR" ] && SPRINT_DIR=$(find "$DELIVERABLES" -name "gen_excel.py" -exec dirname {} \; 2>/dev/null | sort -r | head -1)
    [ -z "$SPRINT_DIR" ] && exit 0
    echo "  Modo: sprint individual → $(basename $SPRINT_DIR)"
    [ -f "$SPRINT_DIR/gen_word.js" ] && [ -n "$NODE" ] && echo "" && echo "  📄 Word docs..." && "$NODE" "$SPRINT_DIR/gen_word.js"
    [ -f "$SPRINT_DIR/gen_excel.py" ] && [ -n "$PY" ] && echo "" && echo "  📊 Excel docs..." && "$PY" "$SPRINT_DIR/gen_excel.py"
fi
echo ""; echo "  ✅ SOFIA: delivery packages actualizados"; echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DOC_HOOK_EOF
    chmod +x "$REPO/.sofia/doc-agent-hook.sh"
    echo "  ✅ doc-agent-hook.sh generado inline"
fi

# Instalar el wrapper post-commit en .git/hooks/
if [ -f "$HOOK_SRC/post-commit" ]; then
    cp "$HOOK_SRC/post-commit" "$HOOK_DST/post-commit"
else
    cat > "$HOOK_DST/post-commit" << 'POST_COMMIT_EOF'
#!/bin/bash
# SOFIA — post-commit wrapper (generado por setup-sofia-mac.sh v1.4)
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
HOOK="$REPO_ROOT/.sofia/doc-agent-hook.sh"
[ -f "$HOOK" ] && bash "$HOOK"
POST_COMMIT_EOF
fi
chmod +x "$HOOK_DST/post-commit"
echo "  ✅ .git/hooks/post-commit instalado"
echo "  📌 El hook se activa automáticamente en cada 'git commit'"
echo "     Solo genera docs cuando el commit toca docs/deliverables/*.js o *.py"

# ── 9. Generar CLAUDE.md ─────────────────────────────────────────────────────
echo ""
echo "▶ [9/10] Generando CLAUDE.md (skill loader v1.4)..."

cat > "$REPO/CLAUDE.md" << 'CLAUDEMD'
# SOFIA — Software Factory IA · Experis
## Skill Loader v1.4

### Orquestador (leer SIEMPRE al iniciar)
Lee: .sofia/skills/orchestrator/SKILL.md

### Agentes disponibles
- Scrum Master:          .sofia/skills/scrum-master/SKILL.md
- Requirements Analyst:  .sofia/skills/requirements-analyst/SKILL.md
- Architect:             .sofia/skills/architect/SKILL.md
- Developer Core:        .sofia/skills/developer-core/SKILL.md
- Java Developer:        .sofia/skills/java-developer/SKILL.md
- .Net Developer:        .sofia/skills/dotnet-developer/SKILL.md
- Node.js Developer:     .sofia/skills/nodejs-developer/SKILL.md
- Angular Developer:     .sofia/skills/angular-developer/SKILL.md
- React Developer:       .sofia/skills/react-developer/SKILL.md
- Code Reviewer:         .sofia/skills/code-reviewer/SKILL.md
- QA Tester:             .sofia/skills/qa-tester/SKILL.md
- DevOps:                .sofia/skills/devops/SKILL.md
- Jenkins Agent:         .sofia/skills/jenkins-agent/SKILL.md
- Workflow Manager:      .sofia/skills/workflow-manager/SKILL.md
- Documentation Agent:   .sofia/skills/documentation-agent/SKILL.md
- Atlassian Agent:       .sofia/skills/atlassian-agent/SKILL.md

### Documentation Agent (automático via git hook)
El Documentation Agent genera .docx y .xlsx automáticamente en cada commit
que toca docs/deliverables/*.js o *.py — no requiere intervención manual.
Hook instalado en: .git/hooks/post-commit → .sofia/doc-agent-hook.sh
CLAUDEMD
echo "  ✅ CLAUDE.md generado"

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
print("  ✅ claude_desktop_config.json actualizado (preferencias preservadas)")
PYEOF

# ── Commit inicial ────────────────────────────────────────────────────────────
echo ""
echo "▶ Commit inicial de setup..."
cd "$REPO"
git add -A
git diff --staged --quiet || \
    git commit -m "feat(sofia): setup SOFIA v1.4 — Documentation Agent hook integrado" \
    2>/dev/null || true
echo "  ✅ Commit realizado"

# ── Resumen final ─────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   ✅  SOFIA v1.4 — Setup completado                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  Repo     : $REPO"
echo "  Skills   : $REPO/.sofia/skills/"
echo "  Hook     : $REPO/.git/hooks/post-commit ✅ (auto-activo)"
echo "  Lógica   : $REPO/.sofia/doc-agent-hook.sh"
echo "  Config   : $CONFIG_DIR/claude_desktop_config.json ✅"
echo ""
echo "  ── Documentation Agent ────────────────────────────────"
echo "  Genera .docx/.xlsx automáticamente en cada git commit"
echo "  que toque docs/deliverables/*.js o *.py"
echo "  Node    : $([ -n '$NODE_BIN' ] && echo $NODE_BIN || echo 'auto-detectado')"
echo "  Python  : $PY_DOCS"
echo ""
echo "  ── Pasos siguientes ───────────────────────────────────"
echo "  1. Reiniciar Claude Desktop (Cmd+Q → reabrir)"
echo "  2. Jenkins PATH: Manage Jenkins → System → Global properties"
echo "     PATH = /opt/homebrew/opt/node@22/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
echo "     SOFIA_REPO = $REPO"
echo ""
