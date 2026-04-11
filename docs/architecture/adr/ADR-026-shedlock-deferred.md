# ADR-026 — ShedLock para scheduler multi-instancia: diferido a Sprint 18

## Metadata
- **Feature:** FEAT-015 | **Sprint:** 17 | **Fecha:** 2026-03-24
- **Estado:** Aceptado
- **Autor:** SOFIA Architect Agent + Tech Lead

---

## Contexto

`ScheduledTransferJobService` ejecuta un `@Scheduled(cron="0 0 6 * * *")` diario.
Si BankPortal se despliega en más de una instancia (scale-out), el scheduler
se dispararía simultáneamente en todas las réplicas, lo que podría ejecutar
transferencias duplicadas a pesar de la lógica de idempotencia basada en
`UNIQUE INDEX idx_exec_transfer_date`.

**Estado actual de producción:** Single instance — 1 réplica confirmada en STG y PRD.
No hay planes de scale-out antes de Sprint 18.

---

## Decisión

**Diferir la integración de ShedLock a Sprint 18.**

Sprint 17 implementa idempotencia a nivel de base de datos (UNIQUE INDEX en
`scheduled_transfer_executions(scheduled_transfer_id, scheduled_date)`) como
capa de seguridad suficiente para entorno single-instance.

---

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Diferir ShedLock a S18 (elegida)** | Reduce scope S17 en ~2SP. Idempotencia DB es suficiente en single-instance. Más tiempo para diseñar correctamente. | Riesgo R-015-01 latente hasta S18. Si se hace scale-out antes de S18, hay riesgo. |
| Implementar ShedLock en S17 | Elimina riesgo definitivamente. | +2 SP consume capacidad de FEAT-015. Añade dependencia Redis (o tabla lock). Complejidad no necesaria ahora. |
| `@ConditionalOnProperty(scheduler.enabled)` manual | Simple, sin dependencias externas | No es lock distribuido real. Frágil. |

---

## Consecuencias

- **Positivas:** Sprint 17 mantiene velocidad de 24 SP. Idempotencia DB cubre el caso de uso actual.
- **Trade-offs:** Riesgo R-015-01 sigue abierto hasta S18.
- **Riesgos:** Si ops decide escalar a >1 réplica antes de Sprint 18, ejecutar ShedLock como hotfix.
- **Impacto en servicios existentes:** Ninguno.
- **Acción Sprint 18:** Historia DEBT-030 — Integrar ShedLock + `@EnableSchedulerLock`.

---

*BankPortal — Banco Meridian — 2026-03-24*
