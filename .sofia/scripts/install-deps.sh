#!/bin/bash
# SOFIA v2.0 — install-deps.sh
# Instala todas las dependencias necesarias para SOFIA v2.0:
#   - docx (npm) para Documentation Agent
#   - openpyxl (Python) para Excel generation
#   - python-docx (Python) para FA-Agent (Analisis Funcional Word)
#
# Ejecutar UNA VEZ tras el setup:
#   bash .sofia/scripts/install-deps.sh

set -e
echo ""
echo "▶ SOFIA v2.0 — Instalando dependencias..."
echo ""

# ── Node / npm ────────────────────────────────────────────────────────────────
NODE="/opt/homebrew/opt/node@22/bin/node"
NPM="/opt/homebrew/opt/node@22/bin/npm"
[ ! -x "$NODE" ] && NODE="$(command -v node 2>/dev/null)" && NPM="$(command -v npm 2>/dev/null)"

# docx (Documentation Agent)
if "$NODE" -e "require('docx')" 2>/dev/null; then
    echo "  ✅ docx (npm) — ya disponible"
else
    echo "  📦 Instalando docx (npm global)..."
    "$NPM" install -g docx --silent
    echo "  ✅ docx instalado"
fi

# ── Python / pip ──────────────────────────────────────────────────────────────
PYTHON3="$(command -v python3 2>/dev/null || echo /usr/bin/python3)"
PIP3="$(command -v pip3 2>/dev/null || echo '')"

# python-docx (FA-Agent — Analisis Funcional Word)
if "$PYTHON3" -c "import docx" 2>/dev/null; then
    echo "  ✅ python-docx — ya disponible"
else
    echo "  📦 Instalando python-docx..."
    if [ -n "$PIP3" ]; then
        "$PIP3" install python-docx --break-system-packages -q 2>/dev/null || \
        "$PIP3" install python-docx -q
    else
        "$PYTHON3" -m pip install python-docx --break-system-packages -q 2>/dev/null || \
        "$PYTHON3" -m pip install python-docx -q
    fi
    echo "  ✅ python-docx instalado"
fi

# openpyxl (Documentation Agent — Excel)
VENV="$HOME/.sofia-venv"
if [ ! -d "$VENV" ]; then
    echo "  📦 Creando venv $VENV..."
    "$PYTHON3" -m venv "$VENV"
fi
if "$VENV/bin/python3" -c "import openpyxl" 2>/dev/null; then
    echo "  ✅ openpyxl — ya disponible"
else
    echo "  📦 Instalando openpyxl en $VENV..."
    "$VENV/bin/pip" install openpyxl -q
    echo "  ✅ openpyxl instalado"
fi

echo ""
echo "  🎉 SOFIA v2.0 — Todas las dependencias instaladas."
echo ""
echo "  Comandos disponibles:"
echo "    FA-Agent Word:    python3 .sofia/scripts/gen-fa-document.py"
echo "    Dashboard:        $NODE .sofia/scripts/gen-dashboard.js"
echo ""
