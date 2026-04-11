# Code Review — FEAT-015 Transferencias Programadas y Recurrentes
## Sprint 17 · BankPortal — Banco Meridian
**Revisor:** SOFIA Code Review Agent | **Fecha:** 2026-03-24 | **Release:** v1.17.0

---

## Resumen ejecutivo

| Métrica | Resultado |
|---|---|
| Archivos revisados | 22 |
| NCs Bloqueantes | **0** |
| NCs No bloqueantes | **3** |
| Observaciones | 4 |
| Veredicto | ✅ **APROBADO con observaciones menores** |

---

## NCs No bloqueantes

### NC-017-01 · Prioridad Media
**Fichero:** `ScheduledTransferJobService.java`
**Descripción:** El job usa `java.util.logging`. El resto del proyecto usa SLF4J.
**Corrección:** Reemplazar por `LoggerFactory.getLogger(...)` de SLF4J.
**Responsable:** Developer | **Sprint:** 17

---

### NC-017-02 · Prioridad Baja
**Fichero:** `ExecuteScheduledTransferUseCase.java`
**Descripción:** El segundo bloque `else` en fallo de reintento usa `ExecutionStatus.SKIPPED` en vez de crear un estado FAILED definitivo. Semánticamente incorrecto.
**Corrección:** Usar `ExecutionStatus.SKIPPED` solo para transferencias pausadas. Para fallo definitivo de reintento, guardar como `FAILED_RETRYING` con `retried=true`, o añadir `FAILED_PERMANENT` al enum.
**Responsable:** Developer | **Sprint:** 17

---

### NC-017-03 · Prioridad Baja
**Fichero:** `CreateScheduledTransferUseCase.java`
**Descripción:** La excepción lanzada si la cuenta no pertenece al usuario es `SecurityException` (java.lang). Debería ser una excepción de dominio propia (ej. `AccountNotOwnedByUserException`) para trazabilidad de auditoría.
**Corrección:** Crear `AccountNotOwnedByUserException extends RuntimeException` en el paquete `usecase`.
**Responsable:** Developer | **Sprint:** 17

---

## Observaciones (no bloquean)

| # | Fichero | Observación |
|---|---|---|
| O-1 | `ScheduledTransfer.java` | Considerar @Builder pattern para el constructor de reconstitución (16 parámetros) — legibilidad en JPA mapper |
| O-2 | `ScheduledTransferController.java` | Añadir validación Bean Validation (@NotNull, @Positive) en `CreateScheduledTransferRequest` al integrar con Spring |
| O-3 | `V17b__encrypt_push_subscriptions_auth.sql` | Documentar en RUNBOOK el proceso de migración en caliente de auth_plain → auth cifrado antes de V17c |
| O-4 | `NextExecutionDateCalculatorTest.java` | Tests exhaustivos ✅ — excelente cobertura de edge cases de fechas |

---

## Conformidad arquitectónica

| Criterio | Estado |
|---|---|
| Clean Architecture (domain sin dependencias infra) | ✅ |
| Ports & Adapters (interfaces para dependencias externas) | ✅ |
| Inmutabilidad en DTOs (records Java) | ✅ |
| Idempotencia del scheduler documentada | ✅ |
| DEBT-028 (V17b migración) incluida | ✅ |
| ADR-026 (ShedLock diferido S18) reflejado en código | ✅ |
| Convención de nombres consistente con FEAT-008/009 | ✅ |

---

## Cobertura de tests

| Clase | Tests | Edge cases |
|---|---|---|
| `NextExecutionDateCalculatorTest` | 11 tests | Feb/28, Feb/29 bisiesto ✅, mes 30d ✅, dic→ene ✅ |
| `ScheduledTransferTest` | 10 tests | Invariantes dominio, ciclo de vida completo ✅ |

**Estimación cobertura application tras integración:** ~85% (consistente con S16)

---

## Decisión

> ✅ **APROBADO** — 3 NCs no bloqueantes a resolver en mismo sprint antes de QA gate.
> NC-017-02 (status semántico) es el más importante funcionalmente.

*SOFIA Code Review Agent — CMMI VER SP 2.2 · Sprint 17 · 2026-03-24*
