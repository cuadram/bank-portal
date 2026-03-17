#!/bin/bash
# SOFIA — post-commit wrapper (setup-sofia-mac.sh v1.4)
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
HOOK="$REPO_ROOT/.sofia/doc-agent-hook.sh"
[ -f "$HOOK" ] && bash "$HOOK"
