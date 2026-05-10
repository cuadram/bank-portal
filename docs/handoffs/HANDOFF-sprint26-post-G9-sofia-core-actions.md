# HANDOFF — Acciones SOFIA-CORE pendientes post-cierre Sprint 26 bank-portal

**Generado:** 2026-05-10 · post commit `6a27c6c`
**Owner siguiente sesión:** SOFIA Workflow Manager (en sesión SOFIA-CORE)
**HITL PO:** Angel de la Cuadra
**Bloquea cierre Sprint 26 bank-portal:** ❌ NO (CV4: aceptación SOFIA-CORE puede ocurrir días/semanas después)

---

## 0. Contexto

Sprint 26 bank-portal cerró su Step 9 generando entradas pendientes para SOFIA-CORE. Esta sesión NO ha podido procesarlas porque GR-CORE-026 prohíbe ejecutar `sofia-contribute.py` desde sesión bank-portal. Las acciones de este handoff se ejecutan **en sesión SOFIA-CORE separada** cuando el PO lo decida (no urgente).

---

## 1. Acción 1 — Aceptar/rechazar 5 LAs S26 candidatas

### Input

`bank-portal/.sofia/la-promotion-request-S26.json` (committed en `6a27c6c`)

Contenido:
- `candidates[]` — 5 LAs reales (LA-026-04, 05, 06, 07, 08), ordenadas por severity DESC
- `skipped[]` — 3 LAs ya promovidas (LA-026-01/02/03 → LA-CORE-065/066/067), filtradas manualmente
- `manual_filter_note` — documenta bug "la-promote no filtra promoted_to"

### Comandos a ejecutar

```bash
cd /Users/cuadram/Library/CloudStorage/OneDrive-Personal/WIP/SOFIA-CORE

# Para cada LA en candidates[], ejecutar UNO de:
python3 scripts/sofia-contribute.py --project /Users/cuadram/proyectos/bank-portal --accept LA-026-04
python3 scripts/sofia-contribute.py --project /Users/cuadram/proyectos/bank-portal --accept LA-026-05
python3 scripts/sofia-contribute.py --project /Users/cuadram/proyectos/bank-portal --accept LA-026-06
python3 scripts/sofia-contribute.py --project /Users/cuadram/proyectos/bank-portal --accept LA-026-07
python3 scripts/sofia-contribute.py --project /Users/cuadram/proyectos/bank-portal --accept LA-026-08

# O --reject LA-026-XX si el PO decide no promover alguna
```

### Decisión esperada por LA

| LA | Severidad | Recomendación PO | Notas |
|----|-----------|------------------|-------|
| LA-026-04 | high | ACCEPT (REGLA_PERMANENTE detectada) | Cierra deuda invisible MANIFEST.la_core_index acepta IDs locales |
| LA-026-05 | baja | Considerar — propuesta GR-SNAPSHOT-001 | Optimización de gobernanza |
| LA-026-06 | media | ACCEPT — propuesta GR-AUDIT-002 | Patrón replicable detectado en S25 también |
| LA-026-07 | media | ACCEPT — propuesta GR-CONFIG-001 | Spring Boot YAML profile no-deep-merge |
| LA-026-08 | media | Considerar — afecta IntegrationTestBase children | Implementación amplia (Sprint 27 BankPortal aborda DEBT-FE-XXX) |

### Output esperado

- `SOFIA-CORE/MANIFEST.la_core_index["LA-CORE-068"..."LA-CORE-072"]` (suma 5 nuevas si todas aceptadas)
- Bump version SOFIA-CORE 2.7.X → 2.8.X o equivalente
- Commit + push en SOFIA-CORE

---

## 2. Acción 2 — Procesar 2 guardrail-proposals (Sección B)

### Inputs

- `bank-portal/docs/guardrail-proposals/GR-SHELL-002.md` (committed en `6a27c6c`)
- `bank-portal/docs/guardrail-proposals/GR-FE-002.md` (committed en `6a27c6c`)

### Acción

NO van por `sofia-contribute.py` (no son LAs). Tratamiento canónico de guardrail nuevo:

1. **GR-SHELL-002** (severidad baja):
   - ADR breve en `SOFIA-CORE/docs/architecture/adr/ADR-S04-XX-gr-shell-002.md`
   - PR a `SOFIA-CORE/MANIFEST.guardrails["GR-SHELL-002"]`
   - Implementación en `SOFIA-CORE/scripts/parser_shell.py` (o equivalente)
   - Tests en `SOFIA-CORE/tests/test_parser_shell.py`
   - Bump version

2. **GR-FE-002** (severidad alta):
   - ADR detallado en `SOFIA-CORE/docs/architecture/adr/ADR-S04-XX-gr-fe-002.md`
   - PR a `SOFIA-CORE/MANIFEST.guardrails["GR-FE-002"]`
   - Update de 2 skills:
     - `SOFIA-CORE/skills/code-reviewer/SKILL.md` (añadir checklist OBS→DEBT bloqueante G-5)
     - `SOFIA-CORE/skills/qa-tester/SKILL.md` (añadir métrica `e2e_ui_driven_count` bloqueante G-6)
   - Bump version (mayor por cambio política)

### Capturado en S04 SOFIA-CORE

> Confirmación PO (2026-05-10): capturado como `S04-CAND-guardrail-promotion-channel` HIGH 2 SP — la propuesta concreta GR-SHELL-002 + GR-FE-002 será evaluada dentro de ese ítem.

---

## 3. Acción 3 — Capturar bug "la-promote no filtra promoted"

### Hallazgo

`bank-portal/.sofia/scripts/la-promote.js` (en bank-portal · réplica del de SOFIA-CORE) presenta un bug:

- **Bug 1**: NO detecta LAs ya promovidas cuyo `session.la.promoted_to != null` y NO está en `MANIFEST.la_core_index` (caso de LA-026-01/02/03 que tienen `promoted_to: LA-CORE-065/066/067` en session, pero el script chequea SOLO MANIFEST de SOFIA-CORE — si el sync MANIFEST↔session no es bidireccional, falla).
- **Bug 2**: el JSON output no preserva el campo `severity` de cada candidate (queda `?` en review).
- **Bug 3** (potencial): si el PO acepta erróneamente una LA ya promovida, podría duplicar entry en MANIFEST.

### Acción

Ya capturado por el PO como **S04-CAND en SOFIA-CORE** (referencia: tu nota en sesión 2026-05-10). Verificar que el ADR/issue cubra los 3 bugs documentados.

---

## 4. Acción 4 — Tier-A sync (DIFERIDA · no bloqueante)

El handoff Step 8 sec.6 mencionaba "S26 preflight Tier-A sync" como acción post-G-9. Inspección reveló que Tier-A es concepto interno del sprint arqueológico SOFIA-CORE S03, no procedimiento estándar bank-portal. **No bloqueante** para cierre S26.

Coordinar con SOFIA Architect cuando S03 SOFIA-CORE alcance fase de aceptación de aportaciones externas.

---

## 5. Reconciliación Step 4 G.1 → estado actual SOFIA-CORE

### Hallazgo

PO observó que SOFIA-CORE registraba al proyecto bank-portal en "Sprint 26 Step 4 Fase G.1" mientras que `bank-portal/.sofia/session.json` está en Step 9 con G-8 aprobado. Desfase de al menos 2 días desde el último commit SOFIA-CORE relacionado con bank-portal (`998f430` 2026-05-08, GR-SHELL-001).

### Acción

PO confirmó (2026-05-10) que reconcilia post-cierre. No bloqueante para G-9 bank-portal.

Sugerencia: si SOFIA-CORE tiene un campo de tracking del estado de cada proyecto, actualizar tras aceptar las 5 LAs con el estado real `Sprint 26 cerrado v1.26.0`.

---

## 6. Resumen de archivos a consumir

| Archivo bank-portal | Para qué |
|---|---|
| `.sofia/la-promotion-request-S26.json` | Input `sofia-contribute.py --accept` (5 LAs) |
| `docs/guardrail-proposals/GR-SHELL-002.md` | Input ADR + PR a MANIFEST.guardrails (S04 SOFIA-CORE) |
| `docs/guardrail-proposals/GR-FE-002.md` | Input ADR + PR a MANIFEST.guardrails + 2 skills update (S04 SOFIA-CORE) |
| `docs/quality/LA-CORE-PROMOTION-REPORT-S26.md` | Resumen ejecutivo del paquete |

---

## 7. Estado bank-portal en momento del handoff

| Campo | Valor |
|---|---|
| current_sprint | 26 |
| current_step | 9 |
| pipeline_step_name | workflow-manager |
| status | in_progress |
| gate_pending | null |
| last_gate_approved | G-8 (HITL-PM Angel · 2026-05-10T11:05Z) |
| HEAD bank-portal | `6a27c6c` (sync origin) |
| Branch | `feature/FEAT-024-sprint26` |
| Tag git v1.26.0 | NO existe aún · creación post-G-9 |
| Merge develop/main | NO ejecutado · post-G-9 |
| LAs S26 generadas | 8 (LA-026-01..08) |
| LAs S26 ya promovidas | 3 (LA-026-01→065, 02→066, 03→067) |
| LAs S26 pendientes promoción | 5 (LA-026-04, 05, 06, 07, 08) |
| Guardrail-proposals deferred | 2 (GR-SHELL-002, GR-FE-002) |

---

*SOFIA Workflow Manager · cierre Sprint 26 bank-portal · handoff post-acciones SOFIA-CORE*
