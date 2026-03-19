#!/bin/bash
# =============================================================================
# SOFIA v1.3 — fix-mcp-error.sh
# Diagnóstico y reparación automática de errores MCP en Claude Desktop
# Uso: chmod +x fix-mcp-error.sh && ./fix-mcp-error.sh
# =============================================================================

set -e

REPO="${SOFIA_REPO:-$HOME/proyectos/bank-portal}"
CONFIG_DIR="$HOME/Library/Application Support/Claude"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"
NODE_BIN="/opt/homebrew/opt/node@22/bin"
NPX="$NODE_BIN/npx"
NODE="$NODE_BIN/node"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   SOFIA v1.3 — Diagnóstico MCP                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

ERRORS=0

# ── 1. Node.js ────────────────────────────────────────────────────────────────
echo "▶ Node.js"
if [ -f "$NODE" ]; then
  echo "  ✅ $NODE — $($NODE --version)"
else
  echo "  ❌ Node.js no encontrado en $NODE_BIN"
  echo "     Fix: brew install node@22"
  ERRORS=$((ERRORS + 1))
fi

# ── 2. npx ────────────────────────────────────────────────────────────────────
echo "▶ npx"
if [ -f "$NPX" ]; then
  echo "  ✅ $NPX"
else
  echo "  ❌ npx no encontrado"
  echo "     Fix: brew install node@22"
  ERRORS=$((ERRORS + 1))
fi

# ── 3. uvx ────────────────────────────────────────────────────────────────────
echo "▶ uvx (Git MCP server)"
if command -v uvx &>/dev/null; then
  echo "  ✅ uvx — $(uvx --version 2>&1 | head -1)"
else
  echo "  ❌ uvx no encontrado"
  echo "     Fix: pip3 install uvx"
  ERRORS=$((ERRORS + 1))
fi

# ── 4. Repo ───────────────────────────────────────────────────────────────────
echo "▶ Repo SOFIA ($REPO)"
if [ -d "$REPO" ]; then
  echo "  ✅ Directorio existe"
  if [ -d "$REPO/.git" ]; then
    echo "  ✅ Repo git inicializado"
  else
    echo "  ❌ No es un repo git"
    echo "     Fix: cd $REPO && git init -b main"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "  ❌ Directorio no existe: $REPO"
  echo "     Fix: mkdir -p $REPO && cd $REPO && git init -b main"
  ERRORS=$((ERRORS + 1))
fi

# ── 5. Skills instalados ──────────────────────────────────────────────────────
echo "▶ Skills SOFIA"
SKILLS_DIR="$REPO/.sofia/skills"
if [ -d "$SKILLS_DIR" ]; then
  SKILL_COUNT=$(ls "$SKILLS_DIR" | wc -l | tr -d ' ')
  echo "  ✅ $SKILL_COUNT skills en $SKILLS_DIR"
  for skill in orchestrator atlassian-agent jenkins-agent documentation-agent; do
    if [ -f "$SKILLS_DIR/$skill/SKILL.md" ]; then
      echo "  ✅ $skill/SKILL.md"
    else
      echo "  ❌ $skill/SKILL.md no encontrado"
      ERRORS=$((ERRORS + 1))
    fi
  done
else
  echo "  ❌ .sofia/skills no encontrado"
  ERRORS=$((ERRORS + 1))
fi

# ── 6. Claude Desktop config — MCP servers ───────────────────────────────────
echo "▶ Claude Desktop config MCP"
mkdir -p "$CONFIG_DIR"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "  ❌ claude_desktop_config.json no encontrado — creando..."
  WRITE_CONFIG=1
elif python3 -c "
import json, sys
data = json.load(open('$CONFIG_FILE'))
sys.exit(0 if 'mcpServers' in data else 1)
" 2>/dev/null; then
  echo "  ✅ mcpServers ya configurado en claude_desktop_config.json"
  WRITE_CONFIG=0
else
  echo "  ⚠️  mcpServers NO encontrado en claude_desktop_config.json"
  echo "  Fix aplicado: añadiendo mcpServers preservando preferencias existentes..."
  WRITE_CONFIG=1
fi

if [ "$WRITE_CONFIG" = "1" ]; then
  # Preservar preferencias existentes si las hay, y añadir mcpServers
  python3 << PYEOF
import json, os

config_file = "$CONFIG_FILE"
repo        = "$REPO"

# Leer config existente si la hay
existing = {}
if os.path.exists(config_file):
    try:
        with open(config_file) as f:
            existing = json.load(f)
    except Exception:
        existing = {}

# Añadir/actualizar mcpServers sin tocar las preferencias existentes
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

print("  ✅ mcpServers añadido — preferencias existentes preservadas")
PYEOF
  echo "  ✅ claude_desktop_config.json actualizado"
  echo "  ⚠️  ACCIÓN REQUERIDA: Reiniciar Claude Desktop para cargar los MCPs"
  echo "      Cmd+Q → volver a abrir Claude Desktop"
fi

# ── 7. Git hook ───────────────────────────────────────────────────────────────
echo "▶ Git hook (Documentation Agent)"
HOOK="$REPO/.git/hooks/post-commit"
if [ -f "$HOOK" ]; then
  if [ -x "$HOOK" ]; then
    echo "  ✅ $HOOK (ejecutable)"
  else
    echo "  ⚠️  Hook no ejecutable — corrigiendo permisos..."
    chmod +x "$HOOK"
    echo "  ✅ Permisos corregidos"
  fi
else
  echo "  ❌ Hook no instalado — creando..."
  cat > "$HOOK" << 'HOOK_CONTENT'
#!/bin/bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -f "$REPO_ROOT/.sofia/doc-agent-hook.sh" ]; then
  bash "$REPO_ROOT/.sofia/doc-agent-hook.sh"
fi
HOOK_CONTENT
  chmod +x "$HOOK"
  echo "  ✅ Hook creado y activado"
fi

# ── 8. Pre-instalar MCP filesystem ───────────────────────────────────────────
echo "▶ Pre-instalar servidor MCP filesystem"
MCP_CACHE=$(find "$HOME/.npm/_npx" -name "server-filesystem" 2>/dev/null | head -1)
if [ -n "$MCP_CACHE" ]; then
  echo "  ✅ Caché MCP filesystem existe"
else
  echo "  📦 Pre-instalando @modelcontextprotocol/server-filesystem..."
  "$NPX" --yes @modelcontextprotocol/server-filesystem "$REPO" &>/dev/null &
  MCP_PID=$!
  sleep 4
  kill $MCP_PID 2>/dev/null || true
  echo "  ✅ MCP filesystem pre-instalado"
fi

# ── 9. Dependencias Documentation Agent ──────────────────────────────────────
echo "▶ Dependencias Documentation Agent"

# docx (npm global)
if "$NODE" -e "require('docx')" 2>/dev/null; then
  echo "  ✅ docx (npm) disponible"
else
  echo "  📦 Instalando docx (npm global)..."
  npm install -g docx --silent
  echo "  ✅ docx instalado"
fi

# openpyxl — detectar el método correcto de pip según la versión de macOS
if python3 -c "import openpyxl" 2>/dev/null; then
  echo "  ✅ openpyxl (Python) disponible"
else
  echo "  📦 Instalando openpyxl..."
  # Intentar primero con venv (método más limpio en macOS 13+)
  VENV_DIR="$REPO/.sofia/venv"
  if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
  fi
  "$VENV_DIR/bin/pip" install openpyxl -q
  # Crear wrapper para que python3 use el venv
  cat > "$REPO/.sofia/run-python.sh" << WRAPPER
#!/bin/bash
"$VENV_DIR/bin/python3" "\$@"
WRAPPER
  chmod +x "$REPO/.sofia/run-python.sh"
  echo "  ✅ openpyxl instalado en venv: $VENV_DIR"
  echo "  ℹ️  Los scripts gen_excel.py se ejecutarán con: $VENV_DIR/bin/python3"
fi

# ── 10. Jenkins ───────────────────────────────────────────────────────────────
echo "▶ Jenkins LTS"
if brew services list 2>/dev/null | grep -q "jenkins-lts"; then
  STATUS=$(brew services list | grep jenkins-lts | awk '{print $2}')
  if [ "$STATUS" = "started" ]; then
    echo "  ✅ Jenkins en ejecución (localhost:8080)"
  else
    echo "  ⚠️  Jenkins instalado pero no en ejecución (estado: $STATUS)"
    echo "     Fix: brew services start jenkins-lts"
  fi
else
  echo "  ⚠️  Jenkins no instalado (opcional)"
  echo "     Instalar: brew install jenkins-lts && brew services start jenkins-lts"
fi

# ── Resumen ───────────────────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────────────────────"
if [ "$ERRORS" = "0" ]; then
  echo "✅  Sin errores críticos — SOFIA lista"
  if [ "$WRITE_CONFIG" = "1" ]; then
    echo ""
    echo "  ⚠️  ACCIÓN REQUERIDA:"
    echo "  Reiniciar Claude Desktop (Cmd+Q → volver a abrir)"
    echo "  para cargar los servidores MCP filesystem y git"
  fi
else
  echo "❌  $ERRORS error(s) — revisar fixes arriba"
fi
echo "────────────────────────────────────────────────────"
echo ""
