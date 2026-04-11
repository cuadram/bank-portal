# HLD — FEAT-015 Transferencias Programadas y Recurrentes

## Metadata
- **Feature:** FEAT-015 | **Proyecto:** BankPortal | **Cliente:** Banco Meridian
- **Stack:** Java 21 + Spring Boot 3.x (backend) · Angular 17 (frontend)
- **Tipo de trabajo:** new-feature
- **Sprint:** 17 | **Versión:** 1.0 | **Estado:** DRAFT
- **Autor:** SOFIA Architect Agent
- **Fecha:** 2026-03-24
- **CMMI:** AD SP 1.1 · AD SP 2.1 · AD SP 3.1

---

## Análisis de impacto en monorepo

| Servicio / Módulo | Tipo de impacto | Acción requerida |
|---|---|---|
| `TransferUseCase` (FEAT-008) | Reutilización — invocado por Scheduler | Ninguna — API interna estable |
| `TransferToBeneficiaryUseCase` (FEAT-008) | Reutilización | Ninguna |
| `WebPushService` (FEAT-014) | Reutilización — notificación push | Ninguna — API interna estable |
| `EmailNotificationService` (FEAT-005) | Reutilización | Ninguna |
| `AuditLogService` (FEAT-004) | Reutilización — registro ejecutor | Ninguna |
| `AccountService` (FEAT-007) | Reutilización — validación saldo | Ninguna |
| `push_subscriptions` table (FEAT-014) | DEBT-028 — cifrado auth+p256dh | Migración Flyway V17b (mismo sprint) |
| REST API BankPortal | Adición — 5 endpoints nuevos | Sin breaking changes en rutas existentes |
| Angular routing | Adición — módulo `scheduled-transfers` | Sin impacto en módulos existentes |

**Decisión:** Sin breaking changes. Adición pura + DEBT-028 como migración backward-compatible.

---

## Contexto del sistema — C4 Nivel 1

```mermaid
C4Context
  title BankPortal — FEAT-015 Transferencias Programadas y Recurrentes

  Person(client, "Cliente Banco Meridian", "Accede al portal bancario desde web/móvil")

  System(bankportal, "BankPortal", "Portal bancario full-stack con motor de transferencias programadas y recurrentes")

  System_Ext(core, "Core Bancario Meridian", "Procesa transferencias reales en cuentas")
  System_Ext(webpush, "Web Push / VAPID", "Entrega notificaciones push al navegador del cliente")
  System_Ext(smtp, "Servidor SMTP", "Entrega notificaciones email al cliente")
  System_Ext(sentry, "Sentry", "Observabilidad — errores y trazas del scheduler")

  Rel(client, bankportal, "Programa y gestiona transferencias", "HTTPS / Angular")
  Rel(bankportal, core, "Ejecuta transferencias reales", "REST — FEAT-009")
  Rel(bankportal, webpush, "Notifica ejecución push", "VAPID — FEAT-014")
  Rel(bankportal, smtp, "Notifica ejecución email", "SMTP TLS")
  Rel(bankportal, sentry, "Envía errores scheduler", "SDK")
```

---

## Componentes involucrados — C4 Nivel 2

```mermaid
C4Container
  title BankPortal — Containers FEAT-015

  Person(client, "Cliente", "Browser Angular")

  Container(ng, "Angular SPA", "Angular 17", "Wizard de creación, lista y gestión de programadas")
  Container(api, "BankPortal API", "Spring Boot 3 / Java 21", "REST endpoints + Scheduler @Scheduled")
  ContainerDb(pg, "PostgreSQL 15", "Base de datos", "scheduled_transfers · scheduled_transfer_executions · push_subscriptions (cifrado)")
  Container(redis, "Redis", "Cache / Blacklist", "JWT blacklist, rate limiting — sin cambios S17")

  System_Ext(core, "Core Bancario", "Procesa débito/crédito real")
  System_Ext(push, "Web Push VAPID", "Notificaciones browser")
  System_Ext(smtp, "SMTP", "Notificaciones email")

  Rel(client, ng, "Usa", "HTTPS")
  Rel(ng, api, "REST calls", "HTTPS / JWT Bearer")
  Rel(api, pg, "Lee/Escribe", "JDBC / JPA")
  Rel(api, redis, "Valida JWT", "Redis protocol")
  Rel(api, core, "POST /transfers", "REST mTLS — FEAT-009")
  Rel(api, push, "Web Push VAPID", "HTTPS — FEAT-014")
  Rel(api, smtp, "SMTP TLS", "JavaMail")
  Rel_Back(api, sentry, "Errores scheduler", "SDK async")
```

---

## Servicios nuevos o modificados

| Servicio | Acción | Responsabilidad | Puerto | Protocolo |
|---|---|---|---|---|
| `ScheduledTransferController` | NUEVO | CRUD de transferencias programadas | 8080 | REST / JWT |
| `CreateScheduledTransferUseCase` | NUEVO | Validar y persistir nueva programada | — | Interno |
| `UpdateScheduledTransferUseCase` | NUEVO | Pausar / reactivar / cancelar | — | Interno |
| `GetScheduledTransfersUseCase` | NUEVO | Listar y detalle por usuario | — | Interno |
| `ExecuteScheduledTransferUseCase` | NUEVO | Ejecutar programada vencida (invocado por Scheduler) | — | Interno |
| `NextExecutionDateCalculator` | NUEVO | Calcular próxima fecha según tipo de recurrencia | — | Interno |
| `ScheduledTransferJobService` | NUEVO | `@Scheduled(cron)` 06:00 UTC diario — idempotente | — | Spring Scheduler |
| `ScheduledTransferNotificationService` | NUEVO | Orquesta push + email por resultado | — | Interno |
| `ScheduledTransferRepository` | NUEVO | Puerto JPA para `scheduled_transfers` | — | JPA |
| `ScheduledTransferExecutionRepository` | NUEVO | Puerto JPA para `scheduled_transfer_executions` | — | JPA |
| `scheduled-transfers` module (Angular) | NUEVO | Wizard + lista + historial en frontend | — | Angular NgRx |

**Flyway migrations:**
- `V17__create_scheduled_transfers.sql` — tablas nuevas
- `V17b__encrypt_push_subscriptions_auth.sql` — DEBT-028

---

## Contrato de integración backend ↔ frontend

**Base URL:** `https://api.bankportal.experis.com/v1`
**Auth:** Bearer JWT en header `Authorization`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/scheduled-transfers` | Crear nueva programada (ONCE / recurrente) |
| `GET` | `/scheduled-transfers` | Listar programadas del usuario autenticado |
| `GET` | `/scheduled-transfers/{id}` | Detalle de una programada |
| `PATCH` | `/scheduled-transfers/{id}/pause` | Pausar recurrente activa |
| `PATCH` | `/scheduled-transfers/{id}/resume` | Reactivar recurrente pausada |
| `DELETE` | `/scheduled-transfers/{id}` | Cancelar (soft-delete, pasa a CANCELLED) |
| `GET` | `/scheduled-transfers/{id}/executions` | Historial de ejecuciones |

Ver contrato OpenAPI detallado en LLD-FEAT-015-backend.md.

---

## Modelo de estados — ScheduledTransfer

```mermaid
stateDiagram-v2
  [*] --> PENDING : POST /scheduled-transfers
  PENDING --> ACTIVE : Scheduler primera ejecución exitosa (recurrente)
  PENDING --> COMPLETED : Scheduler ejecuta ONCE exitosamente
  ACTIVE --> ACTIVE : Scheduler ejecuta siguiente ciclo
  ACTIVE --> PAUSED : PATCH /pause (usuario)
  PAUSED --> ACTIVE : PATCH /resume (usuario)
  ACTIVE --> COMPLETED : max_executions alcanzado o end_date superada
  PENDING --> FAILED : Saldo insuficiente + reintento fallido
  ACTIVE --> FAILED : Saldo insuficiente + reintento fallido
  PENDING --> CANCELLED : DELETE usuario
  ACTIVE --> CANCELLED : DELETE usuario
  PAUSED --> CANCELLED : DELETE usuario
  COMPLETED --> [*]
  FAILED --> [*]
  CANCELLED --> [*]
```

---

## Flujo de ejecución del Scheduler

```mermaid
sequenceDiagram
  participant Job as ScheduledTransferJobService<br/>@Scheduled 06:00 UTC
  participant UC as ExecuteScheduledTransferUseCase
  participant Calc as NextExecutionDateCalculator
  participant Repo as ScheduledTransferRepository
  participant ExecRepo as ExecutionRepository
  participant Transfer as TransferUseCase (FEAT-008)
  participant Core as Core Bancario
  participant Notif as ScheduledTransferNotificationService

  Job->>Repo: findPendingAndActiveDueToday(today)
  loop Para cada ScheduledTransfer vencida
    Job->>ExecRepo: existsByTransferIdAndScheduledDate(id, today)
    alt Ya ejecutada hoy (idempotencia)
      Job-->>Job: SKIP — ya procesada
    else Primera vez hoy
      Job->>UC: execute(transfer)
      UC->>Transfer: execute(amount, from, to)
      Transfer->>Core: POST /transfers
      alt Core responde OK
        Core-->>Transfer: 200 OK
        Transfer-->>UC: TransferResult.SUCCESS
        UC->>Calc: calculateNext(transfer)
        Calc-->>UC: nextExecutionDate (null si ONCE o fin alcanzado)
        UC->>Repo: save(ACTIVE|COMPLETED, nextDate)
        UC->>ExecRepo: save(SUCCESS, amount, executedAt)
        UC->>Notif: notifySuccess(transfer, result)
      else INSUFFICIENT_FUNDS
        Core-->>Transfer: 422
        Transfer-->>UC: TransferResult.INSUFFICIENT_FUNDS
        UC->>ExecRepo: save(FAILED_RETRYING, reason)
        Note over UC: Reintento en +2h (una vez)
        UC->>Notif: notifyFailure(transfer, INSUFFICIENT_FUNDS)
      else Core no disponible
        Core-->>Transfer: 503/timeout
        Transfer-->>UC: TransferResult.SKIPPED
        UC->>ExecRepo: save(SKIPPED, reason)
        Note over UC: Sin reintento — próximo día
      end
    end
  end
```

---

## Decisiones técnicas — ver ADRs

- **ADR-026:** ShedLock (scheduler multi-instancia) — diferido a Sprint 18
- **ADR-027:** Edición de importe en recurrente activa — no permitido; cancelar + crear nueva

---

*SOFIA Architect Agent · Sprint 17 · CMMI Level 3*
*BankPortal — Banco Meridian — 2026-03-24*
