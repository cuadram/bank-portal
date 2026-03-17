#!/bin/bash
# ============================================================================
# SOFIA — Documentation Agent Hook v1.4
# Disparado automáticamente por git post-commit
# Genera .docx y .xlsx para el sprint activo tras cada commit
#
# Lógica de ejecución:
#   1. Busca gen_all_word.js / gen_all_excel.py en docs/deliverables/
#      → si existe, ejecuta el script MAESTRO (todos los sprints)
#   2. Si no, busca el gen_word.js / gen_excel.py más reciente
#      (sprint individual — modo legado compatible con v1.3)
#   3. En ambos casos regenera solo si los scripts cambiaron en el commit
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

if [ -z "$NODE" ]; then
    echo "  ⚠️  SOFIA Doc Agent: node no encontrado — skipping Word docs"
fi

export NODE_PATH="/opt/homebrew/lib/node_modules:/usr/local/lib/node_modules:$NODE_PATH"

# ── Detectar Python con openpyxl ─────────────────────────────────────────────
PY=""

# Opción A: venv del proyecto
VENV_DIR="$REPO/.sofia/venv"
if [ -x "$VENV_DIR/bin/python3" ] && "$VENV_DIR/bin/python3" -c "import openpyxl" 2>/dev/null; then
    PY="$VENV_DIR/bin/python3"
fi

# Opción B: venv global de SOFIA
if [ -z "$PY" ] && [ -x "$HOME/.sofia-venv/bin/python3" ]; then
    if "$HOME/.sofia-venv/bin/python3" -c "import openpyxl" 2>/dev/null; then
        PY="$HOME/.sofia-venv/bin/python3"
    fi
fi

# Opción C: python3 del sistema
if [ -z "$PY" ]; then
    for candidate in "/opt/homebrew/bin/python3" "/usr/local/bin/python3" "$(command -v python3 2>/dev/null)"; do
        if [ -x "$candidate" ] && "$candidate" -c "import openpyxl" 2>/dev/null; then
            PY="$candidate" && break
        fi
    done
fi

# Opción D: crear venv automáticamente si falta openpyxl
if [ -z "$PY" ]; then
    SYS_PY=""
    for candidate in "/opt/homebrew/bin/python3" "/usr/local/bin/python3" "$(command -v python3 2>/dev/null)"; do
        [ -x "$candidate" ] && SYS_PY="$candidate" && break
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

# ── Verificar si el commit toca scripts de documentación ─────────────────────
CHANGED=$(git diff-tree --no-commit-id -r --name-only HEAD 2>/dev/null)

touches_docs() {
    echo "$CHANGED" | grep -qE "docs/deliverables/.*\.(js|py)$"
}

# Si el commit no toca ningún script de docs, salir silenciosamente
if ! touches_docs; then
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📑 SOFIA Documentation Agent v1.4"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Modo A: Scripts maestros (todos los sprints) ──────────────────────────────
MASTER_WORD="$DELIVERABLES/gen_all_word.js"
MASTER_EXCEL="$DELIVERABLES/gen_all_excel.py"

if [ -f "$MASTER_WORD" ] || [ -f "$MASTER_EXCEL" ]; then
    echo "  Modo: multi-sprint (scripts maestros)"

    if [ -f "$MASTER_WORD" ] && [ -n "$NODE" ]; then
        echo ""
        echo "  📄 Generando Word docs (todos los sprints)..."
        cd "$DELIVERABLES"
        "$NODE" gen_all_word.js && echo "  ✅ Word docs generados" || echo "  ❌ Error en gen_all_word.js"
        cd "$REPO"
    fi

    if [ -f "$MASTER_EXCEL" ] && [ -n "$PY" ]; then
        echo ""
        echo "  📊 Generando Excel docs (todos los sprints)..."
        "$PY" "$MASTER_EXCEL" && echo "  ✅ Excel docs generados" || echo "  ❌ Error en gen_all_excel.py"
    fi

    echo ""
    echo "  ✅ SOFIA: delivery packages actualizados"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
fi

# ── Modo B: Sprint individual (el más reciente con gen_word.js) ───────────────
SPRINT_DIR=$(find "$DELIVERABLES" -name "gen_word.js" \
             -exec dirname {} \; 2>/dev/null | sort -r | head -1)

if [ -z "$SPRINT_DIR" ]; then
    SPRINT_DIR=$(find "$DELIVERABLES" -name "gen_excel.py" \
                 -exec dirname {} \; 2>/dev/null | sort -r | head -1)
fi

[ -z "$SPRINT_DIR" ] && echo "  ⚠️  No se encontraron scripts de generación" && exit 0

echo "  Modo: sprint individual → $(basename $SPRINT_DIR)"

if [ -f "$SPRINT_DIR/gen_word.js" ] && [ -n "$NODE" ]; then
    echo ""
    echo "  📄 Generando Word docs..."
    "$NODE" "$SPRINT_DIR/gen_word.js" && echo "  ✅ Word docs generados" || echo "  ❌ Error en gen_word.js"
fi

if [ -f "$SPRINT_DIR/gen_excel.py" ] && [ -n "$PY" ]; then
    echo ""
    echo "  📊 Generando Excel docs..."
    "$PY" "$SPRINT_DIR/gen_excel.py" && echo "  ✅ Excel docs generados" || echo "  ❌ Error en gen_excel.py"
fi

echo ""
echo "  ✅ SOFIA: delivery package en $(basename $SPRINT_DIR)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
