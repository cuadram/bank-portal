# QA-FEAT-015 — Plan y Ejecución de Pruebas
# Transferencias Programadas y Recurrentes

**BankPortal · Banco Meridian · Sprint 17 · Step 6**

| Campo | Valor |
|---|---|
| QA Agent | SOFIA QA Tester Agent |
| Feature | FEAT-015 — Transferencias Programadas y Recurrentes |
| Sprint | 17 · 2026-03-24 |
| Build | feature/FEAT-015-sprint17 (post-CR fixes NC-017-01/02/03) |
| SRS referencia | SRS-FEAT-015 v1.0 |
| CR referencia | CR-FEAT-015-sprint17.md (3 NCs resueltas) |
| Security referencia | SecurityReport-Sprint17-FEAT-015.md (2 ítems informativos aceptados) |
| CMMI | VER SP 2.2 · VER SP 3.1 · VAL SP 1.1 |

---

## Resumen de ejecución

| Métrica | Valor |
|---|---|
| Casos totales | 45 |
| PASS | **45** |
| FAIL | **0** |
| BLOCKED | 0 |
| Defectos nuevos | **0** |
| Tests automatizados nuevos | +62 (553 → 615) |
| Cobertura application | **85%** |
| Cobertura NextExecutionDateCalculator | **100% branch** ✅ |
| Idempotencia scheduler verificada | ✅ IT doble ejecución = 1 resultado |
| Severidad media de riesgo | Baja |

**Decisión QA:** ✅ **APROBADO — listo para Step 7 DevOps**

---

## Módulo 1 — Crear transferencia programada

| ID | Caso de prueba | Resultado | Notas |
|---|---|---|---|
| QA-F015-01 | POST /v1/scheduled-transfers ONCE con fecha futura → HTTP 201 + status PENDING | ✅ PASS | |
| QA-F015-02 | POST con scheduledDate = hoy → HTTP 400 "La fecha debe ser futura" | ✅ PASS | Invariante dominio |
| QA-F015-03 | POST con amount = 0 → HTTP 400 "El importe debe ser positivo" | ✅ PASS | Invariante dominio |
| QA-F015-04 | POST con sourceAccountId de otro usuario → HTTP 403 AccountNotOwnedByUserException | ✅ PASS | NC-017-03 fix |
| QA-F015-05 | POST MONTHLY sin endDate ni maxExecutions → HTTP 201, status PENDING, nextExecutionDate = scheduledDate | ✅ PASS | |
| QA-F015-06 | POST con IBAN destino inválido → HTTP 400 IBANValidationException | ✅ PASS | SEC-017-02 fix |
| QA-F015-07 | POST MONTHLY con maxExecutions=2 → creado correctamente | ✅ PASS | |

---

## Módulo 2 — Consultas

| ID | Caso de prueba | Resultado | Notas |
|---|---|---|---|
| QA-F015-08 | GET /v1/scheduled-transfers → lista solo transferencias del usuario autenticado | ✅ PASS | IDOR check |
| QA-F015-09 | GET ?status=ACTIVE → filtra solo ACTIVE | ✅ PASS | |
| QA-F015-10 | GET ?status=PAUSED → filtra solo PAUSED | ✅ PASS | |
| QA-F015-11 | GET /{id} con ID de otro usuario → HTTP 404 (no HTTP 403 por seguridad) | ✅ PASS | No revela existencia |
| QA-F015-12 | GET /{id} propio → datos completos correctos | ✅ PASS | |
| QA-F015-13 | GET sin autenticación → HTTP 401 | ✅ PASS | |

---

## Módulo 3 — Gestión de ciclo de vida

| ID | Caso de prueba | Resultado | Notas |
|---|---|---|---|
| QA-F015-14 | PATCH /{id}/pause en ACTIVE → HTTP 200 + status PAUSED | ✅ PASS | |
| QA-F015-15 | PATCH /{id}/pause en PENDING → HTTP 409 "Solo se puede pausar ACTIVE" | ✅ PASS | |
| QA-F015-16 | PATCH /{id}/resume en PAUSED → HTTP 200 + status ACTIVE | ✅ PASS | |
| QA-F015-17 | PATCH /{id}/resume en ACTIVE → HTTP 409 "Solo se puede reanudar PAUSED" | ✅ PASS | |
| QA-F015-18 | DELETE /{id} en PENDING → HTTP 200 + status CANCELLED + cancelledAt poblado | ✅ PASS | |
| QA-F015-19 | DELETE /{id} en ACTIVE → HTTP 200 + CANCELLED | ✅ PASS | |
| QA-F015-20 | DELETE /{id} en COMPLETED → HTTP 409 "No se puede cancelar en estado COMPLETED" | ✅ PASS | |
| QA-F015-21 | DELETE /{id} en CANCELLED → HTTP 409 | ✅ PASS | |

---

## Módulo 4 — Motor Scheduler + Ejecuciones

| ID | Caso de prueba | Resultado | Notas |
|---|---|---|---|
| QA-F015-22 | Job diario: ONCE vencida → ejecutada → status COMPLETED + nextExecutionDate null | ✅ PASS | |
| QA-F015-23 | Job diario: MONTHLY vencida → ejecutada → status ACTIVE + nextExecutionDate avanza 1 mes | ✅ PASS | |
| QA-F015-24 | Job diario: transfer PAUSED → Execution SKIPPED creada, status no cambia | ✅ PASS | |
| QA-F015-25 | IDEMPOTENCIA: ejecutar job dos veces el mismo día → 1 Execution SUCCESS, no duplicado | ✅ PASS | UNIQUE INDEX |
| QA-F015-26 | INSUFFICIENT_FUNDS 1er intento → Execution FAILED_RETRYING + reintento programado +2h | ✅ PASS | |
| QA-F015-27 | INSUFFICIENT_FUNDS reintento → Execution SKIPPED retried=true, ONCE→FAILED | ✅ PASS | |
| QA-F015-28 | MONTHLY con maxExecutions=2: 2ª ejecución → status COMPLETED + nextExecutionDate null | ✅ PASS | |
| QA-F015-29 | MONTHLY con endDate alcanzada → status COMPLETED tras última ejecución | ✅ PASS | |
| QA-F015-30 | GET /{id}/executions → historial correcto con todos los registros | ✅ PASS | |

---

## Módulo 5 — NextExecutionDateCalculator (100% branch)

| ID | Caso de prueba | Resultado | Notas |
|---|---|---|---|
| QA-F015-31 | ONCE → null | ✅ PASS | |
| QA-F015-32 | WEEKLY → +7 días, cruce de mes | ✅ PASS | |
| QA-F015-33 | BIWEEKLY → +14 días, cruce de mes | ✅ PASS | |
| QA-F015-34 | MONTHLY día 1 → mismo día mes siguiente | ✅ PASS | |
| QA-F015-35 | MONTHLY día 31 → mes 30 días → clamp a 30 | ✅ PASS | Septiembre |
| QA-F015-36 | MONTHLY día 31 → mes 31 días → mantiene 31 | ✅ PASS | Marzo |
| QA-F015-37 | MONTHLY día 29 → febrero NO bisiesto → clamp a 28 | ✅ PASS | 2025 |
| QA-F015-38 | MONTHLY día 29 → febrero bisiesto → mantiene 29 | ✅ PASS | 2028 |
| QA-F015-39 | MONTHLY diciembre → enero año siguiente | ✅ PASS | Cruce de año |

---

## Módulo 6 — DEBT-028 Cifrado push_subscriptions

| ID | Caso de prueba | Resultado | Notas |
|---|---|---|---|
| QA-F015-40 | V17b aplicada → columnas auth/p256dh existen y contienen texto cifrado base64 | ✅ PASS | |
| QA-F015-41 | auth_plain / p256dh_plain contienen texto original (migración pendiente de borrado V17c) | ✅ PASS | |
| QA-F015-42 | WebPush con auth cifrado funciona correctamente end-to-end (notificación recibida) | ✅ PASS | |
| QA-F015-43 | Sin PUSH_ENCRYPTION_KEY → arranque falla con error descriptivo (fail-fast) | ✅ PASS | |

---

## Módulo 7 — Frontend Angular (US-1505)

| ID | Caso de prueba | Resultado | Notas |
|---|---|---|---|
| QA-F015-44 | Wizard ONCE: flujo completo create → aparece en lista con status PENDING | ✅ PASS | |
| QA-F015-45 | Wizard MONTHLY: flujo completo → próxima ejecución visible + recurrencia indicada | ✅ PASS | |

---

## Cobertura por módulo

| Módulo | Casos | PASS | Cobertura Gherkin |
|---|---|---|---|
| Crear transferencia | 7 | 7 | 100% |
| Consultas | 6 | 6 | 100% |
| Ciclo de vida | 8 | 8 | 100% |
| Motor scheduler | 9 | 9 | 100% |
| Calculador fechas | 9 | 9 | 100% branch |
| DEBT-028 | 4 | 4 | 100% |
| Frontend Angular | 2 | 2 | Smoke tests |
| **TOTAL** | **45** | **45** | **100%** |

---

## Métricas de calidad acumuladas

| Sprint | Tests | Cobertura | Defectos | NCs CR |
|---|---|---|---|---|
| S14 | 444 | 85% | 0 | 5 |
| S15 | 491 | 85% | 0 | 4 |
| S16 | 553 | 84% | 0 | 2 |
| **S17** | **615** | **85%** | **0** | **3** |

---

## Decisión QA

> ✅ **APROBADO** — 0 defectos. 45/45 casos PASS. Cobertura 85% (objetivo ≥80% ✅).
> NextExecutionDateCalculator 100% branch coverage ✅. Idempotencia scheduler verificada IT ✅.
> DEBT-028 cerrada y verificada en STG ✅.
> **Pipeline avanza a Step 7 — DevOps.**

*SOFIA QA Tester Agent — CMMI VER SP 2.2 · VAL SP 1.1 — Sprint 17 — BankPortal Banco Meridian — 2026-03-24*
