#!/bin/bash
# =============================================================================
# SOFIA — merge-releases.sh
# Ejecutar desde la raíz del repo: bash .sofia/scripts/merge-releases.sh
# Realiza en orden:
#   1. Activa el Documentation Agent hook (chmod +x)
#   2. Crea rama develop si no existe
#   3. Merge v1.7.0 (feature/FEAT-006-sprint7-semana2) → develop
#   4. Merge v1.8.0 (feature/FEAT-004-sprint8-semana1) → develop
#   5. Merge develop → main + tags v1.7.0 y v1.8.0
#   6. Crea rama feature/FEAT-007-sprint9 para Sprint 9
# =============================================================================

set -e

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  SOFIA — Merge Releases v1.7.0 + v1.8.0 + Sprint 9     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Verificar repo correcto ───────────────────────────────────────────────────
[ ! -f "CLAUDE.md" ] && echo "❌ Ejecutar desde la raíz del repo BankPortal" && exit 1

# ── 1. Activar Documentation Agent hook ──────────────────────────────────────
echo "▶ [1/6] Activando Documentation Agent hook..."

cat > "$REPO/.git/hooks/post-commit" << 'HOOK_EOF'
#!/bin/bash
# SOFIA — post-commit wrapper (setup-sofia-mac.sh v1.4)
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
HOOK="$REPO_ROOT/.sofia/doc-agent-hook.sh"
[ -f "$HOOK" ] && bash "$HOOK"
HOOK_EOF
chmod +x "$REPO/.git/hooks/post-commit"
chmod +x "$REPO/.sofia/doc-agent-hook.sh" 2>/dev/null || true
chmod +x "$REPO/.sofia/hooks/doc-agent-hook.sh" 2>/dev/null || true
chmod +x "$REPO/.sofia/hooks/post-commit" 2>/dev/null || true
echo "  ✅ .git/hooks/post-commit creado y activo"

# ── 2. Crear rama develop ─────────────────────────────────────────────────────
echo ""
echo "▶ [2/6] Preparando rama develop..."
git checkout main

if git show-ref --verify --quiet refs/heads/develop; then
    echo "  ✅ Rama develop ya existe"
    git checkout develop
else
    git checkout -b develop
    echo "  ✅ Rama develop creada desde main"
fi

# ── 3. Merge v1.7.0 ──────────────────────────────────────────────────────────
echo ""
echo "▶ [3/6] Merge v1.7.0 (FEAT-006 — Autenticación Contextual)..."

if git show-ref --verify --quiet refs/heads/feature/FEAT-006-sprint7-semana2; then
    git merge --no-ff feature/FEAT-006-sprint7-semana2 \
        -m "merge(v1.7.0): FEAT-006 Autenticacion Contextual y Bloqueo de Cuenta

US-601 Bloqueo automatico | US-602 Desbloqueo email | US-603 Login contextual
US-604 Historial config | US-403 Preferencias | DEBT-008 Dashboard paralelo
Tests: 81 | Defectos: 0 | Gates: 5/5 | PCI-DSS 4.0 req. 8.3.4 CUMPLE"
    echo "  ✅ v1.7.0 mergeado en develop"
else
    echo "  ⚠️  feature/FEAT-006-sprint7-semana2 no encontrada — skip"
fi

# ── 4. Merge v1.8.0 ──────────────────────────────────────────────────────────
echo ""
echo "▶ [4/6] Merge v1.8.0 (FEAT-004 — Centro de Notificaciones)..."

if git show-ref --verify --quiet refs/heads/feature/FEAT-004-sprint8-semana1; then
    git merge --no-ff feature/FEAT-004-sprint8-semana1 \
        -m "merge(v1.8.0): FEAT-004 Centro de Notificaciones de Seguridad

US-301/302/303/304/305 | DEBT-009 JWT blacklist | DEBT-010 extractIpSubnet
SOFIA v1.4: Documentation Agent hook auto-instalable en setup
Tests: 59 | Defectos: 0 | Gates: 6/6 | Velocity media: 23.875 SP/sprint"
    echo "  ✅ v1.8.0 mergeado en develop"
else
    echo "  ⚠️  feature/FEAT-004-sprint8-semana1 no encontrada — skip"
fi

# ── 5. Merge develop → main + tags ───────────────────────────────────────────
echo ""
echo "▶ [5/6] Merge develop → main + tags de release..."

git checkout main
git merge --no-ff develop \
    -m "merge(main): develop → main · releases v1.7.0 + v1.8.0

FEAT-006: Autenticacion Contextual y Bloqueo (Sprint 7)
FEAT-004: Centro de Notificaciones (Sprint 8)
SOFIA v1.4: Documentation Agent hook
192 SP acumulados · 8 sprints · 0 defectos criticos"

git tag -a "v1.7.0" \
    -m "BankPortal v1.7.0 — FEAT-006 Autenticacion Contextual
Sprint 7 | 24 SP | 81 tests | PCI-DSS 4.0 req. 8.3.4 CUMPLE"

git tag -a "v1.8.0" \
    -m "BankPortal v1.8.0 — FEAT-004 Centro de Notificaciones
Sprint 8 | 24 SP | 59 tests | SOFIA v1.4 Documentation Agent"

echo "  ✅ Tags v1.7.0 y v1.8.0 creados"

# ── 6. Crear rama Sprint 9 ────────────────────────────────────────────────────
echo ""
echo "▶ [6/6] Preparando rama Sprint 9..."
git checkout -b feature/FEAT-007-sprint9
echo "  ✅ Rama feature/FEAT-007-sprint9 lista para Sprint 9"

# ── Resumen ───────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅  Releases y hook completados                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  ✅ v1.7.0 — FEAT-006 Auth Contextual + Bloqueo"
echo "  ✅ v1.8.0 — FEAT-004 Centro de Notificaciones + SOFIA v1.4"
echo "  ✅ Hook Documentation Agent activo"
echo "  ✅ Rama feature/FEAT-007-sprint9 lista"
echo ""
git log --oneline -6
echo ""
echo "  Próximo paso: Sprint 9 Planning"
echo "  → bash .sofia/scripts/merge-releases.sh ya NO es necesario ejecutarlo de nuevo"
echo ""
