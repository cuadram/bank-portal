# SPRINT-017 — Informe de Cierre

**BankPortal · Banco Meridian · Sprint 17 · Step 9**

| Campo | Valor |
|---|---|
| Sprint | 17 |
| Feature | FEAT-015 — Transferencias Programadas y Recurrentes |
| Período | 2026-04-08 → 2026-04-22 |
| Release | v1.17.0 |
| Estado | ✅ COMPLETADO — Gate 9 aprobado |
| SP entregados | 24 / 24 (100%) |
| SP acumulados | 401 SP (17 sprints) |
| Velocidad media | 23.6 SP/sprint |

---

## Sprint Goal — Cumplimiento ✅

> *Permitir al cliente de Banco Meridian automatizar transferencias periódicas configurándolas una sola vez desde el portal, con ejecución automática garantizada y notificación push en cada ciclo.*

**Cumplido al 100%.**

---

## Pipeline Sprint 17 — Estado final

| Step | Agent | Resultado | Artefacto clave |
|---|---|---|---|
| 1 | Scrum Master | ✅ | SPRINT-017-planning.md |
| 2 | Requirements | ✅ | SRS-FEAT-015.md |
| 3 | Architect | ✅ | HLD-FEAT-015 + LLD backend/frontend |
| 3b | Doc Agent | ✅ | HLD/LLD Word (3 docs) |
| 4 | Developer | ✅ | 22 ficheros Java + Flyway V17+V17b |
| 5 | Code Review | ✅ | 0 NCs bloqueantes — 3 menores resueltas |
| 5b | Security | ✅ | 0 CVEs — DEBT-028 cerrada |
| 6 | QA Tester | ✅ | 45/45 PASS — 615 tests — 85% cov |
| 7 | DevOps | ✅ | v1.17.0 PRD — Load test SSE 512 conc. |
| 8 | Doc Agent | ✅ | 10 Word + 3 Excel (13 deliverables) |
| 9 | Workflow Mgr | ✅ | Este informe — sprint cerrado |

---

## Métricas finales

| Métrica | Valor | vs S16 |
|---|---|---|
| SP entregados | 24 | = |
| Tests automatizados | 615 | +62 |
| Cobertura application | 85% | +1% |
| Defectos producción | 0 | = |
| CVEs críticos/altos/medios | 0 | = |
| NCs Code Review | 3 (0 bloq.) | +1 menor |
| Deuda cerrada | DEBT-027/028/029 | 3 items |
| Riesgos cerrados | R-016-01, R-016-05 | 2 riesgos |

---

## Deuda abierta → Sprint 18

| ID | Descripción | Prioridad |
|---|---|---|
| DEBT-026 | Race condition push subscription limit | Baja |
| DEBT-030 | Batch size ilimitado findDueTransfers (nuevo) | Media |
| V17c | Eliminar auth_plain/p256dh_plain | Media |
| ADR-026 | ShedLock multi-instancia (implementar) | Alta |

---

## Próximo sprint

**Sprint 18** · FEAT-016 (por definir con PO) · ~17 SP feature + ~7 SP deuda
**Fecha estimada:** 2026-05-06 → 2026-05-20

---

*SOFIA Workflow Manager Agent — CMMI PMC SP 1.1 · Sprint 17 — BankPortal — Banco Meridian — 2026-03-24*
