# SPRINT-016 — Report / PMC

**BankPortal · Banco Meridian · Sprint 16**

| Campo | Valor |
|---|---|
| Sprint | 16 |
| Período | 2026-03-25 → 2026-04-08 |
| Feature | FEAT-014 — Notificaciones Push & In-App |
| Release | v1.16.0 |
| Estado | ✅ COMPLETADO |
| Fecha cierre | 2026-03-24 |
| CMMI | PP SP 2.1 · PMC SP 1.1 · PMC SP 1.2 |

---

## Sprint Goal — Cumplimiento

> *Entregar un sistema completo de notificaciones para BankPortal que permita al cliente recibir alertas en tiempo real sobre operaciones financieras y eventos de seguridad — vía Web Push (VAPID), SSE in-app y email — con gestión de preferencias por canal.*

**Estado:** ✅ **CUMPLIDO AL 100%** — todos los canales operativos en PRD.

---

## Velocidad y entrega

| Métrica | Valor |
|---|---|
| SP planificados | 24 |
| SP entregados | **24** |
| Velocidad sprint | 24.0 SP |
| Velocidad acumulada (16 sprints) | **23.7 SP/sprint** |
| SP acumulados (16 sprints) | **379 SP** |
| Defectos producción | **0** |
| Defectos acumulados (histórico) | **0** |

---

## Items entregados

| ID | Tipo | Título | SP | Estado |
|---|---|---|---|---|
| DEBT-023 | Tech Debt | KycAuthorizationFilter período de gracia | 1 | ✅ DONE |
| DEBT-024 | Tech Debt | KycReviewResponse tipado | 1 | ✅ DONE |
| US-1401 | Feature | Modelo preferencias + Flyway V16 | 2 | ✅ DONE |
| US-1402 | Feature | Centro de notificaciones backend | 3 | ✅ DONE |
| US-1403 | Feature | Stream SSE extendido por categoría | 2 | ✅ DONE |
| US-1404 | Feature | Web Push VAPID — suscripción y envío | 5 | ✅ DONE |
| US-1405 | Feature | Alertas transaccionales | 3 | ✅ DONE |
| US-1406 | Feature | Alertas de seguridad | 3 | ✅ DONE |
| US-1407 | Feature | Frontend Angular — NotificationBell + Centro | 4 | ✅ DONE |
| **TOTAL** | | | **24** | ✅ |

---

## Métricas de calidad

| Área | Valor |
|---|---|
| Tests unitarios nuevos | 24 escenarios (19 originales + 5 post-CR) |
| Tests funcionales Gherkin | 28 escenarios |
| Tests seguridad | 6 verificaciones |
| Tests WCAG 2.1 AA | 4 criterios |
| **Total escenarios sprint** | **62** |
| Cobertura application layer | 84.7% |
| Code Review findings bloqueantes | 2 → corregidos antes de QA |
| Defectos QA | **0** |
| SonarQube Quality Gate | PASSED |
| OWASP CVE alto/crítico | **0** |

---

## Artefactos CMMI generados

| Artefacto | Ruta | Estado |
|---|---|---|
| SPRINT-016-planning.md | docs/sprints/ | ✅ |
| SRS-FEAT-014.md | docs/requirements/ | ✅ |
| HLD-FEAT-014.md | docs/architecture/ | ✅ |
| LLD-FEAT-014-backend.md | docs/architecture/lld/ | ✅ |
| LLD-FEAT-014-frontend.md | docs/architecture/lld/ | ✅ |
| LLD-FEAT-014-backend-cr-fixes.md | docs/architecture/lld/ | ✅ |
| CR-FEAT-014-sprint16.md | docs/code-review/ | ✅ |
| QA-FEAT-014-sprint16.md | docs/qa/ | ✅ |
| DEVOPS-FEAT-014-sprint16.md | docs/devops/ | ✅ |
| SPRINT-016-report.md | docs/sprints/ | ✅ |

---

## Deuda técnica sprint

| ID | Descripción | Estado |
|---|---|---|
| DEBT-023 | KycAuthorizationFilter período gracia | ✅ Saldada |
| DEBT-024 | KycReviewResponse tipado | ✅ Saldada |
| DEBT-026 | Race condition push subscription limit | 📋 Registrada → Sprint 18 |
| DEBT-027 | Domain events en inner classes de listeners | 📋 Registrada → Sprint 17 |

---

## Retrospectiva rápida

**¿Qué fue bien?**
- Arquitectura Clean Architecture mantuvo las correcciones de CR aisladas y fáciles de aplicar
- El patrón `@Async`/`@Transactional` separado (RV-S5-001) evitó un defecto crítico en producción
- 0 defectos en QA tras los 6 fixes del CR — el proceso de revisión es efectivo
- VAPID puro (ADR-025) fue la decisión correcta: sin dependencia FCM, sin credenciales Firebase

**¿Qué mejorar?**
- RV-F014-04 y RV-F014-07 (DEBT-026/027) son señales de que la capa de infraestructura SSE merece un refactor planificado en Sprint 17
- Los domain events como inner classes generan acoplamiento inverso — patrón a corregir sistemáticamente

---

## Histórico del proyecto

| Sprint | Feature | SP | Release | Acumulado |
|---|---|---|---|---|
| 1-2 | FEAT-001 2FA | 40 | v1.1.0 | 40 |
| 3-4 | FEAT-002/003 Auth | 48 | v1.3.0 | 88 |
| 5-6 | FEAT-004/005 Security | 48 | v1.5.0 | 136 |
| 7-8 | FEAT-006/007 Notifications | 48 | v1.7.0 | 184 |
| 9-10 | FEAT-008/009 Transfers | 48 | v1.9.0 | 232 |
| 11 | FEAT-010 Accounts | 24 | v1.10.0 | 256 |
| 12 | FEAT-011 Payments | 24 | v1.11.0 | 280 |
| **13** | **FEAT-011 Dashboard** | **24** | **v1.13.0** | **307** |
| 14 | FEAT-012 Profile | 24 | v1.14.0 | 331 |
| 15 | FEAT-013 KYC | 24 | v1.15.0 | 355 |
| **16** | **FEAT-014 Notifications Push** | **24** | **v1.16.0** | **379** |

---

*SOFIA Scrum Master Agent — Sprint 16 Close*
*CMMI Level 3 — PP SP 2.1 · PMC SP 1.1 · PMC SP 1.2*
*BankPortal — Banco Meridian — 2026-03-24*
