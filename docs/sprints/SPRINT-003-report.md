# Sprint Report — Sprint 3 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | Sprint 3 |
| **Período** | 2026-04-14 → 2026-04-25 |
| **SM** | SOFIA SM Agent |
| **Fecha cierre** | 2026-04-25 |
| **Release** | v1.2.0 — Go/No-Go APPROVED |

## Sprint Goal
> **"Iniciar FEAT-002: sesiones activas visibles, revocación remota con OTP y control de concurrencia. Resolver DEBT-003 (REST semántico DELETE→POST)."**

**Estado: ✅ ALCANZADO**

---

## Resumen de resultados

| Métrica | Planificado | Real | Variación |
|---|---|---|---|
| Story Points | 24 | 24 | 0 |
| US completadas | 5 (US-101/102/103/104/105) | 5 | ✅ 0 |
| DEBT resueltas | 1 (DEBT-003) | 1 | ✅ 0 |
| NCs Code Review | 0 | 0 | ✅ |
| Defectos QA | 0 | 0 | ✅ |
| Warnings QA (no bloqueantes) | — | 2 | Registrados DEBT-004/005 |
| Gates HITL completados | 6 | 6 | ✅ 100% |
| Ciclos CR | 1 | 1 | ✅ |
| PCI-DSS 4.0 req. 8.2/8.3/8.6 | CUMPLE | ✅ CUMPLE | — |
| WCAG 2.1 AA | 76 checks | 76/76 PASS | ✅ |

## Velocidad

| Tipo | SP planificados | SP completados |
|---|---|---|
| New Feature (FEAT-002) | 22 | 22 |
| Tech Debt (DEBT-003) | 2 | 2 |
| **Total Sprint 3** | **24** | **24** |

- **Velocidad Sprint 3:** 24 SP
- **Velocidad media acumulada (3 sprints):** 24 SP/sprint — **constante**

## Estado por ítem

| ID | Título | SP | Estado |
|---|---|---|---|
| DEBT-003 | DELETE /deactivate → POST REST semántico | 2 | ✅ DONE |
| US-101 | Ver sesiones activas con metadata | 5 | ✅ DONE |
| US-102 | Cerrar sesión remota + Redis blacklist | 5 | ✅ DONE |
| US-103 | Timeout de inactividad configurable | 3 | ✅ DONE |
| US-104 | Control de sesiones concurrentes LRU | 5 | ✅ DONE |
| US-105 | Notificaciones email por login inusual | 4 | ✅ DONE |

## Gates completados en Sprint 3

| Gate | Artefacto | Aprobador | Estado |
|---|---|---|---|
| 🔒 Sprint Planning | SPRINT-003-planning.md | Product Owner | ✅ APPROVED |
| 🔒 HLD/LLD FEAT-002 | FEAT-002-HLD.md + 2 LLD + 2 ADR | Tech Lead | ✅ APPROVED |
| 🔒 Code Review | FEAT-002-developer-output.md | Tech Lead | ✅ APPROVED (1 ciclo) |
| 🔒 QA Lead | QA-FEAT-002-sprint3.md | QA Lead | ✅ APPROVED |
| 🔒 QA Product Owner | QA-FEAT-002-sprint3.md | Product Owner | ✅ APPROVED |
| 🔒 Go/No-Go PROD v1.2.0 | RELEASE-v1.2.0.md | Release Manager | ✅ APPROVED |

## Acciones de mejora Sprint 2 — verificación de efectividad (ACT-10)

| Acción | Efectividad |
|---|---|
| ACT-07 TOTP_TEST_SECRET Jenkins | ✅ Operativo — 10/10 E2E Playwright PASS en CI |
| ACT-08 DEBT-003 REST semántico | ✅ Completado — POST /deactivate activo, DELETE deprecated |
| ACT-09 OpenAPI RS256 | ✅ Operativo — spec v1.1.0 coherente con impl. Sprint 2 |
| ACT-10 Ritual kick-off 5 min | ✅ Ejecutado — revisión efectividad al inicio del sprint |
| ACT-11 DoD OpenAPI obligatoria | ✅ Cumplida — openapi-2fa.yaml actualizado a v1.2.0 en Sprint 3 |

## Risk Register — cambios Sprint 3

| ID | Riesgo | Estado |
|---|---|---|
| NEW-R-003 | TOTP_TEST_SECRET no configurado en CI | ✅ CERRADO — operativo desde día 1 |
| R-F2-001 | Proveedor SMTP no disponible en STG | ✅ CERRADO — Mailtrap configurado |
| R-F2-002 | Falsos positivos en detector de dispositivos | ✅ MITIGADO — tasa < 0.5% en STG |
| R-F2-003 | Token blacklist Redis crece sin control | ✅ CERRADO — TTL automático verificado |
| R-F2-004 | Enlace "No fui yo" explotable DoS | ✅ CERRADO — HMAC + TTL 24h + one-time use |

## Deuda técnica generada Sprint 3

| ID | Descripción | Impacto | Sprint objetivo |
|---|---|---|---|
| DEBT-004 | `DeviceFingerprintService` — migrar a ua-parser-java | Bajo | Sprint 4 |
| DEBT-005 | `DELETE /deactivate` sin header `Deprecation: true` | Bajo | Sprint 4 |

## Métricas acumuladas FEAT-002 (Sprint 3)

| Métrica | Valor |
|---|---|
| Sprints ejecutados | 1 (Sprint 3) |
| SP completados | 24/24 |
| Defectos QA | 0 |
| NCs Code Review | 0 (0 mayores, 0 menores) |
| Gates HITL | 6/6 completados |
| PCI-DSS req. 8.2/8.3/8.6 | ✅ CUMPLE |
| WCAG 2.1 AA | 76/76 PASS |
| Archivos implementados | 31 (24 Java + 7 Angular) |
| Tests escritos | 47 (35 Java + 12 Angular) |

## Métricas acumuladas del proyecto (3 sprints)

| Métrica | Total |
|---|---|
| Sprints completados | 3 |
| SP totales | 72/72 (100%) |
| Features cerradas | FEAT-001 (40 SP) + FEAT-002 en curso |
| Velocidad media | 24 SP/sprint — constante |
| Defectos QA acumulados | 0 |
| NCs CR acumuladas | 2 (S1) + 0 (S2) + 0 (S3) = 2 cerradas |
| Gates HITL totales | 16 completados |
| Releases PROD | v1.0.0 · v1.1.0 · v1.2.0 |

---

*SOFIA SM Agent — 2026-04-25 · Sprint 3 CLOSED · v1.2.0 en PROD*
