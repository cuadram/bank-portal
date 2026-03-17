#!/bin/bash
# SOFIA — Activar Documentation Agent hook en este repo
# Ejecutar UNA VEZ tras instalar SOFIA v1.4:
#   bash .sofia/scripts/activate-hook.sh

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
echo "Activando Documentation Agent hook en $REPO..."

chmod +x "$REPO/.git/hooks/post-commit"
chmod +x "$REPO/.sofia/doc-agent-hook.sh"
chmod +x "$REPO/.sofia/hooks/doc-agent-hook.sh"
chmod +x "$REPO/.sofia/hooks/post-commit"

echo "✅ Hook activado. El Documentation Agent generará .docx y .xlsx"
echo "   automáticamente en cada git commit que toque docs/deliverables/*.js o *.py"
echo ""
echo "Prueba: touch docs/deliverables/gen_all_word.js && git add . && git commit -m 'test hook'"
