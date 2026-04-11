# SRS-FEAT-015 — Software Requirements Specification
# Transferencias Programadas y Recurrentes

**BankPortal · Banco Meridian · Sprint 17**

| Campo | Valor |
|---|---|
| Documento | SRS-FEAT-015 |
| Versión | 1.0 |
| Fecha | 2026-03-24 |
| Sprint | 17 |
| Feature | FEAT-015 |
| Autor | SOFIA Requirements Analyst Agent |
| Estado | APPROVED |
| CMMI | RD SP 1.1 · RD SP 2.1 · RD SP 3.1 |

---

## 1. Introducción

### 1.1 Propósito

Especificar los requisitos funcionales y no funcionales de FEAT-015 —
Transferencias Programadas y Recurrentes. Sirve como contrato entre el
Product Owner, el equipo técnico y QA, y como evidencia formal de proceso
CMMI Nivel 3 (Requirements Development).

### 1.2 Alcance

FEAT-015 extiende el motor de transferencias de BankPortal (FEAT-008/009)
permitiendo al cliente configurar transferencias que se ejecutan
automáticamente en fechas futuras. Introduce dos modalidades:

- **Programada única** — ejecución en fecha futura concreta (tipo `ONCE`)
- **Recurrente** — cadencia configurable: semanal, quincenal o mensual, con
  fin opcional por fecha o número de ejecuciones

Ambas modalidades aprovechan la infraestructura de notificaciones push/email
(FEAT-014), el motor de validación de límites (FEAT-008) y el core bancario
real (FEAT-009).

### 1.3 Definiciones

| Término | Definición |
|---|---|
| Scheduled Transfer | Transferencia configurada para ejecutarse en fecha futura |
| Recurrence | Cadencia de repetición: WEEKLY / BIWEEKLY / MONTHLY |
| Scheduler | Proceso `@Scheduled` que ejecuta diariamente las transferencias vencidas |
| `NextExecutionDate` | Fecha calculada de la próxima ejecución tras completar la actual |
| Idempotencia | Propiedad del scheduler: relanzarlo no duplica ejecuciones ya realizadas |
| ShedLock | Biblioteca de lock distribuido para scheduler en entornos multi-instancia (diferido a S18) |
| `ONCE` | Tipo de programada que se ejecuta una sola vez y pasa a COMPLETED |
| `BIWEEKLY` | Cadencia de 14 días exactos entre ejecuciones |
| Execution Record | Registro en `scheduled_transfer_executions` por cada intento del scheduler |

### 1.4 Documentos relacionados

| Documento | Descripción |
|---|---|
| `docs/backlog/FEAT-015.md` | Backlog épica con User Stories y criterios Gherkin |
| `docs/backlog/FEAT-008.md` | Motor de transferencias base |
| `docs/backlog/FEAT-009.md` | Integración core bancario real |
| `docs/backlog/FEAT-014.md` | Sistema de notificaciones push/email |
| `docs/sprints/SPRINT-017-planning.md` | Planning Sprint 17 |
| `docs/sprints/risk-register-bankportal.md` | Risk Register actualizado |

---

## 2. Contexto del sistema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                BankPortal — Transferencias Programadas                  │
│                                                                          │
│  ┌───────────────┐  crea/gestiona  ┌──────────────────────────────┐    │
│  │ Usuario       │────────────────▶│  ScheduledTransfer API       │    │
│  │ (Angular UI)  │                 │  POST /scheduled-transfers    │    │
│  └───────────────┘                 │  GET  /scheduled-transfers    │    │
│                                    │  PATCH/DELETE /{id}           │    │
│                                    └──────────────┬───────────────┘    │
│                                                   │ persiste            │
│  ┌────────────────────────────────────────────────▼───────────────┐    │
│  │  scheduled_transfers  ·  scheduled_transfer_executions (V17)   │    │
│  └────────────────────────────────────────────────┬───────────────┘    │
│                                                   │ lee diariamente     │
│  ┌────────────────────────────────────────────────▼───────────────┐    │
│  │         ScheduledTransferJobService  (@Scheduled 06:00 UTC)    │    │
│  │  ┌────────────────────────────────────────────────────────┐   │    │
│  │  │  ExecuteScheduledTransferUseCase                        │   │    │
│  │  │   → TransferUseCase / TransferToBeneficiaryUseCase      │   │    │
│  │  │   → NextExecutionDateCalculator                         │   │    │
│  │  │   → ScheduledTransferNotificationService                │   │    │
│  │  └────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                    │ notifica              │ audita                      │
│          ┌─────────▼──────┐    ┌──────────▼──────────┐                 │
│          │ WebPushService  │    │   audit_log          │                 │
│          │ EmailChannel    │    │   (inmutable)        │                 │
│          └────────────────┘    └─────────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
```

**Stack técnico:** Spring Boot 3.x · Java 21 · Angular 17 · PostgreSQL 15 ·
Spring `@Scheduled` · `TransferUseCase` (FEAT-008) · `WebPushService` (FEAT-014)

---

## 3. Alcance detallado

### Incluido en FEAT-015
- Modelo de datos `scheduled_transfers` + `scheduled_transfer_executions` (Flyway V17)
- API REST CRUD de transferencias programadas (crear, listar, ver, pausar, cancelar)
- Soporte de tipos: `ONCE`, `WEEKLY`, `BIWEEKLY`, `MONTHLY`
- Fin de recurrencia por: fecha (`end_date`), número de ejecuciones (`max_executions`) o indefinido
- Scheduler diario a las 06:00 UTC — idempotente por diseño
- Gestión de fallos: `INSUFFICIENT_FUNDS` → pausa + reintento (1 vez, 2h); core no disponible → `SKIPPED`
- Notificación push + email en cada ejecución (exitosa o fallida por saldo)
- Frontend Angular: wizard creación + lista con filtros + historial por programada
- Deuda técnica del sprint: DEBT-027, DEBT-028, DEBT-029
- Load test SSE >500 concurrentes (R-016-05)

### Excluido explícitamente
- Transferencias SEPA/SWIFT recurrentes internacionales
- Mandatos SEPA Direct Debit (iniciados por terceros)
- Reglas condicionales ("si saldo > X, ejecutar")
- Aprobación multifirma
- ShedLock para entornos multi-instancia (diferido a FEAT-016/Sprint 18)

---

## 4. Épica

**EPIC: Automatización de Pagos Recurrentes**

Banco Meridian detecta que el 35% de las llamadas al call center son para
confirmar si un pago periódico se ha ejecutado. FEAT-015 elimina esa fricción
permitiendo al cliente configurar sus transferencias habituales una sola vez,
con confirmación push y email en cada ciclo, y visibilidad total desde el portal.

---

## 5. Requerimientos Funcionales

| ID | Descripción | US vinculada | Prioridad |
|---|---|---|---|
| RF-1501 | El sistema debe persistir transferencias programadas con tipo, destinatario, importe, fecha de ejecución y cadencia | US-1501 | Must |
| RF-1502 | El usuario puede programar una transferencia única para ejecución en fecha futura (mínimo mañana) | US-1502 | Must |
| RF-1503 | El sistema debe validar OTP en la creación de cualquier transferencia programada | US-1502/1503 | Must |
| RF-1504 | El sistema debe validar límites de transferencia (por operación y diario) en el momento de programar | US-1502/1503 | Must |
| RF-1505 | El usuario puede configurar transferencias recurrentes: WEEKLY, BIWEEKLY, MONTHLY | US-1503 | Must |
| RF-1506 | La recurrencia puede tener fin por: fecha límite, número máximo de ejecuciones, o ser indefinida | US-1503 | Must |
| RF-1507 | El sistema debe calcular `next_execution_date` correctamente para todos los tipos de cadencia, incluyendo casos de meses cortos y años bisiestos | US-1503 | Must |
| RF-1508 | El usuario puede pausar y reactivar transferencias recurrentes sin OTP | US-1503 | Must |
| RF-1509 | El usuario puede cancelar una transferencia programada antes de su ejecución | US-1502 | Must |
| RF-1510 | El scheduler debe ejecutar diariamente las transferencias con `next_execution_date <= hoy` y `status = ACTIVE` | US-1504 | Must |
| RF-1511 | Cada ejecución del scheduler debe registrarse en `scheduled_transfer_executions` con estado y referencia | US-1504 | Must |
| RF-1512 | La ejecución del scheduler debe ser idempotente: relanzarlo no duplica ejecuciones ya completadas el mismo día | US-1504 | Must |
| RF-1513 | Ante fallo por saldo insuficiente: registrar FAILED, pausar la programada y notificar al usuario | US-1504 | Must |
| RF-1514 | Ante fallo por core no disponible: registrar SKIPPED y reintentar en el próximo ciclo sin pausar | US-1504 | Must |
| RF-1515 | El sistema debe enviar notificación push + email en cada ejecución exitosa o fallida por saldo | US-1504 | Must |
| RF-1516 | La transferencia programada completada (ONCE ejecutada o max_executions alcanzado) pasa automáticamente a status COMPLETED | US-1504 | Must |
| RF-1517 | El usuario puede listar sus transferencias programadas filtradas por estado | US-1505 | Must |
| RF-1518 | El usuario puede ver el historial de ejecuciones de una transferencia programada concreta | US-1505 | Must |
| RF-1519 | La interfaz Angular debe reflejar en tiempo real el estado de las programadas mediante SSE/push | US-1505 | Should |
| RF-1520 | No se permite editar el importe ni el destinatario de una programada activa (requiere cancelar + crear nueva) | US-1503 | Must |

---

## 6. Requerimientos No Funcionales

> Base RNF del proyecto: ver SRS baseline BankPortal (docs/requirements/).
> Los siguientes son **deltas** específicos de FEAT-015.

| ID | Categoría | Descripción | Criterio medible |
|---|---|---|---|
| RNF-1501 | Rendimiento | Tiempo total del job scheduler para 1.000 transferencias vencidas | ≤ 30 segundos |
| RNF-1502 | Rendimiento | Latencia endpoint `POST /scheduled-transfers` | p95 < 300ms (incluye validación OTP) |
| RNF-1503 | Fiabilidad | Tasa de fallo de ejecución del scheduler (excluido saldo insuficiente) | ≤ 0.5% |
| RNF-1504 | Fiabilidad | Idempotencia del scheduler ante reinicios o doble disparo | 0 ejecuciones duplicadas en 100 intentos |
| RNF-1505 | Exactitud | Cálculo `next_execution_date` en todos los tipos y casos límite | 100% corrección en suite de 50 casos de prueba |
| RNF-1506 | Seguridad | OTP obligatorio en creación de programada — sin excepción por importe | Aplica a toda operación (PSD2 RTS Art.10) |
| RNF-1507 | Seguridad | Acceso a `scheduled_transfers` restringido al `userId` del JWT | 0 accesos cross-user en tests de autorización |
| RNF-1508 | Auditabilidad | Todo evento del lifecycle (creación, ejecución, fallo, cancelación) registrado en `audit_log` | 100% trazabilidad verificada por QA |
| RNF-1509 | Accesibilidad | Interfaz Angular cumple WCAG 2.1 AA | Verificado con axe-core en CI |
| RNF-1510 | Mantenibilidad | `NextExecutionDateCalculator` sin dependencias externas, 100% testeable en aislamiento | Cobertura de ramas: 100% |

---

## 7. Restricciones

| ID | Tipo | Descripción |
|---|---|---|
| RR-1501 | Normativa | PSD2 RTS Art.10 — SCA (OTP) obligatoria en configuración de recurrencia. Exención EBA aplicable: no se exige OTP en cada ejecución automática posterior. |
| RR-1502 | Normativa | PSD2 Art.94 — trazabilidad completa de todas las operaciones de pago en `audit_log` y `scheduled_transfer_executions`. |
| RR-1503 | Normativa | RGPD Art.5(1b) — datos de `scheduled_transfers` usados únicamente para ejecución. Sin uso analítico ni cesión a terceros. |
| RR-1504 | Normativa | PCI-DSS 4.0 req.7 — acceso a datos financieros filtrado siempre por `userId` del JWT. Sin acceso administrativo a datos de otros usuarios. |
| RR-1505 | Tecnología | Scheduler implementado con Spring `@EnableScheduling` + `@Scheduled`. ShedLock diferido a FEAT-016 (single instance confirmado en S17). |
| RR-1506 | Tecnología | Reutilizar `TransferUseCase` y `TransferToBeneficiaryUseCase` de FEAT-008 sin modificarlos. La programada orquesta, no reimplementa. |
| RR-1507 | Tecnología | Flyway V17 debe construirse sobre V16 aplicada. Ninguna migración puede modificar tablas de sprints anteriores. |
| RR-1508 | Negocio | El usuario no puede editar importe ni destinatario de una programada activa. Debe cancelar y crear nueva. Documentar en UI con mensaje explicativo. |

---

## 8. Supuestos y dependencias

### Supuestos
- Flyway V16 (FEAT-014) está mergeada en `develop` antes del día 1 del sprint.
- El despliegue de Sprint 17 es single-instance — ShedLock no es necesario.
- Los límites de transferencia configurados en `transfer_limits` (FEAT-008) aplican también a programadas — se validan en el momento de creación.
- El umbral para reintento único ante saldo insuficiente es 2 horas. No configurable en S17.
- El scheduler corre en timezone UTC (06:00 UTC). Si el cliente necesita otra TZ, se documenta como deuda para FEAT-016.
- La acción push tras ejecución utiliza las suscripciones VAPID ya activas del usuario (FEAT-014). Si el usuario no tiene push activo, solo se envía email.

### Dependencias

| Dependencia | Tipo | Estado | Riesgo si no está lista |
|---|---|---|---|
| `TransferUseCase` (FEAT-008) | Funcional | ✅ Operativo en develop | Bloqueante — scheduler no puede ejecutar |
| `TransferToBeneficiaryUseCase` (FEAT-008) | Funcional | ✅ Operativo | Bloqueante para recurrentes a beneficiario |
| `TransferLimitValidationService` (FEAT-008) | Funcional | ✅ Operativo | Bloqueante — sin límites no hay SCA |
| `WebPushService` + `EmailChannelService` (FEAT-014) | Notificaciones | ✅ Operativo | No bloqueante — scheduler funciona sin push |
| `BankCoreRestAdapter` + circuit breaker (FEAT-009) | Integración | ✅ Operativo | Fallo core → SKIPPED, no bloqueante |
| Flyway V16 mergeada en develop | BD | ✅ Confirmado | Bloqueante para aplicar V17 |
| DEBT-027 (domain events) | Arquitectura | S17 S1 | Precede a listeners del scheduler |
| ADR-026 (ShedLock vs single-instance) | Decisión | Día 1 S17 | Sin decisión no se puede comenzar US-1504 |

---

## 9. User Stories

---

### US-1501 — Modelo de datos + Flyway V17

**Como** sistema BankPortal,
**Quiero** disponer de las tablas de persistencia para transferencias programadas
y su historial de ejecuciones,
**Para** soportar toda la lógica de programación, ejecución y trazabilidad.

**Story Points:** 2 | **Prioridad:** Alta | **Dependencias:** Flyway V16 aplicada

#### Criterios de Aceptación

```gherkin
Scenario: Flyway V17 crea scheduled_transfers con schema correcto
  Given entorno PostgreSQL con Flyway V16 aplicada
  When se ejecuta V17__scheduled_transfers.sql
  Then existe tabla scheduled_transfers con columnas:
    id UUID PK, user_id UUID FK, type ENUM(ONCE/WEEKLY/BIWEEKLY/MONTHLY),
    source_account_id UUID, target_type ENUM(OWN/BENEFICIARY),
    target_account_id UUID nullable, beneficiary_id UUID nullable FK,
    amount NUMERIC(15,2), concept VARCHAR(140), currency CHAR(3) default EUR,
    next_execution_date DATE NOT NULL, end_date DATE nullable,
    max_executions INT nullable, executions_done INT default 0,
    status ENUM(ACTIVE/PAUSED/CANCELLED/COMPLETED),
    created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
  And existe constraint CHECK(target_account_id IS NOT NULL OR beneficiary_id IS NOT NULL)

Scenario: Flyway V17 crea scheduled_transfer_executions
  When se ejecuta la migración
  Then existe tabla scheduled_transfer_executions con columnas:
    id UUID PK, scheduled_transfer_id UUID FK, executed_at TIMESTAMPTZ,
    status ENUM(SUCCESS/FAILED/SKIPPED), error_code VARCHAR nullable,
    transfer_id UUID nullable FK transfers, amount NUMERIC(15,2)
  And índices en: scheduled_transfers(user_id),
    scheduled_transfers(next_execution_date, status),
    scheduled_transfer_executions(scheduled_transfer_id)

Scenario: Repositorios JPA resuelven entidades correctamente
  Given Flyway V17 aplicada
  When se instancian ScheduledTransferRepository y ScheduledTransferExecutionRepository
  Then Spring Data JPA no lanza errores de mapeo
  And query findByStatusAndNextExecutionDateLessThanEqual(ACTIVE, hoy) retorna resultados correctos

Scenario: Valores por defecto coherentes al insertar
  Given nueva scheduled_transfer sin end_date ni max_executions
  When se consulta la fila
  Then status=ACTIVE, executions_done=0, currency=EUR
```

#### DoD
- Flyway V17 aplicada en STG sin errores
- Tests de repositorio con Testcontainers pasando
- Constraint de integridad verificado con test negativo

---

### US-1502 — Programar transferencia a fecha futura

**Como** cliente de Banco Meridian,
**Quiero** programar una transferencia para que se ejecute en una fecha futura concreta,
**Para** garantizar que un pago puntual se realiza en el momento adecuado sin intervención manual.

**Story Points:** 4 | **Prioridad:** Alta | **Dependencias:** US-1501

#### Criterios de Aceptación

```gherkin
Scenario: Programar transferencia propia a fecha futura exitosa
  Given usuario autenticado con saldo en cuenta origen y OTP válido
  When POST /api/v1/scheduled-transfers con
    { type: "ONCE", sourceAccountId, targetType: "OWN", targetAccountId,
      amount: 500.00, concept: "Traspaso ahorro", nextExecutionDate: "2026-04-15",
      otpCode: "123456" }
  Then HTTP 201 con { scheduledTransferId, status: "ACTIVE", nextExecutionDate: "2026-04-15" }
  And la transferencia NO se ejecuta de inmediato
  And audit_log registra SCHEDULED_TRANSFER_CREATED con userId, importe y fecha

Scenario: Programar transferencia a beneficiario guardado
  Given usuario con beneficiario id=ben-001 activo
  When POST con { type: "ONCE", targetType: "BENEFICIARY", beneficiaryId: "ben-001",
    amount: 250.00, nextExecutionDate: "2026-04-05", otpCode: "654321" }
  Then HTTP 201 y beneficiaryId vinculado en la scheduled_transfer

Scenario: Fecha pasada o igual a hoy es rechazada
  When nextExecutionDate = fecha de ayer o de hoy
  Then HTTP 422 INVALID_EXECUTION_DATE: "La fecha debe ser al menos mañana"
  And la scheduled_transfer NO se persiste

Scenario: OTP inválido rechaza la creación
  When otpCode incorrecto en el request
  Then HTTP 401 OTP_INVALID
  And la scheduled_transfer NO se persiste

Scenario: Importe supera límite por operación
  Given límite por operación = 2.000€
  When amount = 3.000€
  Then HTTP 422 OPERATION_LIMIT_EXCEEDED
  And la scheduled_transfer NO se persiste

Scenario: Cancelar transferencia programada antes de ejecución
  Given scheduled_transfer con status=ACTIVE y nextExecutionDate en el futuro
  When DELETE /api/v1/scheduled-transfers/{id}
  Then status=CANCELLED
  And audit_log registra SCHEDULED_TRANSFER_CANCELLED
  And no se ejecuta en la fecha prevista

Scenario: Listar transferencias programadas del usuario
  Given usuario con 3 scheduled_transfers (2 ACTIVE, 1 CANCELLED)
  When GET /api/v1/scheduled-transfers?status=ACTIVE
  Then retorna array con 2 items ordenados por nextExecutionDate ASC
  And cada item incluye: id, type, amount, concept, nextExecutionDate, status
```

#### DoD
- `CreateScheduledTransferUseCase` + `CancelScheduledTransferUseCase` implementados
- Validación OTP y límites de transferencia verificados en tests unitarios
- ≥ 5 escenarios de tests — happy path + errores + listado

---

### US-1503 — Transferencias recurrentes — configuración y cálculo

**Como** cliente de Banco Meridian,
**Quiero** configurar una transferencia que se repita automáticamente con cadencia semanal, quincenal o mensual,
**Para** automatizar pagos periódicos sin intervención manual en cada ciclo.

**Story Points:** 4 | **Prioridad:** Alta | **Dependencias:** US-1501, US-1502

#### Criterios de Aceptación

```gherkin
Scenario: Configurar recurrente mensual indefinida
  When POST con { type: "MONTHLY", amount: 800.00, concept: "Alquiler",
    nextExecutionDate: "2026-04-01", otpCode: "111222" }
  Then HTTP 201 con { type: "MONTHLY", nextExecutionDate: "2026-04-01" }
  And end_date=null, max_executions=null → recurrente indefinida hasta cancelación

Scenario: Configurar recurrente semanal con máximo de ejecuciones
  When POST con { type: "WEEKLY", nextExecutionDate: "2026-04-07", maxExecutions: 12 }
  Then max_executions=12, executions_done=0
  And al alcanzar 12 ejecuciones exitosas el status → COMPLETED automáticamente

Scenario: Configurar recurrente quincenal con fecha fin
  When POST con { type: "BIWEEKLY", nextExecutionDate: "2026-04-01", endDate: "2026-12-31" }
  Then end_date=2026-12-31 persiste correctamente
  And si next_execution_date calculada > end_date → status → COMPLETED

Scenario: Cálculo MONTHLY correcto — último día del mes
  Given scheduled_transfer MONTHLY con nextExecutionDate=2026-01-31
  When el scheduler ejecuta con éxito
  Then next_execution_date = 2026-02-28 (último día de febrero 2026)
  And en el ciclo siguiente: 2026-03-31

Scenario: Cálculo MONTHLY correcto — año bisiesto
  Given scheduled_transfer MONTHLY con nextExecutionDate=2026-01-31
  When ciclos sucesivos alcanzan enero 2028
  Then next_execution_date = 2028-02-29 (año bisiesto)

Scenario: Cálculo WEEKLY — mismo día de la semana
  Given nextExecutionDate=2026-03-31 (martes)
  When el scheduler ejecuta
  Then next_execution_date = 2026-04-07 (martes siguiente)

Scenario: Cálculo BIWEEKLY — 14 días exactos
  Given nextExecutionDate=2026-04-01
  When el scheduler ejecuta
  Then next_execution_date = 2026-04-15

Scenario: Pausar recurrente activa
  Given scheduled_transfer ACTIVE
  When PATCH /api/v1/scheduled-transfers/{id} con { status: "PAUSED" }
  Then status=PAUSED y scheduler la ignora en próximos ciclos
  And audit_log registra SCHEDULED_TRANSFER_PAUSED

Scenario: Reactivar recurrente pausada con next_execution_date pasada
  Given scheduled_transfer PAUSED con nextExecutionDate=2026-03-01 (pasada)
  When PATCH con { status: "ACTIVE" }
  Then next_execution_date se recalcula desde hoy según la cadencia
  And status=ACTIVE
```

#### DoD
- `NextExecutionDateCalculator` con 100% cobertura de ramas
- Tests con `Clock.fixed()` — sin dependencia de fecha real
- Suite de 50 casos: todos los tipos × meses cortos × bisiesto × límites
- `UpdateScheduledTransferUseCase` implementado

---

### US-1504 — Motor de ejecución automático (scheduler + job)

**Como** sistema BankPortal,
**Quiero** ejecutar automáticamente las transferencias programadas en su fecha de ejecución,
**Para** que el cliente no tenga que recordar ni ejecutar manualmente sus pagos configurados.

**Story Points:** 4 | **Prioridad:** Alta | **Dependencias:** US-1501, US-1502, US-1503

#### Criterios de Aceptación

```gherkin
Scenario: Scheduler ejecuta todas las transferencias vencidas del día
  Given 5 scheduled_transfers ACTIVE con nextExecutionDate <= hoy
  When el scheduler se dispara a las 06:00 UTC
  Then las 5 se procesan en orden nextExecutionDate ASC
  And cada una genera un registro en scheduled_transfer_executions
  And el procesamiento completo tarda < 30 segundos

Scenario: Ejecución exitosa actualiza estado y notifica
  Given scheduled_transfer MONTHLY id=st-001 con nextExecutionDate=hoy
  When el scheduler la procesa
  Then TransferUseCase se invoca con source/target/amount/concept de la programada
  And execution persiste con status=SUCCESS y transfer_id referenciado
  And next_execution_date se recalcula al mes siguiente
  And executions_done se incrementa en 1
  And notificación push + email: "Transferencia programada ejecutada: 800.00€ — Alquiler"
  And audit_log registra SCHEDULED_TRANSFER_EXECUTED

Scenario: Fallo por saldo insuficiente — pausa y reintento
  Given scheduled_transfer con amount=500€ y saldo=200€
  When el scheduler la procesa
  Then execution con status=FAILED, error_code=INSUFFICIENT_FUNDS
  And scheduled_transfer status → PAUSED
  And retry_at = now + 2 horas
  And segundo intento tras 2h: si sigue fallando → queda PAUSED sin más reintentos
  And notificación push + email urgente al usuario
  And audit_log registra SCHEDULED_TRANSFER_FAILED

Scenario: Fallo por core bancario no disponible
  Given BankCoreRestAdapter lanza CoreUnavailableException
  When el scheduler procesa la transferencia
  Then execution con status=SKIPPED, error_code=CORE_UNAVAILABLE
  And scheduled_transfer NO se pausa — se reintenta en el próximo ciclo (24h)
  And NO se notifica al usuario (fallo transitorio)

Scenario: Idempotencia — job relanzado no duplica ejecuciones
  Given scheduled_transfer id=st-001 con execution SUCCESS del día de hoy
  When el scheduler se lanza de nuevo (crash recovery)
  Then st-001 NO se procesa de nuevo
  And NO se genera segunda execution para hoy

Scenario: Recurrente ONCE completa tras ejecución exitosa
  Given scheduled_transfer type=ONCE, status=ACTIVE
  When el scheduler la ejecuta con éxito
  Then status → COMPLETED, next_execution_date → null
  And notificación: "Tu transferencia programada ha sido ejecutada"

Scenario: Recurrente completa al alcanzar max_executions
  Given WEEKLY con max_executions=4, executions_done=3
  When el scheduler ejecuta la cuarta vez con éxito
  Then executions_done=4, status=COMPLETED
  And notificación: "Tu transferencia recurrente ha completado todas sus ejecuciones"

Scenario: Fallo por beneficiario eliminado — pausa sin reintento
  Given recurrente con beneficiaryId de un beneficiario eliminado (soft delete)
  When el scheduler procesa
  Then execution status=FAILED, error_code=BENEFICIARY_NOT_FOUND
  And scheduled_transfer status → PAUSED (no se reintenta)
  And notificación con mensaje: "Revisa tu transferencia programada — destinatario no disponible"
```

#### DoD
- `ScheduledTransferJobService` con `@Scheduled(cron = "0 0 6 * * *")`
- `ExecuteScheduledTransferUseCase` — lógica aislada y testeable
- Test IT de idempotencia con Testcontainers (doble ejecución → 1 sola execution)
- Test de carga unitario: 1.000 transferencias mock procesadas en < 30s

---

### US-1505 — Frontend Angular — Gestión de transferencias programadas

**Como** cliente de Banco Meridian,
**Quiero** ver y gestionar mis transferencias programadas desde el portal,
**Para** tener control y visibilidad completos sobre los pagos automatizados en mi cuenta.

**Story Points:** 3 | **Prioridad:** Alta | **Dependencias:** US-1502, US-1503, US-1504

#### Criterios de Aceptación

```gherkin
Scenario: Ver lista de transferencias programadas con filtros
  Given usuario con 4 scheduled_transfers (2 ACTIVE, 1 PAUSED, 1 COMPLETED)
  When navega a Transferencias → Programadas
  Then ve tabs: Todas / Activas / Pausadas / Completadas
  And cada tarjeta muestra: importe, concepto, destinatario, próxima ejecución,
    frecuencia, estado con color codificado
  And las ACTIVE muestran: "Próxima: en 3 días"

Scenario: Crear transferencia programada — wizard
  Given usuario en Nueva Programada
  When completa wizard: Tipo (Única/Recurrente) → Datos → Confirmación OTP
  Then ve resumen antes de confirmar
  When introduce OTP válido
  Then POST /api/v1/scheduled-transfers se invoca
  And la nueva programada aparece en la lista
  And toast: "Transferencia programada creada correctamente"

Scenario: Pausar programada desde la lista
  Given scheduled_transfer ACTIVE
  When hace clic en "Pausar" y confirma el diálogo (sin OTP)
  Then PATCH /{id} con { status: "PAUSED" }
  And el estado visual cambia a PAUSED inmediatamente
  And el botón pasa a "Reactivar"

Scenario: Cancelar programada
  Given scheduled_transfer ACTIVE
  When hace clic en "Cancelar" y confirma
  Then DELETE /{id}
  And la tarjeta desaparece de la lista ACTIVE

Scenario: Ver historial de ejecuciones
  Given scheduled_transfer con 3 ejecuciones registradas
  When hace clic en "Ver historial"
  Then panel lateral con fecha, importe, estado (SUCCESS/FAILED) y referencia
  And ejecuciones FAILED muestran motivo en tooltip

Scenario: Responsive en móvil
  Given viewport < 768px
  When accede a Transferencias → Programadas
  Then lista en tarjetas apiladas — no tabla
  And formulario usable con teclado móvil
  And WCAG 2.1 AA verificado (contraste, labels, focus)
```

#### DoD
- `ScheduledTransfersModule` lazy-loaded en ruta `/transfers/scheduled`
- Componentes: List, Card, Create (wizard), History
- `ScheduledTransferService` Angular con tipado correcto
- Reutiliza `OtpConfirmationComponent` y `BeneficiaryPickerComponent`
- Tests de componente con `TestBed` — ≥ 5 escenarios
- WCAG 2.1 AA verificado con axe-core

---

## 10. Requerimientos No Funcionales — Resumen

> Ver sección 6 para criterios medibles completos.

| Área | Requisito clave |
|---|---|
| Rendimiento | Scheduler ≤ 30s / 1.000 transferencias |
| Fiabilidad | Idempotencia: 0 duplicados en 100 ejecuciones |
| Exactitud | `NextExecutionDateCalculator`: 100% corrección en 50 casos |
| Seguridad | OTP en creación · Acceso filtrado por userId · PSD2 RTS Art.10 |
| Auditabilidad | 100% eventos lifecycle en audit_log |
| Accesibilidad | WCAG 2.1 AA en Angular UI |

---

## 11. Matriz de Trazabilidad (RTM)

| ID US | Proceso de negocio | RF vinculados | RNF vinculados | Componente Arq. | Caso de prueba | Estado |
|---|---|---|---|---|---|---|
| US-1501 | Persistencia de programadas | RF-1501 | RNF-1504, RNF-1505 | Flyway V17 · JPA entities | TC-1501-x | DRAFT |
| US-1502 | Programar pago único futuro | RF-1502, RF-1503, RF-1504, RF-1509, RF-1517 | RNF-1502, RNF-1506, RNF-1507, RNF-1508 | CreateScheduledTransferUseCase | TC-1502-x | DRAFT |
| US-1503 | Automatizar pagos recurrentes | RF-1505, RF-1506, RF-1507, RF-1508, RF-1520 | RNF-1505, RNF-1510 | NextExecutionDateCalculator · UpdateScheduledTransferUseCase | TC-1503-x | DRAFT |
| US-1504 | Ejecución automática del scheduler | RF-1510, RF-1511, RF-1512, RF-1513, RF-1514, RF-1515, RF-1516 | RNF-1501, RNF-1503, RNF-1504, RNF-1508 | ScheduledTransferJobService · ExecuteScheduledTransferUseCase | TC-1504-x | DRAFT |
| US-1505 | Gestión desde portal Angular | RF-1517, RF-1518, RF-1519 | RNF-1509 | ScheduledTransfersModule Angular | TC-1505-x | DRAFT |

*Columnas Componente Arq. y Caso de prueba se completan en Step 3 (Architect) y Step 6 (QA Tester) respectivamente.*

---

## 12. Definition of Done aplicable

**Base SOFIA (todos los items):**
- [ ] Código implementado y revisado (Code Reviewer — Step 5)
- [ ] Tests unitarios escritos — cobertura application ≥ 80%
- [ ] Tests de integración con Testcontainers pasando
- [ ] Documentación técnica actualizada (OpenAPI + Confluence)
- [ ] Aprobado por QA Lead (Step 6)
- [ ] Pipeline CI/CD verde en STG (Step 7)
- [ ] Aprobación Product Owner en demo (Step 9)

**Específico FEAT-015:**
- [ ] `NextExecutionDateCalculator` — 100% cobertura de ramas
- [ ] Idempotencia scheduler verificada con test IT
- [ ] DEBT-027, DEBT-028, DEBT-029 cerradas
- [ ] R-016-05 load test SSE ejecutado y documentado
- [ ] ADR-026 y ADR-027 firmados por Tech Lead
- [ ] WCAG 2.1 AA verificado con axe-core

---

*SOFIA Requirements Analyst Agent — Sprint 17 · FEAT-015*
*CMMI Level 3 — RD SP 1.1 · RD SP 2.1 · RD SP 3.1*
*BankPortal — Banco Meridian — 2026-03-24*
