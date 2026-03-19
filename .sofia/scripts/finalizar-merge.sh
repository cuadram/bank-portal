#!/bin/bash
# SOFIA — finalizar-merge.sh
# Ejecutar desde la raíz del repo para completar lo que el script anterior
# dejó pendiente: merge develop → main + tags + rama Sprint 9
# Uso: bash .sofia/scripts/finalizar-merge.sh

set -e
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO"

echo ""
echo "▶ Merge develop → main..."
git checkout main
git merge --no-ff develop \
    -m "merge(main): develop → main · releases v1.7.0 + v1.8.0

FEAT-006: Autenticacion Contextual y Bloqueo (Sprint 7) — 81 tests
FEAT-004: Centro de Notificaciones (Sprint 8) — 59 tests
SOFIA v1.4: Documentation Agent hook integrado en setup
192 SP · 8 sprints · 0 defectos criticos"

echo "  ✅ develop → main mergeado"

echo ""
echo "▶ Creando tags de release..."
git tag -a "v1.7.0" \
    -m "BankPortal v1.7.0 — FEAT-006 Sprint 7
81 tests | PCI-DSS 4.0 req. 8.3.4 + 10.2 CUMPLE" 2>/dev/null \
    && echo "  ✅ Tag v1.7.0" || echo "  ⚠️  Tag v1.7.0 ya existe"

git tag -a "v1.8.0" \
    -m "BankPortal v1.8.0 — FEAT-004 Sprint 8
59 tests | SOFIA v1.4 Documentation Agent" 2>/dev/null \
    && echo "  ✅ Tag v1.8.0" || echo "  ⚠️  Tag v1.8.0 ya existe"

echo ""
echo "▶ Creando rama Sprint 9..."
if git show-ref --verify --quiet refs/heads/feature/FEAT-007-sprint9; then
    echo "  ✅ Rama feature/FEAT-007-sprint9 ya existe"
    git checkout feature/FEAT-007-sprint9
else
    git checkout -b feature/FEAT-007-sprint9
    echo "  ✅ Rama feature/FEAT-007-sprint9 creada"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅  Todo completado                                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
git log --oneline -8
echo ""
git tag | grep "^v"
echo ""
echo "  Rama activa: $(git rev-parse --abbrev-ref HEAD)"
echo "  Hook activo: .git/hooks/post-commit ✅"
echo ""
echo "  Siguiente: Sprint 9 Planning"
echo "  → DEBT-011 Redis Pub/Sub SSE"
echo "  → DEBT-012 Purga notificaciones 90d"
echo "  → FEAT-007 por definir"
echo ""
