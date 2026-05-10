# LA-PROMOTION-PLAN Sprint 26 · Step 8b → Step 9

**Generado:** 2026-05-10 · Step 8b cierre
**Owner:** SOFIA Workflow Manager (Step 9)
**HITL PO:** Angel de la Cuadra
**Procedimiento canónico:** `la-promote.js` (genera JSON) → `sofia-contribute.py --accept` (aplica a SOFIA-CORE con HITL PO)

---

## Estado de LAs S26

### Aplicadas (no requieren acción)

| ID | Scope | Status |
|----|-------|--------|
| **GR-SHELL-001** | mvn en allowlist + TIMEOUT 600s | ✅ APLICADA en SOFIA-CORE commit `998f430` (2026-05-08). Solo registrar en LA-SYNC-REPORT-S26 como promoción consolidada. |

### Pendientes promoción (acción Step 9)

| ID | Scope | Acción Step 9 |
|----|-------|---------------|
| **GR-SHELL-002** | Parser shell SOFIA admite `VAR=val cmd args...` inline para eliminar wrapper python3 (W2) | Promoción + plan implementación S27/S28 (afecta `parser_shell.py` en SOFIA-CORE) |
| **GR-FE-002** | E2E UI-driven obligatoria pre-G-5/G-6 + política OBS-XXX → DEBT formal en informe Step 5 | Promoción + actualización `code-reviewer/SKILL.md` y `qa-tester/SKILL.md` en SOFIA-CORE |
| **LA-026-09** (NUEVA) | Dashboard pipeline-types-mismatch · `gen-global-dashboard.js` debe normalizar tipos en `completedSteps` y comparar `current_step` con coercion suave (==) o forzar tipos | Promoción · fix definitivo en SOFIA-CORE elimina necesidad del wrapper local |

### Lessons Learned S26 a registrar (sprint-level, no necesariamente promovibles a CORE)

| ID | Tipo | Severidad | Scope |
|----|------|-----------|-------|
| LA-026-01 | process/governance/audit | medium | gate-history-mixes-pending-and-approved |
| LA-026-02 | process/governance/cmmi | medium | cmmi-process-areas-incomplete-declaration |
| LA-026-03 | tooling/mcp/recovery | medium | mcp-shell-stdio-buffer-limit-large-payloads |
| LA-026-04 | process/governance | high | manifest-la-core-index-acepta-ids-locales-y-no-tiene-validacion |
| LA-026-05 | process/governance/snapshots | low | snapshot-intermedio-redundante-cuando-git-history-cubre-reversa |
| LA-026-06 | process/governance/audit | medium | audit-must-follow-invocation-chain-not-just-grep-target-file |
| LA-026-07 | tooling/spring-boot/config | medium | spring-boot-yaml-no-deep-merge-bank-and-jwt-blocks-between-profiles |
| LA-026-08 | tooling/testcontainers/docker | medium | testcontainers-docker-from-docker-fails-in-docker-desktop-macos |

(Estas LAs ya están en `session.json.lessons_learned`. Workflow Manager decide en Step 9 cuáles promover a CORE como guardrails permanentes.)

---

## Procedimiento Step 9 (resumido)

```bash
# Para cada LA pendiente:
node .sofia/scripts/la-promote.js --la-id GR-SHELL-002 --target SOFIA-CORE
# Genera JSON de promoción en .sofia/tmp/la-promote-*.json

# HITL PO revisa y aprueba
python3 sofia-contribute.py --accept --la-id GR-SHELL-002

# Repetir para GR-FE-002 y LA-026-09
```

**HITL-CORE-018**: Aprobación HITL PO obligatoria antes de persistir en SOFIA-CORE.

---

## Notas

1. La ejecución real de `la-promote.js` + `sofia-contribute.py` se difiere a **Step 9** (Workflow Manager) para concentrar todas las mutaciones de SOFIA-CORE en una sola ventana, post-G-9.
2. **S26 preflight Tier-A sync** (mencionado en handoff Step 8 sec.6): ejecutar tras G-9 aprobado, no mid-sprint.
3. **LA-026-09** (dashboard fix) emergió en este Step 8b — es nueva, conviene formalizarla con detalle técnico antes de la promoción (ver `sofia.log` entrada DASH-FIX 2026-05-10T11:06).
