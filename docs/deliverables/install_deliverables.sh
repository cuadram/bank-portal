#!/bin/bash
# SOFIA Documentation Agent — instalar deliverables Sprint 2
# Ejecutar: bash docs/deliverables/install_deliverables.sh
# Luego copiar manualmente los 6 archivos descargados a las carpetas word/ y excel/

BASE="$(cd "$(dirname "$0")" && pwd)/sprint-2-FEAT-001"
mkdir -p "$BASE/word" "$BASE/excel"

echo "📁 Directorio de entrega creado:"
echo "   $BASE/word/"
echo "   $BASE/excel/"
echo ""
echo "➡️  Copia los archivos descargados:"
echo "   word/  → Sprint-Report-Sprint2.docx"
echo "          → Risk-Register-Sprint2.docx"
echo "          → Release-Notes-v1.1.0.docx"
echo "   excel/ → Quality-Dashboard-Sprint2.xlsx"
echo "          → Sprint-Metrics-Sprint2.xlsx"
echo "          → Velocity-Report.xlsx"
echo ""
echo "Luego ejecuta:"
echo "  cd /Users/cuadram/proyectos/bank-portal"
echo "  git add docs/deliverables/"
echo "  git commit -m 'docs(documentation-agent): delivery package Sprint 2 — FEAT-001 CLOSED'"
echo "  git tag -a v1.1.0 -m 'BankPortal v1.1.0 — FEAT-001 2FA completa — PCI-DSS 4.0 CUMPLE'"
