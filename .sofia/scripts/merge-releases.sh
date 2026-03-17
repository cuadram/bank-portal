#!/bin/bash
# =============================================================================
# SOFIA — merge-releases.sh v1.1
# Resuelve el conflicto de merge con .sofia/doc-agent-hook.sh
# Ejecutar: bash .sofia/scripts/merge-releases.sh
# =============================================================================

set -e

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  SOFIA — Merge Releases v1.7.0 + v1.8.0 + Sprint 9     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

[ ! -f "CLAUDE.md" ] && echo "❌ Ejecutar desde la raíz del repo BankPortal" && exit 1

# ── 1. Activar hook ───────────────────────────────────────────────────────────
echo "▶ [1/6] Activando Documentation Agent hook..."
cat > "$REPO/.git/hooks/post-commit" << 'HOOK_EOF'
#!/bin/bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
HOOK="$REPO_ROOT/.sofia/doc-agent-hook.sh"
[ -f "$HOOK" ] && bash "$HOOK"
HOOK_EOF
chmod +x "$REPO/.git/hooks/post-commit"
chmod +x "$REPO/.sofia/doc-agent-hook.sh" 2>/dev/null || true
echo "  ✅ .git/hooks/post-commit activo"

# ── 2. Preparar develop ───────────────────────────────────────────────────────
echo ""
echo "▶ [2/6] Preparando rama develop..."

# Si ya estamos en develop (el script anterior dejó aqui la ejecucion)
CURRENT=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT" != "develop" ]; then
    git checkout main
    if git show-ref --verify --quiet refs/heads/develop; then
        git checkout develop
    else
        git checkout -b develop
    fi
fi
echo "  ✅ En rama develop"

# Commitear archivos untracked que colisionarían con el merge
UNTRACKED_HOOK=".sofia/doc-agent-hook.sh"
if git ls-files --others --exclude-standard | grep -q "$UNTRACKED_HOOK"; then
    echo "  📌 Commiteando $UNTRACKED_HOOK para evitar conflicto..."
    git add "$UNTRACKED_HOOK"
    git commit -m "chore(sofia): pre-merge doc-agent-hook.sh — evita conflicto merge v1.8.0"
    echo "  ✅ Archivo trackeado"
fi

# ── 3. Merge v1.7.0 ──────────────────────────────────────────────────────────
echo ""
echo "▶ [3/6] Merge v1.7.0 (FEAT-006)..."
if git show-ref --verify --quiet refs/heads/feature/FEAT-006-sprint7-semana2; then
    # Verificar si ya está mergeado
    if git merge-base --is-ancestor feature/FEAT-006-sprint7-semana2 HEAD 2>/dev/null; then
        echo "  ✅ v1.7.0 ya mergeado anteriormente"
    else
        git merge --no-ff feature/FEAT-006-sprint7-semana2 \
            -m "merge(v1.7.0): FEAT-006 Autenticacion Contextual y Bloqueo de Cuenta

US-601 Bloqueo | US-602 Desbloqueo email | US-603 Login contextual ADR-011
US-604 Historial config | US-403 Preferencias | DEBT-008 Dashboard paralelo
Tests: 81 | Defectos: 0 | Gates: 5/5 | PCI-DSS 4.0 req. 8.3.4 CUMPLE"
        echo "  ✅ v1.7.0 mergeado"
    fi
else
    echo "  ⚠️  Rama feature/FEAT-006-sprint7-semana2 no encontrada"
fi

# ── 4. Merge v1.8.0 ──────────────────────────────────────────────────────────
echo ""
echo "▶ [4/6] Merge v1.8.0 (FEAT-004)..."
if git show-ref --verify --quiet refs/heads/feature/FEAT-004-sprint8-semana1; then
    if git merge-base --is-ancestor feature/FEAT-004-sprint8-semana1 HEAD 2>/dev/null; then
        echo "  ✅ v1.8.0 ya mergeado anteriormente"
    else
        git merge --no-ff feature/FEAT-004-sprint8-semana1 \
            -m "merge(v1.8.0): FEAT-004 Centro de Notificaciones de Seguridad

US-301/302/303/304/305 | DEBT-009 JWT blacklist | DEBT-010 extractIpSubnet
SOFIA v1.4: Documentation Agent hook auto-instalable
Tests: 59 | Defectos: 0 | Gates: 6/6 | Velocity: 23.875 SP/sprint"
        echo "  ✅ v1.8.0 mergeado"
    fi
else
    echo "  ⚠️  Rama feature/FEAT-004-sprint8-semana1 no encontrada"
fi

# ── 5. Merge develop → main + tags ───────────────────────────────────────────
echo ""
echo "▶ [5/6] Merge develop → main + tags..."
git checkout main
git merge --no-ff develop \
    -m "merge(main): develop → main · releases v1.7.0 + v1.8.0

FEAT-006: Autenticacion Contextual y Bloqueo (Sprint 7)
FEAT-004: Centro de Notificaciones (Sprint 8)
SOFIA v1.4: Documentation Agent hook
192 SP · 8 sprints · 0 defectos"

git tag -a "v1.7.0" \
    -m "BankPortal v1.7.0 — FEAT-006 Sprint 7 | 81 tests | PCI-DSS 8.3.4 CUMPLE" \
    2>/dev/null || echo "  ⚠️  Tag v1.7.0 ya existe"

git tag -a "v1.8.0" \
    -m "BankPortal v1.8.0 — FEAT-004 Sprint 8 | 59 tests | SOFIA v1.4" \
    2>/dev/null || echo "  ⚠️  Tag v1.8.0 ya existe"

echo "  ✅ Tags v1.7.0 y v1.8.0 listos"

# ── 6. Rama Sprint 9 ─────────────────────────────────────────────────────────
echo ""
echo "▶ [6/6] Creando rama Sprint 9..."
if git show-ref --verify --quiet refs/heads/feature/FEAT-007-sprint9; then
    echo "  ✅ Rama feature/FEAT-007-sprint9 ya existe"
    git checkout feature/FEAT-007-sprint9
else
    git checkout -b feature/FEAT-007-sprint9
    echo "  ✅ Rama feature/FEAT-007-sprint9 creada"
fi

# ── Resumen ───────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅  Todo completado                                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
git log --oneline -8
echo ""
echo "  Hook  : ✅ activo (.git/hooks/post-commit)"
echo "  Ramas : main ← develop ← FEAT-006 + FEAT-004"
echo "  Tags  : v1.7.0 · v1.8.0"
echo "  Activa: feature/FEAT-007-sprint9"
echo ""
echo "  Siguiente: Sprint 9 Planning"
echo "    → DEBT-011 Redis Pub/Sub SSE"
echo "    → DEBT-012 Job purga notificaciones 90d"
echo "    → FEAT-007 (por definir)"
echo ""
