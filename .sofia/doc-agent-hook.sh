#!/bin/bash
# ============================================================================
# SOFIA — Documentation Agent Hook v1.4
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
[ -x "$VENV_DIR/bin/python3" ] && \
    "$VENV_DIR/bin/python3" -c "import openpyxl" 2>/dev/null && \
    PY="$VENV_DIR/bin/python3"
[ -z "$PY" ] && [ -x "$HOME/.sofia-venv/bin/python3" ] && \
    "$HOME/.sofia-venv/bin/python3" -c "import openpyxl" 2>/dev/null && \
    PY="$HOME/.sofia-venv/bin/python3"
if [ -z "$PY" ]; then
    for c in "/opt/homebrew/bin/python3" "/usr/local/bin/python3" "$(command -v python3 2>/dev/null)"; do
        [ -x "$c" ] && "$c" -c "import openpyxl" 2>/dev/null && PY="$c" && break
    done
fi
if [ -z "$PY" ]; then
    SYS_PY=""
    for c in "/opt/homebrew/bin/python3" "/usr/local/bin/python3" "$(command -v python3 2>/dev/null)"; do
        [ -x "$c" ] && SYS_PY="$c" && break
    done
    if [ -n "$SYS_PY" ]; then
        "$SYS_PY" -m venv "$VENV_DIR"
        "$VENV_DIR/bin/pip" install openpyxl -q
        PY="$VENV_DIR/bin/python3"
    fi
fi

# ── Solo actuar si el commit toca scripts de documentación ────────────────────
CHANGED=$(git diff-tree --no-commit-id -r --name-only HEAD 2>/dev/null)
echo "$CHANGED" | grep -qE "docs/deliverables/.*\.(js|py)$" || exit 0

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📑 SOFIA Documentation Agent v1.4"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Modo A: Scripts maestros ───────────────────────────────────────────────────
if [ -f "$DELIVERABLES/gen_all_word.js" ] || [ -f "$DELIVERABLES/gen_all_excel.py" ]; then
    echo "  Modo: multi-sprint"
    [ -f "$DELIVERABLES/gen_all_word.js" ] && [ -n "$NODE" ] && \
        cd "$DELIVERABLES" && "$NODE" gen_all_word.js && cd "$REPO"
    [ -f "$DELIVERABLES/gen_all_excel.py" ] && [ -n "$PY" ] && \
        "$PY" "$DELIVERABLES/gen_all_excel.py"
    echo "  ✅ SOFIA: delivery packages actualizados"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
fi

# ── Modo B: Sprint individual ─────────────────────────────────────────────────
SPRINT_DIR=$(find "$DELIVERABLES" -name "gen_word.js" \
    -exec dirname {} \; 2>/dev/null | sort -r | head -1)
[ -z "$SPRINT_DIR" ] && SPRINT_DIR=$(find "$DELIVERABLES" -name "gen_excel.py" \
    -exec dirname {} \; 2>/dev/null | sort -r | head -1)
[ -z "$SPRINT_DIR" ] && exit 0

echo "  Modo: sprint individual → $(basename $SPRINT_DIR)"
if [ -f "$SPRINT_DIR/gen_word.js" ] && [ -n "$NODE" ]; then
    echo "  📄 Word docs..."
    cd "$SPRINT_DIR" && "$NODE" gen_word.js && cd "$REPO" \
        && echo "  ✅ Word OK" || echo "  ❌ Error Word"
fi
if [ -f "$SPRINT_DIR/gen_excel.py" ] && [ -n "$PY" ]; then
    echo "  📊 Excel docs..."
    "$PY" "$SPRINT_DIR/gen_excel.py" \
        && echo "  ✅ Excel OK" || echo "  ❌ Error Excel"
fi

echo "  ✅ SOFIA: delivery package en $(basename $SPRINT_DIR)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
