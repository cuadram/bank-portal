# QA Audit S18-S26 · BankPortal · Banco Meridian

**NC-CMMI-001** · Major · Opened 2026-05-20 by HITL-PO Angel de la Cuadra
**Branch**: `hotfix/qa-audit-s18-s26` (from `develop` HEAD `5f6803f`)
**Scope**: Sprints 18-26 retrospective QA evidence audit + corrective + preventive actions

## Origen

Durante housekeeping post-S26 (commit `5f6803f`) se reproduce empiricamente el patron descrito en DEBT-055:

- `mvn test` sobre HEAD: `PfmControllerIT` ejecuta 1 test de 5 declarados, 0 PASS, 1 ERROR estructural (`Unable to find a @SpringBootConfiguration`).
- Reporte `docs/quality/QA-FEAT-023-sprint25.md` linea 60 firmo "TC-IT-005 PASS — 5 ITs @SpringBootTest" sin que el test sea ejecutable.
- Auditoria extendida revela 11 IT.java huerfanos del lifecycle Maven default (50% de los 22 ITs del proyecto).
- Hallazgo nuevo: `mvn test` arroja 2 Failures + 5 Errors en unit tests no documentados en ningun QA report S18-S26.

## Decisiones HITL-PO 2026-05-20

| ID | Decision | Rationale |
|---|---|---|
| D1 | **(c)** Auditoria completa S18-S26 | Riesgo CMMI no hacerlo > coste de hacerlo |
| D2 | **(b)** NC + LA + corrective action sin reabrir gates firmados | Reabrir gates abre caja de Pandora con cliente |
| D3 | **(a)** Notificacion proactiva Banco Meridian | Transparencia sostiene L3 real |
| D4 | **(a)** Hotfix obligatorio main antes de S27 | No empezar S27 con main roja |
| S1 | **(a)** Branch separada `hotfix/qa-audit-s18-s26` | Aislar audit del trabajo S27 |
| S2 | **(a)** Triage pragmatico (<30 lineas fix vs `@Disabled`+DEBT) | Equilibrio coste/honestidad |

## Practicas CMMI L3 impactadas

- **PP/QPM SP1.2** — Collect and analyze process and product measurements
- **VER SP3.2** — Analyze verification results
- **CM SP3.2** — Perform configuration audits

## Impacto producto

**NULO**. 0 defectos produccion 27 sprints consecutivos confirmado. El gap es de proceso, no de producto.

## Plan ejecucion · 6 fases

| Fase | Objetivo | Salida canonica | Status |
|---|---|---|---|
| 0 | Setup (branch + folder + NC + DEBTs) | Este README + `session.json` | DONE 2026-05-20 |
| 1 | Hotfix tests rotos main (DEBT-061) | `01-hotfix-main-tests.md` + commit | DONE 2026-05-20 (commit 184e185) |
| 2 | Audit retrospectiva S18-S26 | `02-retrospective-matrix.md` + `03-falsified-evidence-list.md` | DONE 2026-05-28 (alcance 11->22) |
| 3 | Fix estructural Maven failsafe (DEBT-062) | `04-build-fix-failsafe.md` + commits | DONE 2026-05-28 (Parte A: 4d8fc59 · Parte B: d38cbe2 · 13 PASS / 9 @Disabled / 0 fail / 0 err) |
| 4 | Politica Step 6 (GR-QA-002 + SKILL update) | `05-corrective-actions.md` + GR-QA-002 en GUARDRAILS.md + SKILL qa-tester | DONE 2026-05-28 |
| 5 | LAs + cierre formal NC | LA-026-09/10/11 + NC closure record | PENDING |
| 6 | Comunicacion cliente Banco Meridian | Email/Confluence draft (firma HITL-PO requerida) | PENDING |

## Deudas registradas

| ID | Priority | Title | Sprint target |
|---|---|---|---|
| DEBT-055 | Critica (was Alta) | Reporte QA con evidencia falsificada (S25 PfmControllerIT) | S27-pre |
| DEBT-056 | Media | maven-surefire 3.2.5 no matchea IT.java (teorico) | S27 |
| DEBT-061 | Critica | Tests rotos main no documentados (2F+5E) | S27-pre |
| DEBT-062 | Critica | 22 ITs huerfanos del lifecycle Maven default (empirico; alcance corregido en F2: 22/100%) | S27-pre |
| DEBT-063 | Alta | Ambiguedad TIN/TAE en AmortizationCalculator (descubierta en F1) | S27-legal-review |
| DEBT-064 | Alta | 4 IT Testcontainers inejecutables (TC 1.20.1 vs daemon 29.4.1) | S27 |
| DEBT-065 | Media | 5 @WebMvcTest mal clasificados como *IT | S27 |

## ECD

NC-CMMI-001 closure: **2026-05-27** (1 semana, 6-8h trabajo concentrado).

## Trazabilidad

- Backup pre-audit: `.sofia/session.json.bak-phase0-audit-2026-05-20`
- Commit Fase 0: (pendiente)
- Commit Fase 1: `184e185`
- Commit Fase 2: `296e372`
- Commit Fase 3 Parte A: (este commit)
- Branch: `hotfix/qa-audit-s18-s26`
- Parent commit: `5f6803f` (chore: housekeeping open_debts post-S26)
