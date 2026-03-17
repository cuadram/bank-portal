#!/bin/bash
# SOFIA — post-commit wrapper (instalado por setup-sofia-mac.sh v1.4)
# NO modificar este archivo directamente — editar .sofia/doc-agent-hook.sh
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
HOOK="$REPO_ROOT/.sofia/doc-agent-hook.sh"
[ -f "$HOOK" ] && bash "$HOOK"
