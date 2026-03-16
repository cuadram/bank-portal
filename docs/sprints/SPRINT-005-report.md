# Sprint Report — Sprint 5 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | 5 |
| **Período** | 2026-05-12 → 2026-05-23 |
| **SM** | SOFIA SM Agent |
| **Fecha cierre** | 2026-05-23 |
| **Release** | v1.4.0 — Go/No-Go APPROVED |

## Sprint Goal
> **"Implementar DEBT-006 (clave dual HMAC), cerrar gap documental FEAT-003 y arrancar FEAT-004 (Centro de Notificaciones) con US-301/302/303/304/305."**

**Estado: ✅ ALCANZADO**

---

## Resumen de resultados

| Métrica | Planificado | Real | Variación |
|---|---|---|---|
| Story Points | 24 | 24 | ✅ 0 |
| US completadas | 5 (US-301/302/303/304/305) | 5 | ✅ |
| DEBT resueltas | 1 (DEBT-006) | 1 | ✅ |
| Docs gap cerradas | 3 (OpenAPI v1.3.0 + 2 LLD) | 3 | ✅ ACT-18/19/20 |
| NCs Code Review (mayores) | 0 | 0 | ✅ × 4 sprints |
| NCs Code Review (menores) | 0 | 2 → resueltas en el ciclo | ✅ |
| Defectos QA | 0 | 0 | ✅ × 5 sprints |
| Warnings QA | — | 1 (WARN-F4-001) | No bloqueante |
| Gates HITL completados | 6 | 6 | ✅ 100% |
| Ciclos CR | 1 | 1 | ✅ |
| WCAG 2.1 AA | 88 checks | 88/88 PASS | ✅ |
| ADR-009 clave dual | CUMPLE | ✅ | — |
| OpenAPI v1.3.0 | CUMPLE | ✅ ACT-19/20 | — |

## Velocidad

| Tipo | SP planificados | SP completados |
|---|---|---|
| New Feature (FEAT-004 US-301→305) | 16 | 16 |
| Tech Debt (DEBT-006) | 5 | 5 |
| Documental (OpenAPI + 2 LLD) | 3 | 3 |
| **Total Sprint 5** | **24** | **24** |

**Velocidad Sprint 5:** 24 SP
**Velocidad media acumulada (5 sprints): 24 SP/sprint — constante × 5° sprint consecutivo**

## Estado por ítem

| ID | Título | SP | Estado |
|---|---|---|---|
| ACT-19 | OpenAPI v1.3.0 — endpoints FEAT-003 documentados | 1 | ✅ DONE — día 1 |
| LLD-003 | LLD-backend + LLD-frontend trusted-devices | 2 | ✅ DONE — ACT-18 |
| DEBT-006 | Clave dual HMAC rotación sin impacto UX | 5 | ✅ DONE — ADR-009 |
| US-301 | Historial paginado de notificaciones (90 días + filtros) | 4 | ✅ DONE |
| US-302 | Marcar leídas — individual O(1) IDOR-safe + todas | 2 | ✅ DONE |
| US-303 | Badge no leídas en header (Signal Store reactivo) | 3 | ✅ DONE |
| US-304 | Deep-links a sesión / dispositivo desde notificación | 4 | ✅ DONE |
| US-305 | SSE tiempo real + toast 8s + polling fallback 60s | 3 | ✅ DONE |

## Gates completados Sprint 5

| Gate | Artefacto | Aprobador | Estado |
|---|---|---|---|
| 🔒 Sprint Planning | SPRINT-005-planning.md | Product Owner | ✅ |
| 🔒 ADR-009 + LLD-003 | ADR-009 + LLD-003 backend+frontend | Tech Lead | ✅ |
| 🔒 Code Review | CR-FEAT-004-sprint5.md (2 NCs menores resueltas) | Tech Lead | ✅ |
| 🔒 QA Lead | QA-FEAT-004-sprint5.md | QA Lead | ✅ |
| 🔒 QA Product Owner | QA-FEAT-004-sprint5.md | Product Owner | ✅ |
| 🔒 Go/No-Go PROD v1.4.0 | RELEASE-v1.4.0.md | Release Manager | ✅ |

## Acciones de mejora Sprint 4 — verificación de efectividad (ACT-10)

| Acción | Efectividad |
|---|---|
| ACT-17 DEBT-006 clave dual | ✅ Implementado y verificado en 5 escenarios E2E — R-S5-001 cerrado |
| ACT-18 Gate arquitectura LLD obligatorio | ✅ LLD-003 aprobado antes del primer commit — 0 NCs por gap documental |
| ACT-19 OpenAPI v1.3.0 día 1 | ✅ Actualizado antes del primer commit de código — ACT-20 verificable |
| ACT-20 CR checklist OpenAPI | ✅ Code Reviewer verificó OpenAPI explícitamente — documentado en CR report |
| ACT-21 ADR-005 movido a adr/ | ✅ Ejecutado en retro Sprint 4 — directorio adr/ completo ADR-001→009 |

**Efectividad ACT Sprint 4: 5/5 (100%)** — tercer sprint consecutivo con 100% de efectividad.

## Risk Register — cambios Sprint 5

| ID | Riesgo | Estado |
|---|---|---|
| R-S5-001 | DEBT-006 rotación HMAC invalida tokens | ✅ CERRADO — clave dual operativa |
| R-S5-002 | OpenAPI desactualizada en PROD | ✅ CERRADO — ACT-19 día 1 |
| R-S5-003 | FEAT-004 no definida | ✅ CERRADO — definida antes del planning |
| R-F4-001 | SSE threads en servidor | ✅ CERRADO — límite 1 por usuario + cleanup callbacks |
| R-F4-002 | Tabla notifications sin límite | ✅ CERRADO — @Scheduled cleanup 02:30 UTC |
| R-F4-003 | Badge incorrecto si SSE cae | ✅ CERRADO — polling fallback 60s |
| R-S5-004 | HMAC_KEY_PREVIOUS no vaciada tras 30 días | ⚠️ ABIERTO — monitorizar GRACE_VERIFY en audit_log |

## Deuda técnica generada Sprint 5

| ID | Descripción | Impacto | Sprint |
|---|---|---|---|
| DEBT-007 | Configuración CORS/Spring Security para SSE con CDN/proxy en PROD | Bajo-Medio | Sprint 6 |

## Métricas acumuladas del proyecto (5 sprints)

| Métrica | Total |
|---|---|
| Sprints completados | 5 |
| SP totales | 120/120 (100%) |
| Velocidad media | 24 SP/sprint — constante × 5 |
| Defectos QA acumulados | 0 |
| NCs CR mayores acumuladas | 2 (S1) → 0 (S2→S5) |
| NCs CR menores (S5) | 2 — resueltas en el mismo ciclo |
| Gates HITL totales | 28 completados |
| Releases PROD | v1.0 · v1.1 · v1.2 · v1.3 · v1.4 |
| ADRs generados | ADR-001 → ADR-009 |
| LLDs generados | 6 (backend + frontend × 3 features) |
| Efectividad ACTs retro | 5/5 × 3 sprints consecutivos |

---

*SOFIA SM Agent — 2026-05-23 · Sprint 5 CLOSED · v1.4.0 en PROD*
