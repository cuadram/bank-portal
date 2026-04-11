# SPRINT-017 — Planning

**BankPortal · Banco Meridian · Sprint 17**

| Campo | Valor |
|---|---|
| Sprint | 17 |
| Período | 2026-04-08 → 2026-04-22 |
| Feature | FEAT-015 — Transferencias Programadas y Recurrentes |
| Objetivo | Motor de transferencias automatizadas con scheduler idempotente, recurrentes configurables y gestión Angular completa, cerrando deuda técnica DEBT-027/028/029 y validando carga SSE |
| Velocity objetivo | 24 SP |
| Velocity media (últimos 4 sprints) | 24.0 SP |
| Release objetivo | v1.17.0 |
| Estado | 🟡 PLANNING |

---

## Sprint Goal

> *Permitir al cliente de Banco Meridian automatizar transferencias periódicas — alquiler, cuotas, ahorros — configurándolas una sola vez desde el portal, con ejecución automática garantizada, notificación push en cada ciclo y control total desde la app Angular. Sprint incluye cierre de deuda de seguridad DEBT-028 (CVSS 4.1) y validación de carga SSE.*

---

## Capacidad del equipo

| Rol | Días disponibles | Observaciones |
|---|---|---|
| Backend Dev | 10 días / 40h | Sin ausencias previstas |
| Frontend Dev | 10 días / 40h | Sin ausencias previstas |
| QA Lead | 10 días | Sin ausencias previstas |
| Tech Lead | 10 días | ADR-026 y ADR-027 requieren decisión S1 día 1 |
| DevOps | 2 días | Load test SSE (R-016-05) en S2 |

**Factores de reducción:**
- Ceremonias (planning, review, retro, daily): −4h/persona
- Buffer impedimentos (10%): −4h/persona
- **Capacidad neta efectiva:** ~32h backend + ~32h frontend

**Velocity de referencia:** 24 SP (constante últimos 4 sprints)

---

## Distribución de capacidad

| Bloque | Items | SP | % Capacidad |
|---|---|---|---|
| Deuda técnica (S1 prioridad) | DEBT-027 + DEBT-028 + DEBT-029 | 6 SP | 25% |
| Load test SSE | R-016-05 | 1 SP | 4% |
| FEAT-015 | US-1501 → US-1505 | 17 SP | 71% |
| **TOTAL** | | **24 SP** | 100% |

---

## Backlog del sprint — Items seleccionados

| # | ID | Tipo | Título | SP | Prioridad | Semana |
|---|---|---|---|---|---|---|
| 1 | DEBT-028 | Tech Debt | Cifrar `push_subscriptions.auth` + `p256dh` AES-256-GCM | 3 | **MUST — CVSS 4.1** | S1 |
| 2 | DEBT-027 | Tech Debt | Domain events a paquetes de dominio correctos | 2 | Media | S1 |
| 3 | DEBT-029 | Tech Debt | Footer email RGPD Art.7 — enlace preferencias | 1 | Compliance | S1 |
| 4 | US-1501 | Feature | Modelo de datos + Flyway V17 | 2 | Must Have | S1 día 1 |
| 5 | US-1502 | Feature | Programar transferencia a fecha futura | 4 | Must Have | S1 |
| 6 | US-1503 | Feature | Transferencias recurrentes + `NextExecutionDateCalculator` | 4 | Must Have | S1–S2 |
| 7 | US-1504 | Feature | Motor scheduler `@Scheduled` + idempotencia + gestión fallos | 4 | Must Have | S2 |
| 8 | US-1505 | Feature | Frontend Angular — gestión programadas | 3 | Must Have | S2 |
| 9 | R-016-05 | QA/DevOps | Load test SSE — >500 conexiones concurrentes | 1 | Importante | S2 |
| | | | **TOTAL** | **24** | | |

---

## Distribución temporal detallada

### Semana 1 (días 1–5)

| Día | Actividad |
|---|---|
| Día 1 | **ADR-026 + ADR-027** — decisiones Tech Lead antes de cualquier código. **Flyway V17** (US-1501 bloqueante). DEBT-028 arranca (3 SP — máxima prioridad). |
| Días 2–3 | DEBT-027 domain events (2 SP). DEBT-029 footer email (1 SP). US-1502 backend `CreateScheduledTransferUseCase` (4 SP). |
| Días 4–5 | US-1503 `NextExecutionDateCalculator` + `UpdateScheduledTransferUseCase` (4 SP, span S1→S2). |

### Semana 2 (días 6–10)

| Día | Actividad |
|---|---|
| Días 6–7 | US-1503 cierre + US-1504 `ScheduledTransferJobService` + `ExecuteScheduledTransferUseCase` (4 SP). |
| Días 8–9 | US-1505 Frontend Angular — wizard + lista + historial (3 SP). R-016-05 load test SSE (1 SP). |
| Día 10 | QA integral FEAT-015. Code Review. Freeze de código. Preparación release v1.17.0. |

---

## Criterios de entrada (DoR verificados)

- [x] FEAT-015 backlog completo con 5 US y criterios Gherkin (docs/backlog/FEAT-015.md)
- [x] DEBT-027/028/029 especificadas en docs/backlog/DEBT-026-029-sprint16.md
- [x] Dependencias FEAT-008/009/014 operativas en develop
- [x] Flyway V16 mergeada — base limpia para V17
- [x] ADR-026 y ADR-027 abiertos — decisión requerida día 1
- [x] R-015-01 (scheduler multi-instancia) mitigado-diferido documentado
- [x] Aprobación Product Owner: ⏳ **Gate 1 pendiente**

---

## Criterios de salida (DoD Sprint 17)

- [ ] Flyway V17 aplicada sin errores en STG
- [ ] `NextExecutionDateCalculator` — 100% cobertura de ramas
- [ ] Scheduler idempotente verificado con test IT (doble ejecución no duplica)
- [ ] DEBT-028 cerrada — `push_subscriptions.auth` cifrado en reposo
- [ ] R-016-05 — load test SSE ejecutado y resultado documentado
- [ ] Cobertura global application ≥ 80%
- [ ] Zero CVEs críticos en security scan
- [ ] ADR-026 y ADR-027 firmados
- [ ] Notificaciones push/email verificadas en ejecución exitosa y fallida
- [ ] Frontend WCAG 2.1 AA verificado
- [ ] Deliverables CMMI generados en docs/deliverables/sprint-17-FEAT-015/
- [ ] Pipeline Jenkins verde en STG
- [ ] Demo aprobada por Product Owner (Gate 9)

---

## Riesgos del sprint

| ID | Descripción | P | I | Nivel | Plan de respuesta |
|---|---|---|---|---|---|
| R-015-01 | Scheduler en múltiples instancias si hay scale-out | M | A | 3 | ShedLock diferido S18 — single instance S17. Documentado ADR-026. |
| R-015-02 | `NextExecutionDateCalculator` incorrecto en meses cortos | M | M | 2 | Test exhaustivo: feb/29, meses 30 días, bisiesto — 100% branches |
| R-016-01 | push_subscriptions.auth en claro (CVSS 4.1) | M | A | 3 | DEBT-028 es MUST — bloquea el sprint si no se cierra en S1 |
| R-016-05 | >500 SSE concurrentes sin validar | B | M | 2 | Load test planificado S2 día 8–9 con JMeter/Gatling |
| R-015-03 | Core bancario lento degrada batch scheduler | B | M | 2 | Circuit breaker FEAT-009 ya activo — monitorizar duración job |

---

## ADRs pendientes de decisión — Día 1

| ADR | Pregunta | Deadline |
|---|---|---|
| ADR-026 | ¿ShedLock en S17 o diferir a S18? | Día 1 — Tech Lead |
| ADR-027 | ¿Permitir edición de importe en recurrente activa (con OTP)? | Día 1 — Tech Lead + PO |

**Recomendación SOFIA:**
- ADR-026 → diferir ShedLock a S18 (single instance confirmado). Documentar riesgo R-015-01.
- ADR-027 → no permitir edición de importe. Cancelar + crear nueva. Más simple y más trazable (PSD2 Art.94).

---

## Gestión de gates

| Gate | Step | Aprobador | SLA | Trigger |
|---|---|---|---|---|
| Gate 1 | Scrum Master | Product Owner | 24h | Este planning aprobado |
| Gate 2 | Requirements | Product Owner | 24h | SRS-FEAT-015 entregado |
| Gate 3 | Architect | Tech Lead | 48h | HLD + LLD entregados |
| Gate 5 | Code Review | Tech Lead | 24h | 0 NCs bloqueantes |
| Gate 5b | Security | Auto-bloqueante | — | 0 CVEs críticos |
| Gate 6 | QA | QA Lead + PO | 48h | 0 defectos críticos |
| Gate 7 | DevOps | Release Manager | 24h | Pipeline STG verde |
| Gate 8 | Doc Agent | PM | 24h | Deliverables completos |
| Gate 9 | Workflow Mgr | Cliente | 48h | Demo aprobada |

---

## Métricas objetivo

| Métrica | Objetivo | Referencia Sprint 16 |
|---|---|---|
| SP entregados | 24 | 24 ✅ |
| Cobertura application | ≥ 80% | 84% |
| Defectos producción | 0 | 0 ✅ |
| Tests nuevos estimados | ~45 | +62 (S16) |
| NCs Code Review | ≤ 3 | 2 (S16) |
| CVEs críticos | 0 | 0 ✅ |

---

## Proyección de velocidad acumulada

| Sprints | SP acumulados |
|---|---|
| Hasta Sprint 16 | 377 SP |
| Sprint 17 (proyección) | **401 SP** |
| Sprint 20 (proyección a ~24 SP/sprint) | ~473 SP |

---

*SOFIA Scrum Master Agent — Sprint 17 Planning*
*CMMI Level 3 — PP SP 2.1 · PP SP 2.2 · PMC SP 1.1*
*BankPortal — Banco Meridian — 2026-03-24*
