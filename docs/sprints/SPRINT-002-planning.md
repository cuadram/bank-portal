# Sprint Planning — Sprint 2 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | Sprint 2 |
| **Período** | 2026-03-30 → 2026-04-10 |
| **SM** | SOFIA SM Agent |
| **Estado** | ACTIVO |

---

## Sprint Goal

> **"FEAT-001 lista para cumplimiento PCI-DSS completo: desactivación 2FA, auditoría trazable, suite E2E automatizada y deuda técnica crítica resuelta — feature 100% entregable al cliente."**

---

## Capacidad del equipo

| Parámetro | Valor |
|---|---|
| Días laborables | 10 |
| Horas/día | 8 |
| Personas | 3 (1 Java Dev, 1 Angular Dev, 1 QA) |
| Capacidad bruta | 240 h |
| Ceremonias (-4h/persona) | -12 h |
| Buffer impedimentos (10%) | -24 h |
| Capacidad neta | 204 h |
| Factor velocidad confirmada Sprint 1 | 24 SP |
| **Capacidad comprometida** | **24 SP** |

---

## Backlog del Sprint 2

| ID | Título | SP | Tipo | Prioridad | Asignado a |
|---|---|---|---|---|---|
| US-004 | Desactivar 2FA con confirmación | 5 | Feature | Should Have | Java Dev + Angular Dev |
| US-005 | Auditoría de eventos 2FA | 5 | Feature | Should Have | Java Dev |
| US-007 | Tests de integración E2E 2FA | 6 | Feature | Must Have | QA |
| DEBT-001 | RateLimiter → Bucket4j + Redis | 4 | Tech Debt | Alto | Java Dev |
| DEBT-002 | JwtService → JJWT RSA-256 | 4 | Tech Debt | Alto | Java Dev |
| **Total** | | **24 SP** | | | |

---

## Orden de ejecución y dependencias

```
US-004 (Desactivar 2FA)     → paralelo con US-005
US-005 (Auditoría)          → paralelo con US-004
DEBT-001 (Redis rate limit) → después de US-004/005 (sin dependencia funcional)
DEBT-002 (JWT RSA-256)      → después de US-004/005 (requiere testing cuidadoso)
US-007 (E2E Playwright)     → al final, cuando US-004/005 estén en DONE
```

---

## Gates HITL previstos en Sprint 2

| Gate | Artefacto | Aprobador | SLA |
|---|---|---|---|
| 🔒 Aprobación Sprint Planning | Este documento | Product Owner | 24 h |
| 🔒 Code Review | Reporte revisión | Tech Lead | 24 h/NC |
| 🔒 QA Acceptance | Test report Sprint 2 | QA Lead + PO | 24 h |
| 🔒 Go/No-Go PROD v1.1.0 | Release notes | Release Manager | 4 h |

---

## Riesgos activos Sprint 2

| ID | Riesgo | Acción |
|---|---|---|
| DEBT-002 | Migración JWT a RSA-256 puede romper sesiones activas | Ventana de mantenimiento coordinada con cliente. Doble secret temporal durante rotación |
| DEBT-001 | Redis como nueva dependencia de infraestructura | Añadir Redis al docker-compose y K8s manifest antes del desarrollo |
| R-008 | Entrega fuera de plazo | Sprint 1 a velocidad 100% — riesgo bajo |

---

*Generado por SOFIA SM Agent — 2026-03-27*
*🔒 GATE: aprobación Product Owner requerida antes de iniciar Sprint 2*
