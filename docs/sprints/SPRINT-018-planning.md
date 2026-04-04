# SPRINT-018 — Planning

**BankPortal · Banco Meridian · Sprint 18**

| Campo | Valor |
|---|---|
| Sprint | 18 |
| Período | 2026-04-23 → 2026-05-07 |
| Feature | FEAT-016 — Gestión de Tarjetas |
| Objetivo | Implementar ciclo completo de gestión de tarjetas: consulta, bloqueo/desbloqueo, límites y cambio de PIN con 2FA, más cierre de deuda técnica (ADR-028 ShedLock, DEBT-026/030, V17c) |
| Velocity objetivo | 24 SP |
| Velocity media (últimos 4 sprints) | 24.0 SP |
| Release objetivo | v1.18.0 |
| Estado | ✅ COMPLETADO — Gate 9 aprobado — 2026-03-25 |

---

## Sprint Goal

> *Permitir al cliente de Banco Meridian consultar, bloquear, configurar límites y cambiar el PIN de sus tarjetas directamente desde el portal, con trazabilidad completa y cumplimiento PCI-DSS. Sprint incluye la implementación de ShedLock (ADR-028) para blindar el scheduler de transferencias programadas ante scale-out.*

---

## Capacidad del equipo

| Rol | Días disponibles | Observaciones |
|---|---|---|
| Backend Dev | 10 días / 40h | Sin ausencias previstas |
| Frontend Dev | 10 días / 40h | Sin ausencias previstas |
| QA Lead | 10 días | Sin ausencias previstas |
| Tech Lead | 10 días | ADR-028 ShedLock — decisión día 1 |
| DevOps | 2 días | Flyway V18 STG + V17c drop columns |

**Capacidad neta efectiva:** ~32h backend + ~32h frontend (tras ceremonias y buffer 10%)

---

## Distribución de capacidad

| Bloque | Items | SP | % Capacidad |
|---|---|---|---|
| Deuda técnica (S1 prioridad) | ADR-028 + DEBT-030 + DEBT-026 + V17c | 7 SP | 29% |
| FEAT-016 | US-1601 → US-1606 | 17 SP | 71% |
| **TOTAL** | | **24 SP** | 100% |

---

## Backlog del sprint

| # | ID | Tipo | Título | SP | Prioridad | Semana |
|---|---|---|---|---|---|---|
| 1 | ADR-028 | Tech Debt | Implementar ShedLock scheduler multi-instancia | 3 | MUST — R-015-01 Nivel 3 | S1 día 1 |
| 2 | DEBT-030 | Tech Debt | Paginar `findDueTransfers` en batches de 500 | 2 | Media | S1 |
| 3 | DEBT-026 | Tech Debt | Race condition push subscription limit (5 slots) | 1 | Baja | S1 |
| 4 | V17c | Tech Debt | Drop `auth_plain` / `p256dh_plain` — Flyway V18b | 1 | Media | S2 (tras validar) |
| 5 | US-1601 | Feature | Modelo datos `cards` + Flyway V18 | 2 | Must Have | S1 día 1 |
| 6 | US-1602 | Feature | Consulta de tarjetas y detalle | 3 | Must Have | S1 |
| 7 | US-1603 | Feature | Bloqueo / desbloqueo con 2FA | 3 | Must Have | S1–S2 |
| 8 | US-1604 | Feature | Gestión de límites de tarjeta | 3 | Must Have | S2 |
| 9 | US-1605 | Feature | Cambio de PIN con 2FA | 3 | Must Have | S2 |
| 10 | US-1606 | Feature | Frontend Angular — gestión completa tarjetas | 3 | Must Have | S2 |
| | | | **TOTAL** | **24** | | |

---

## Distribución temporal

### Semana 1 (días 1–5)

| Día | Actividad |
|---|---|
| Día 1 | ADR-028 ShedLock (Tech Lead). Flyway V18 US-1601 (bloqueante). DEBT-030 paginación scheduler. |
| Días 2–3 | DEBT-026 race condition push. US-1602 consulta tarjetas backend + API. |
| Días 4–5 | US-1603 bloqueo/desbloqueo backend. Inicio US-1604 límites. |

### Semana 2 (días 6–10)

| Día | Actividad |
|---|---|
| Días 6–7 | US-1604 límites completo. US-1605 cambio PIN. |
| Días 8–9 | US-1606 Frontend Angular. V17c drop columns (tras confirmación DevOps). |
| Día 10 | QA Gate. Code Review. DevOps. Cierre. |

---

## ADRs pendientes de decisión en Planning

| ADR | Pregunta | Responsable | Deadline |
|---|---|---|---|
| ADR-028 | ¿ShedLock con Redis (ya disponible) o tabla JDBC? Redis → menor latencia. JDBC → sin dep. extra. | Tech Lead | Día 1 S1 |
| ADR-029 | ¿PIN se gestiona via core bancario existente o mock en STG? | Tech Lead + PO | Día 1 S1 |

---

## Criterios DoD Sprint 18

- [ ] Flyway V18 aplicada sin errores en STG
- [ ] ShedLock operativo — test de exclusión mutua en multi-instancia documentado
- [ ] PAN enmascarado en todos los logs (PCI-DSS 4.0 req. 3)
- [ ] `findDueTransfers` paginado — 0 riesgo OOM
- [ ] API tarjetas documentada en OpenAPI
- [ ] Cobertura application ≥ 80%
- [ ] 0 CVEs críticos/altos
- [ ] Frontend WCAG 2.1 AA
- [ ] Deliverables CMMI L3 generados (sprint-18-FEAT-016/)

---

*SOFIA Scrum Master Agent — Sprint 18 Planning — CMMI PP SP 2.1 · PMC SP 1.1*
*BankPortal — Banco Meridian — 2026-03-25*
