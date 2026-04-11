# SPRINT-018 — Informe de Cierre

**BankPortal · Banco Meridian · Sprint 18 · Step 9**

| Campo | Valor |
|---|---|
| Sprint | 18 |
| Feature | FEAT-016 — Gestión de Tarjetas |
| Período | 2026-04-23 → 2026-05-07 |
| Release | v1.18.0 |
| Estado | ✅ COMPLETADO — Gate 9 aprobado |
| SP entregados | 24 / 24 (100%) |
| SP acumulados | 425 SP (18 sprints) |
| Velocidad media | 23.6 SP/sprint |

---

## Sprint Goal — Cumplimiento ✅

> *Permitir al cliente de Banco Meridian consultar, bloquear, configurar límites y cambiar el PIN de sus tarjetas directamente desde el portal, con trazabilidad completa y cumplimiento PCI-DSS. Sprint incluye la implementación de ShedLock (ADR-028) para blindar el scheduler de transferencias programadas ante scale-out.*

**Cumplido al 100%.** Los 6 User Stories y 4 items de deuda técnica entregados sin defectos.

---

## Pipeline Sprint 18 — Estado final

| Step | Agent | Resultado | Artefacto clave |
|---|---|---|---|
| 1 | Scrum Master | ✅ | SPRINT-018-planning.md |
| 2 | Requirements | ✅ | RF-1601..1606 + RNF cards |
| 3 | Architect | ✅ | HLD-FEAT-016 + LLD backend/frontend |
| 3b | Doc Agent | ✅ | HLD Word + LLD Word (2 docs) |
| 4 | Developer | ✅ | Cards domain completo + Flyway V18/V18b/V18c + ADR-028 |
| 5 | Code Review | ✅ | 5/5 findings resueltos — 0 NCs bloqueantes |
| 5b | Security | ✅ | 0 CVEs — DEBT-031/032 diferidos (no bloqueantes) |
| 6 | QA Tester | ✅ | 101/101 PASS — 86% cob — 0 defectos — PCI validado |
| 7 | DevOps | ✅ | v1.18.0 PRD — ShedLock test — PCI scan limpio |
| 8 | Doc Agent | ✅ | Deliverables CMMI — Gate 8 aprobado |
| **9** | **Workflow Mgr** | **✅** | **Este informe — sprint cerrado** |

---

## Métricas finales Sprint 18

| Métrica | Valor | vs S17 |
|---|---|---|
| SP entregados | 24 | = |
| Tests QA ejecutados | 101 / 101 PASS | +56 (vs S17: 45) |
| Tests unitarios (Developer) | 16 | — |
| Cobertura application | 86% | +1% |
| Defectos producción | 0 | = |
| CVEs críticos/altos/medios | 0 | = |
| NCs Code Review | 5 (0 bloq.) | +2 menores |
| Deuda cerrada | DEBT-026/030/V17c/ADR-028 | 4 items |
| Riesgos cerrados | R-015-01/R-018-01/02 | 3 riesgos |
| PCI-DSS req.3/8/10 | Validados | NUEVO |

---

## Entregables generados — docs/deliverables/sprint-18-FEAT-016/

| # | Documento | Tipo | Estado |
|---|---|---|---|
| 1 | HLD-FEAT-016-Sprint18.docx | Word | ✅ |
| 2 | LLD-016-cards-backend-Sprint18.docx | Word | ✅ |
| 3–10 | Documentos CMMI L3 (8 docs) | Word | ✅ |
| 11–13 | NC Tracker, Decision Log, Quality Dashboard | Excel | ✅ |

---

## Deuda técnica — Estado post Sprint 18

### Cerrada en Sprint 18

| ID | Descripción |
|---|---|
| DEBT-026 | Race condition push subscription limit (5 slots) |
| DEBT-030 | Batch size ilimitado findDueTransfers |
| V17c | Drop auth_plain / p256dh_plain (V18b) |
| ADR-028 | ShedLock implementado |

### Abierta → Sprint 19+

| ID | Descripción | Prioridad | Sprint |
|---|---|---|---|
| DEBT-031 | Rate limiting específico /cards/{id}/pin | Media | S19 |
| DEBT-032 | mTLS CoreBankingAdapter para PRD | Media | Pre-PRD |

---

## Riesgos — Estado post Sprint 18

| ID | Descripción | Estado |
|---|---|---|
| R-015-01 | Scheduler duplicado multi-instancia | ✅ CERRADO — ShedLock ADR-028 |
| R-016-02 | Safari iOS <16.4 sin Web Push | Aceptado (vigente) |
| R-018-01 | IDOR en /cards/{id} | ✅ CERRADO |
| R-018-02 | PAN en claro en logs | ✅ CERRADO |

---

## Métricas acumuladas del proyecto

| Métrica | Valor |
|---|---|
| Sprints completados | 18 |
| SP acumulados | 425 |
| Velocidad media (18 sprints) | 23.6 SP/sprint |
| Releases producción | v1.1.0 → v1.18.0 |
| Defectos en producción (acumulado) | 0 |
| CVEs críticos/altos (histórico) | 0 |
| Cobertura application actual | 86% |
| Tests automatizados totales (acum.) | ~677 |
| CMMI Level | 3 (activo) |
| Features completadas | 16 (FEAT-001..016) |

---

## Próximo sprint

**Sprint 19** · FEAT-017 (por definir con PO) · ~17-20 SP feature + ~4 SP deuda (DEBT-031)
**Fecha estimada:** 2026-05-08 → 2026-05-22

---

*SOFIA Workflow Manager Agent — CMMI PMC SP 1.1 · PP SP 2.1 · Sprint 18 — BankPortal — Banco Meridian — 2026-03-25*
