#!/bin/bash
# SOFIA — install-deps.sh
# Instala docx (npm) y openpyxl (Python venv) para el Documentation Agent
# Ejecutar UNA VEZ: bash .sofia/scripts/install-deps.sh

set -e
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
echo ""
echo "▶ Instalando dependencias SOFIA Documentation Agent..."

# docx via npm global
NODE="/opt/homebrew/opt/node@22/bin/node"
NPM="/opt/homebrew/opt/node@22/bin/npm"
[ ! -x "$NODE" ] && NODE="$(command -v node)" && NPM="$(command -v npm)"

if ! "$NODE" -e "require('docx')" 2>/dev/null; then
    echo "  📦 Instalando docx (npm global)..."
    "$NPM" install -g docx --silent
    echo "  ✅ docx instalado"
else
    echo "  ✅ docx ya disponible"
fi

# openpyxl via venv global ~/.sofia-venv
VENV="$HOME/.sofia-venv"
if [ ! -d "$VENV" ]; then
    echo "  📦 Creando venv $VENV..."
    python3 -m venv "$VENV"
fi
if ! "$VENV/bin/python3" -c "import openpyxl" 2>/dev/null; then
    echo "  📦 Instalando openpyxl en $VENV..."
    "$VENV/bin/pip" install openpyxl -q
    echo "  ✅ openpyxl instalado"
else
    echo "  ✅ openpyxl ya disponible"
fi

echo ""
echo "  ✅ Dependencias listas. El Documentation Agent generará"
echo "     .docx y .xlsx automáticamente en cada git commit."
echo ""
echo "  Para generar documentos manualmente:"
echo "    cd $REPO/docs/deliverables"
echo "    $NODE gen_all_word.js"
echo "    $VENV/bin/python3 gen_all_excel.py"
echo ""
