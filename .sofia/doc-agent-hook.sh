#!/bin/bash
<<<<<<< HEAD
# ============================================================================
# SOFIA — Documentation Agent Hook v1.4
# Fuente canónica: .sofia/hooks/doc-agent-hook.sh
# Copia activa:    .sofia/doc-agent-hook.sh  (instalada por setup-sofia-mac.sh)
#
# Disparado por: .git/hooks/post-commit → .sofia/doc-agent-hook.sh
# Solo actúa si el commit toca docs/deliverables/*.js o *.py
#
# Modos:
#   A) gen_all_word.js + gen_all_excel.py en docs/deliverables/ → multi-sprint
#   B) gen_word.js + gen_excel.py más reciente en sprint/ → sprint individual
# ============================================================================

REPO="$(git rev-parse --show-toplevel 2>/dev/null)"
[ -z "$REPO" ] && exit 0

DELIVERABLES="$REPO/docs/deliverables"
[ -d "$DELIVERABLES" ] || exit 0

# ── Detectar Node ─────────────────────────────────────────────────────────────
NODE=""
for candidate in \
    "/opt/homebrew/opt/node@22/bin/node" \
    "/opt/homebrew/opt/node@20/bin/node" \
    "/usr/local/bin/node" \
    "$(command -v node 2>/dev/null)"; do
    [ -x "$candidate" ] && NODE="$candidate" && break
done
[ -z "$NODE" ] && echo "  ⚠️  SOFIA Doc Agent: node no encontrado — skipping Word docs"
export NODE_PATH="/opt/homebrew/lib/node_modules:/usr/local/lib/node_modules:$NODE_PATH"

# ── Detectar Python con openpyxl ─────────────────────────────────────────────
PY=""
VENV_DIR="$REPO/.sofia/venv"

# A: venv del proyecto
[ -x "$VENV_DIR/bin/python3" ] && \
    "$VENV_DIR/bin/python3" -c "import openpyxl" 2>/dev/null && \
    PY="$VENV_DIR/bin/python3"

# B: venv global SOFIA
[ -z "$PY" ] && [ -x "$HOME/.sofia-venv/bin/python3" ] && \
    "$HOME/.sofia-venv/bin/python3" -c "import openpyxl" 2>/dev/null && \
    PY="$HOME/.sofia-venv/bin/python3"

# C: python3 del sistema
if [ -z "$PY" ]; then
    for c in "/opt/homebrew/bin/python3" "/usr/local/bin/python3" "$(command -v python3 2>/dev/null)"; do
        [ -x "$c" ] && "$c" -c "import openpyxl" 2>/dev/null && PY="$c" && break
    done
fi

# D: autocreate venv si falta openpyxl
if [ -z "$PY" ]; then
    SYS_PY=""
    for c in "/opt/homebrew/bin/python3" "/usr/local/bin/python3" "$(command -v python3 2>/dev/null)"; do
        [ -x "$c" ] && SYS_PY="$c" && break
    done
    if [ -n "$SYS_PY" ]; then
        echo "  🐍 SOFIA Doc Agent: creando venv e instalando openpyxl..."
        "$SYS_PY" -m venv "$VENV_DIR"
        "$VENV_DIR/bin/pip" install openpyxl -q
        PY="$VENV_DIR/bin/python3"
        echo "  ✅ openpyxl instalado en $VENV_DIR"
    else
        echo "  ⚠️  SOFIA Doc Agent: python3 no encontrado — skipping Excel docs"
    fi
fi

# ── Solo actuar si el commit toca scripts de documentación ────────────────────
CHANGED=$(git diff-tree --no-commit-id -r --name-only HEAD 2>/dev/null)
echo "$CHANGED" | grep -qE "docs/deliverables/.*\.(js|py)$" || exit 0

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📑 SOFIA Documentation Agent v1.4"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Modo A: Scripts maestros (gen_all_word.js + gen_all_excel.py) ─────────────
if [ -f "$DELIVERABLES/gen_all_word.js" ] || [ -f "$DELIVERABLES/gen_all_excel.py" ]; then
    echo "  Modo: multi-sprint"
    if [ -f "$DELIVERABLES/gen_all_word.js" ] && [ -n "$NODE" ]; then
        echo ""; echo "  📄 Word docs (todos los sprints)..."
        cd "$DELIVERABLES" && "$NODE" gen_all_word.js \
            && echo "  ✅ Word OK" || echo "  ❌ Error Word"
        cd "$REPO"
    fi
    if [ -f "$DELIVERABLES/gen_all_excel.py" ] && [ -n "$PY" ]; then
        echo ""; echo "  📊 Excel docs (todos los sprints)..."
        "$PY" "$DELIVERABLES/gen_all_excel.py" \
            && echo "  ✅ Excel OK" || echo "  ❌ Error Excel"
    fi
    echo ""; echo "  ✅ SOFIA: delivery packages actualizados"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
fi

# ── Modo B: Sprint individual (el gen_word.js / gen_excel.py más reciente) ────
SPRINT_DIR=$(find "$DELIVERABLES" -name "gen_word.js" \
    -exec dirname {} \; 2>/dev/null | sort -r | head -1)
[ -z "$SPRINT_DIR" ] && SPRINT_DIR=$(find "$DELIVERABLES" -name "gen_excel.py" \
    -exec dirname {} \; 2>/dev/null | sort -r | head -1)
[ -z "$SPRINT_DIR" ] && echo "  ⚠️  No hay scripts de generación" && exit 0

echo "  Modo: sprint individual → $(basename $SPRINT_DIR)"
if [ -f "$SPRINT_DIR/gen_word.js" ] && [ -n "$NODE" ]; then
    echo ""; echo "  📄 Word docs..."
    "$NODE" "$SPRINT_DIR/gen_word.js" && echo "  ✅ Word OK" || echo "  ❌ Error Word"
fi
if [ -f "$SPRINT_DIR/gen_excel.py" ] && [ -n "$PY" ]; then
    echo ""; echo "  📊 Excel docs..."
    "$PY" "$SPRINT_DIR/gen_excel.py" && echo "  ✅ Excel OK" || echo "  ❌ Error Excel"
fi

echo ""; echo "  ✅ SOFIA: delivery package en $(basename $SPRINT_DIR)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
=======
# SOFIA — post-commit wrapper (setup-sofia-mac.sh v1.4)
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
HOOK="$REPO_ROOT/.sofia/doc-agent-hook.sh"
[ -f "$HOOK" ] && bash "$HOOK"
>>>>>>> feature/FEAT-004-sprint8-semana1
