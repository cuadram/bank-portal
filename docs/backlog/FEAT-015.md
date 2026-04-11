# FEAT-015 — Transferencias Programadas y Recurrentes

## Metadata

| Campo | Valor |
|---|---|
| Feature ID | FEAT-015 |
| Proyecto | BankPortal — Banco Meridian |
| Prioridad | ALTA (P1) |
| Estado | READY FOR SPRINT |
| Epic | Operaciones Bancarias |
| Solicitante | Producto Digital + Operaciones — Banco Meridian |
| Fecha creación | 2026-03-24 |
| Stack | Java/Spring Boot (backend) + Angular 17 (frontend) |
| Rama git | `feature/FEAT-015-sprint17` |
| Sprint | 17 |
| SP feature | 17 SP |
| SP deuda incluida | 7 SP (DEBT-027 + DEBT-028 + DEBT-029 + Load test SSE) |
| SP total sprint | 24 SP |
| Release objetivo | v1.17.0 |

---

## Descripción de negocio

Con el motor de transferencias operativo (FEAT-008/009) y el sistema de
notificaciones push activo (FEAT-014), el siguiente paso natural en la épica
de Operaciones Bancarias es permitir al usuario **automatizar transferencias
que se repiten en el tiempo** — sin necesidad de ejecutarlas manualmente cada vez.

FEAT-015 introduce dos capacidades complementarias:

1. **Transferencias programadas** — el usuario fija una fecha futura concreta
   para ejecutar una transferencia. Útil para pagos puntuales diferidos
   (alquiler del mes siguiente, regalo de cumpleaños, etc.).

2. **Transferencias recurrentes** — el usuario configura una cadencia de
   repetición (semanal, quincenal, mensual) con fecha de inicio y, opcionalmente,
   fecha de fin o número de ejecuciones. El sistema las ejecuta automáticamente
   en cada fecha calculada.

Ambas se integran con FEAT-014 para enviar notificación push y email en cada
ejecución, y con FEAT-008 para reutilizar el motor de transferencias, límites
y auditoría existentes.

---

## Objetivo y valor de negocio

- **Automatización financiera**: elimina la necesidad de recordar y ejecutar
  manualmente transferencias periódicas (alquiler, mensualidades, cuotas).
- **Reducción churn**: usuarios con recurrentes activas tienen 3× mayor retención
  en plataformas bancarias (benchmark sector).
- **Reducción carga operativa**: estimación Banco Meridian ≥ 20% menos
  llamadas de consulta por "¿se ha pagado ya?".
- **Diferenciación competitiva**: funcionalidad estándar en banca digital que
  completa el catálogo mínimo viable de un portal bancario moderno.
- **Cumplimiento PSD2 Art. 66 + RTS Art. 10**: la SCA (OTP) se exige en el
  momento de *configurar* la recurrencia, no en cada ejecución automática
  posterior — patrón reconocido por EBA para pagos recurrentes iniciados
  por el propio usuario.

**KPIs de éxito:**
- ≥ 15% de usuarios activos con al menos 1 recurrente configurada en 60 días.
- Tasa de fallo de ejecución ≤ 0.5% (saldo insuficiente excluido).
- Tiempo de ejecución del scheduler ≤ 30s para 1.000 transferencias pendientes.

---

## Alcance funcional

### Incluido en FEAT-015
- Modelo de datos `scheduled_transfers` + `scheduled_transfer_executions` (Flyway V17)
- Programar transferencia a fecha futura única (propia o a beneficiario)
- Configurar transferencia recurrente: semanal / quincenal / mensual
- Motor de ejecución automático (Spring `@Scheduled` + job idempotente)
- Gestión desde frontend: listar, editar, pausar, cancelar programadas
- Notificación push + email en cada ejecución exitosa o fallida
- Auditoría completa en `audit_log` por cada ejecución
- Gestión de fallos: reintento único, luego notificación al usuario

### Excluido (backlog futuro)
- Transferencias SEPA/SWIFT internacionales recurrentes (FEAT-016)
- Domiciliaciones externas iniciadas por terceros (mandatos SEPA Direct Debit)
- Reglas de ejecución condicionales ("si saldo > X, transfiere Y")
- Aprobación multifirma para recurrentes de alto importe

---

## Dependencias técnicas

| Dependencia | Tipo | Estado |
|---|---|---|
| `TransferUseCase` + `TransferToBeneficiaryUseCase` (FEAT-008) | Core | ✅ Operativo |
| `BankCoreRestAdapter` + circuit breaker (FEAT-009) | Integración | ✅ Operativo |
| `TransferLimitValidationService` (FEAT-008) | Validación | ✅ Operativo |
| `WebPushService` + `EmailChannelService` (FEAT-014) | Notificaciones | ✅ Operativo |
| `audit_log` inmutable (FEAT-005) | Auditoría | ✅ Operativo |
| Flyway V16 (FEAT-014) mergeado en develop | BD | ✅ Pre-req día 1 |
| Flyway V17: `scheduled_transfers` + `scheduled_transfer_executions` | BD | Sprint 17 día 1 |
| Spring Boot `@EnableScheduling` — habilitar en módulo scheduling | Config | Sprint 17 día 1 |
| DEBT-027 (domain events) — precede al desarrollo de listeners | Arch | Sprint 17 S1 |
| DEBT-028 (cifrado push auth) — CVSS 4.1, must completarse S17 | Security | Sprint 17 S1 |

---

## Deuda técnica del sprint (7 SP)

Los siguientes ítems de deuda se resuelven dentro de Sprint 17 antes o en
paralelo al desarrollo de FEAT-015. Se gestionan como tareas separadas en
el sprint backlog pero forman parte del mismo sprint goal.

| ID | Descripción | SP | Área | Semana |
|---|---|---|---|---|
| DEBT-027 | Domain events a paquetes de dominio correctos | 2 | Arch | S1 |
| DEBT-028 | Cifrar `push_subscriptions.auth` + `p256dh` AES-256-GCM | 3 | Security | S1 |
| DEBT-029 | Footer email RGPD Art.7 — enlace preferencias | 1 | Compliance | S1 |
| R-016-05 | Load test SSE — >500 conexiones concurrentes | 1 | DevOps/QA | S2 |

**Total deuda: 7 SP**

---

## User Stories FEAT-015

| ID | Título | SP | Prioridad | Semana |
|---|---|---|---|---|
| US-1501 | Modelo de datos + Flyway V17 | 2 | Must Have | S1 día 1 |
| US-1502 | Programar transferencia a fecha futura | 4 | Must Have | S1 |
| US-1503 | Transferencias recurrentes — configuración y cálculo | 4 | Must Have | S1–S2 |
| US-1504 | Motor de ejecución automático (scheduler + job) | 4 | Must Have | S2 |
| US-1505 | Frontend Angular — gestión de programadas | 3 | Must Have | S2 |

**Total FEAT-015: 17 SP**

---

## User Stories — detalle completo

---

### US-1501 — Modelo de datos + Flyway V17

**Como** sistema BankPortal,
**quiero** disponer de las tablas de persistencia para transferencias programadas
y su historial de ejecuciones,
**para** soportar toda la lógica de programación y trazabilidad de ejecuciones.

**Estimación:** 2 SP | **Prioridad:** Must Have | **Semana:** S1 día 1 — bloqueante

#### Criterios de aceptación

```gherkin
Scenario: Flyway V17 crea tablas scheduled_transfers y scheduled_transfer_executions
  Given entorno PostgreSQL con V16 aplicada
  When se ejecuta V17__scheduled_transfers.sql
  Then existe scheduled_transfers con columnas:
    id (UUID PK), user_id (FK users), type (ENUM: ONCE, WEEKLY, BIWEEKLY, MONTHLY),
    source_account_id (UUID FK), target_type (ENUM: OWN, BENEFICIARY),
    target_account_id (UUID nullable), beneficiary_id (UUID nullable FK beneficiaries),
    amount (NUMERIC 15,2), concept (VARCHAR 140), currency (CHAR 3 default EUR),
    next_execution_date (DATE NOT NULL), end_date (DATE nullable),
    max_executions (INT nullable), executions_done (INT default 0),
    status (ENUM: ACTIVE, PAUSED, CANCELLED, COMPLETED),
    created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ)
  And existe scheduled_transfer_executions con columnas:
    id (UUID PK), scheduled_transfer_id (UUID FK), executed_at (TIMESTAMPTZ),
    status (ENUM: SUCCESS, FAILED, SKIPPED), error_code (VARCHAR nullable),
    transfer_id (UUID nullable FK transfers), amount (NUMERIC 15,2),
    next_scheduled_date (DATE nullable)
  And índices en: scheduled_transfers(user_id), scheduled_transfers(next_execution_date, status),
    scheduled_transfer_executions(scheduled_transfer_id)

Scenario: Entidades JPA y repositorios operativos
  Given Flyway V17 aplicada
  When se instancia ScheduledTransferRepository
  Then Spring Data JPA resuelve la entidad correctamente
  And los tests de repositorio con Testcontainers pasan

Scenario: Valores por defecto coherentes
  Given nueva scheduled_transfer insertada sin end_date ni max_executions
  When se consulta
  Then status=ACTIVE, executions_done=0, currency=EUR
  And la restricción CHECK (target_account_id IS NOT NULL OR beneficiary_id IS NOT NULL) se cumple
```

#### Notas técnicas
- `V17__scheduled_transfers.sql` en `src/main/resources/db/migration/`
- Enum types PostgreSQL: `CREATE TYPE scheduled_type AS ENUM ('ONCE','WEEKLY','BIWEEKLY','MONTHLY')`
- Constraint: `CHECK (target_type = 'OWN' AND target_account_id IS NOT NULL) OR (target_type = 'BENEFICIARY' AND beneficiary_id IS NOT NULL)`
- Entidades: `ScheduledTransfer` + `ScheduledTransferExecution` con `@Enumerated(EnumType.STRING)`
- Repositorios: `ScheduledTransferRepository` · `ScheduledTransferExecutionRepository`
- Query clave: `findByStatusAndNextExecutionDateLessThanEqual(ACTIVE, today)` — usado por el scheduler

---

### US-1502 — Programar transferencia a fecha futura

**Como** usuario autenticado,
**quiero** programar una transferencia para que se ejecute en una fecha futura concreta,
**para** garantizar que un pago se realiza en el momento adecuado sin tener que
estar pendiente de hacerlo manualmente.

**Estimación:** 4 SP | **Prioridad:** Must Have | **Semana:** S1

#### Criterios de aceptación

```gherkin
Scenario: Programar transferencia propia a fecha futura
  Given usuario autenticado con saldo suficiente en cuenta origen
  When POST /api/v1/scheduled-transfers con:
    { type: "ONCE", sourceAccountId, targetType: "OWN", targetAccountId,
      amount: 500.00, concept: "Traspaso ahorro", nextExecutionDate: "2026-04-01",
      otpCode: "123456" }
  Then HTTP 201 con { scheduledTransferId, status: "ACTIVE", nextExecutionDate }
  And la transferencia queda en scheduled_transfers con status=ACTIVE
  And NO se ejecuta inmediatamente — queda pendiente para el scheduler
  And audit_log registra SCHEDULED_TRANSFER_CREATED con userId, importe, fecha

Scenario: Programar transferencia a beneficiario guardado
  Given usuario con beneficiario id=ben-001 guardado
  When POST /api/v1/scheduled-transfers con:
    { type: "ONCE", sourceAccountId, targetType: "BENEFICIARY",
      beneficiaryId: "ben-001", amount: 250.00, concept: "Alquiler abril",
      nextExecutionDate: "2026-04-05", otpCode: "654321" }
  Then HTTP 201 con scheduledTransferId
  And beneficiaryId queda vinculado en la scheduled_transfer

Scenario: Fecha de ejecución no puede ser pasada ni hoy
  Given usuario intenta programar con nextExecutionDate = fecha de ayer
  When envía el request
  Then HTTP 422 INVALID_EXECUTION_DATE: "La fecha debe ser al menos mañana"

Scenario: OTP incorrecto rechaza la programación
  Given usuario envía OTP inválido
  When POST /api/v1/scheduled-transfers
  Then HTTP 401 OTP_INVALID — la scheduled_transfer NO se persiste

Scenario: Límites de transferencia validados en el momento de programar
  Given usuario con límite por operación de 2.000€
  When intenta programar 3.000€
  Then HTTP 422 OPERATION_LIMIT_EXCEEDED
  And la scheduled_transfer NO se persiste

Scenario: Consultar transferencias programadas del usuario
  Given usuario con 3 scheduled_transfers activas
  When GET /api/v1/scheduled-transfers?status=ACTIVE
  Then retorna array con las 3, ordenadas por nextExecutionDate ASC
  And cada item incluye: id, type, amount, concept, nextExecutionDate, status, targetSummary

Scenario: Cancelar transferencia programada antes de ejecutarse
  Given scheduled_transfer con status=ACTIVE y nextExecutionDate en el futuro
  When DELETE /api/v1/scheduled-transfers/{id}
  Then status cambia a CANCELLED
  And audit_log registra SCHEDULED_TRANSFER_CANCELLED
  And NO se ejecuta en la fecha prevista
```

#### Notas técnicas
- `CreateScheduledTransferUseCase` — valida OTP, límites, fecha, luego persiste
- `CancelScheduledTransferUseCase` — soft-cancel (status → CANCELLED, no delete físico)
- `GetScheduledTransfersUseCase` — listado paginado por userId y status
- Request DTO: `CreateScheduledTransferRequest` con validaciones `@NotNull`, `@FutureOrPresent`, `@Positive`
- OTP verification reutiliza `OtpVerificationService` (FEAT-001) — misma estrategia que transfers
- Endpoints REST:
  - `POST /api/v1/scheduled-transfers`
  - `GET /api/v1/scheduled-transfers` (+ `?status=ACTIVE|PAUSED|CANCELLED|COMPLETED`)
  - `GET /api/v1/scheduled-transfers/{id}`
  - `DELETE /api/v1/scheduled-transfers/{id}` (cancelar)
  - `PATCH /api/v1/scheduled-transfers/{id}` (editar concepto o pausar)
- Tests: 6 escenarios unitarios + 2 IT con Testcontainers

---

### US-1503 — Transferencias recurrentes — configuración y cálculo

**Como** usuario autenticado,
**quiero** configurar una transferencia que se repita automáticamente cada semana,
quincena o mes durante un período definido,
**para** automatizar pagos periódicos (alquiler, cuota gimnasio, pensión familiar)
sin intervención manual en cada ciclo.

**Estimación:** 4 SP | **Prioridad:** Must Have | **Semana:** S1–S2

#### Criterios de aceptación

```gherkin
Scenario: Configurar recurrente mensual sin fecha fin
  Given usuario autenticado
  When POST /api/v1/scheduled-transfers con:
    { type: "MONTHLY", sourceAccountId, targetType: "BENEFICIARY",
      beneficiaryId: "ben-001", amount: 800.00, concept: "Alquiler",
      nextExecutionDate: "2026-04-01", otpCode: "111222" }
  Then HTTP 201 con { scheduledTransferId, type: "MONTHLY", nextExecutionDate: "2026-04-01" }
  And end_date=null y max_executions=null → recurrente indefinida

Scenario: Configurar recurrente semanal con máximo de ejecuciones
  When POST con { type: "WEEKLY", maxExecutions: 12, nextExecutionDate: "2026-03-31", ... }
  Then scheduled_transfer persiste con max_executions=12, executions_done=0
  And tras 12 ejecuciones exitosas el status cambia automáticamente a COMPLETED

Scenario: Configurar recurrente quincenal con fecha fin
  When POST con { type: "BIWEEKLY", nextExecutionDate: "2026-04-01",
    endDate: "2026-12-31", ... }
  Then scheduled_transfer persiste con end_date=2026-12-31
  And si nextExecutionDate calculada > end_date → status pasa a COMPLETED

Scenario: Cálculo correcto de next_execution_date tras ejecución exitosa
  Given scheduled_transfer MONTHLY con nextExecutionDate=2026-04-30
  When el scheduler ejecuta con éxito
  Then next_execution_date se actualiza a 2026-05-31 (último día del mes siguiente)
  And executions_done se incrementa en 1

Scenario: Cálculo WEEKLY — siempre mismo día de la semana
  Given scheduled_transfer WEEKLY con nextExecutionDate=2026-03-31 (martes)
  When se ejecuta
  Then next_execution_date = 2026-04-07 (martes siguiente)

Scenario: Cálculo BIWEEKLY — intervalos de 14 días exactos
  Given scheduled_transfer BIWEEKLY con nextExecutionDate=2026-04-01
  When se ejecuta
  Then next_execution_date = 2026-04-15 (14 días después)

Scenario: Pausar recurrente activa
  Given scheduled_transfer con status=ACTIVE
  When PATCH /api/v1/scheduled-transfers/{id} con { status: "PAUSED" }
  Then status=PAUSED
  And el scheduler NO la ejecuta mientras esté pausada
  And audit_log registra SCHEDULED_TRANSFER_PAUSED

Scenario: Reactivar recurrente pausada
  Given scheduled_transfer con status=PAUSED
  When PATCH con { status: "ACTIVE" }
  Then status=ACTIVE y el scheduler la procesa en la próxima ejecución elegible
  And si nextExecutionDate ya pasó → se recalcula a partir de hoy según la cadencia
```

#### Notas técnicas
- `NextExecutionDateCalculator` — servicio de cálculo puro (sin dependencias de BD):
  - `ONCE` → null (no recalcula — scheduler la marca COMPLETED)
  - `WEEKLY` → `nextDate.plusWeeks(1)`
  - `BIWEEKLY` → `nextDate.plusWeeks(2)`
  - `MONTHLY` → `nextDate.plusMonths(1)` con `TemporalAdjusters.lastDayOfMonth()` si el día original es ≥ 29
- Caso especial "último día de mes": si la transferencia fue creada el 31/01, en meses con menos días → siempre al último día del mes (no al día 31 fijo).
- `NextExecutionDateCalculator` es testeable en aislamiento — 100% cobertura requerida.
- `UpdateScheduledTransferUseCase` — gestiona PATCH (pausa, reactivación, edición de concepto)
- No se permite editar `amount` ni `targetAccountId`/`beneficiaryId` una vez creada (requería nuevo OTP y sería una nueva scheduled_transfer). Documentado en la API.

---

### US-1504 — Motor de ejecución automático (scheduler + job)

**Como** sistema BankPortal,
**quiero** ejecutar automáticamente las transferencias programadas en su fecha
de ejecución,
**para** que el usuario no tenga que estar pendiente de ejecutarlas manualmente.

**Estimación:** 4 SP | **Prioridad:** Must Have | **Semana:** S2

#### Criterios de aceptación

```gherkin
Scenario: Scheduler ejecuta todas las transferencias vencidas una vez al día
  Given 5 scheduled_transfers con status=ACTIVE y nextExecutionDate <= hoy
  When el scheduler se dispara a las 06:00 UTC
  Then las 5 transferencias se procesan en orden (por nextExecutionDate ASC)
  And cada una genera una entrada en scheduled_transfer_executions
  And el procesamiento es idempotente — relanzar el job no duplica ejecuciones

Scenario: Ejecución exitosa actualiza estado y notifica
  Given scheduled_transfer MONTHLY id=st-001 con nextExecutionDate=hoy
  When el scheduler la procesa
  Then TransferUseCase (o TransferToBeneficiaryUseCase) se invoca con los datos
  And scheduled_transfer_execution persiste con status=SUCCESS, transfer_id referenciado
  And scheduled_transfer.next_execution_date se recalcula (o status=COMPLETED si ONCE)
  And scheduled_transfer.executions_done += 1
  And notificación push + email: "Transferencia programada ejecutada: 800.00€ a Alquiler"
  And audit_log registra SCHEDULED_TRANSFER_EXECUTED

Scenario: Fallo por saldo insuficiente — reintento y notificación
  Given scheduled_transfer con amount=500€ pero saldo disponible=200€
  When el scheduler la procesa
  Then la ejecución falla con error_code=INSUFFICIENT_FUNDS
  And scheduled_transfer_execution persiste con status=FAILED, error_code=INSUFFICIENT_FUNDS
  And el scheduler reintenta UNA vez tras 2 horas
  And si el segundo intento también falla → status scheduled_transfer → PAUSED
  And notificación push + email urgente: "No se ha podido ejecutar tu transferencia programada: saldo insuficiente"
  And audit_log registra SCHEDULED_TRANSFER_FAILED

Scenario: Fallo por beneficiario eliminado
  Given scheduled_transfer recurrente con beneficiaryId=ben-002 (eliminado)
  When el scheduler la procesa
  Then falla con error_code=BENEFICIARY_NOT_FOUND
  And status → PAUSED (no se reintenta — requiere acción manual del usuario)
  And notificación con instrucción: "Revisa tu transferencia programada a 'Alquiler'"

Scenario: Fallo por core bancario no disponible
  Given core bancario con circuit breaker OPEN
  When el scheduler intenta ejecutar
  Then scheduled_transfer_execution status=SKIPPED, error_code=CORE_UNAVAILABLE
  And scheduled_transfer NO se pausa — se reintenta en el próximo ciclo (24h)
  And NO se notifica al usuario (fallo transitorio de infraestructura)

Scenario: Idempotencia — job relanzado no duplica
  Given scheduled_transfer id=st-001 ya ejecutada hoy (execution con status=SUCCESS)
  When el scheduler se lanza de nuevo (crash recovery)
  Then la scheduled_transfer NO se procesa de nuevo
  And NO se genera segunda scheduled_transfer_execution para hoy

Scenario: Completar recurrente al alcanzar max_executions
  Given scheduled_transfer WEEKLY con max_executions=4, executions_done=3
  When el scheduler la ejecuta (cuarta ejecución)
  Then executions_done=4, status=COMPLETED
  And next_execution_date=null
  And notificación: "Tu transferencia recurrente 'Ahorro semanal' ha completado todas sus ejecuciones"

Scenario: Completar recurrente al superar end_date
  Given scheduled_transfer MONTHLY con end_date=2026-04-30
  When el scheduler calcula next_execution_date = 2026-05-31 (> end_date)
  Then status=COMPLETED inmediatamente tras la ejecución de abril
  And NO se programa ejecución en mayo
```

#### Notas técnicas
- `ScheduledTransferJobService` anotado con `@Scheduled(cron = "0 0 6 * * *")` — 06:00 UTC diario
- `@EnableScheduling` en `BankPortalApplication` o módulo dedicado `SchedulingConfig`
- **Idempotencia**: antes de procesar cada `scheduled_transfer`, verificar si ya existe una `scheduled_transfer_execution` con `executed_at >= today 00:00 UTC` y `status=SUCCESS` → skip.
- **Transaccionalidad por unidad**: cada scheduled_transfer se procesa en su propia `@Transactional`. Un fallo en una no afecta al resto del batch.
- **Orden de procesamiento**: `ORDER BY next_execution_date ASC` — las más antiguas primero.
- **Separación de responsabilidades**:
  - `ScheduledTransferJobService` → orquestación del batch
  - `ExecuteScheduledTransferUseCase` → lógica de una ejecución individual (reutiliza `TransferUseCase`)
  - `ScheduledTransferNotificationService` → envío de notificaciones (llama a `WebPushService` + `EmailChannelService` de FEAT-014)
- **Circuit breaker del core**: si `BankCoreRestAdapter` lanza `CoreUnavailableException` → execution status=SKIPPED, NO pausar.
- **Reintento por saldo insuficiente**: usar `@Scheduled` con delay de 2h o persisitir `retry_at` en `scheduled_transfer_executions`.
- Tests: unitarios con mock del clock (`Clock.fixed(...)`) + IT con Testcontainers + test del `NextExecutionDateCalculator` exhaustivo.

---

### US-1505 — Frontend Angular — gestión de transferencias programadas

**Como** usuario autenticado,
**quiero** ver y gestionar todas mis transferencias programadas desde el portal,
**para** tener visibilidad y control completo sobre los pagos automatizados en mi cuenta.

**Estimación:** 3 SP | **Prioridad:** Must Have | **Semana:** S2

#### Criterios de aceptación

```gherkin
Scenario: Ver lista de transferencias programadas
  Given usuario con 4 scheduled_transfers (2 ACTIVE, 1 PAUSED, 1 COMPLETED)
  When navega a Transferencias → Programadas
  Then ve la lista filtrable por estado (Todas / Activas / Pausadas / Completadas)
  And cada tarjeta muestra: importe, concepto, destinatario, próxima ejecución,
    frecuencia (Única vez / Semanal / Quincenal / Mensual), estado con color
  And las ACTIVE muestran countdown "Próxima: en 3 días"

Scenario: Crear transferencia programada desde el formulario
  Given usuario en Transferencias → Programadas → Nueva
  When rellena formulario: tipo (Única / Recurrente), cuenta origen, destinatario
    (propia o beneficiario), importe, concepto, fecha inicio,
    [si recurrente] cadencia y fecha fin opcional / nº ejecuciones opcional
  Then ve resumen de la programación antes de confirmar con OTP
  When introduce OTP válido y confirma
  Then POST /api/v1/scheduled-transfers se invoca
  And aparece en la lista con status ACTIVE y próxima ejecución correcta
  And toast de confirmación: "Transferencia programada creada correctamente"

Scenario: Pausar / reactivar desde la lista
  Given scheduled_transfer ACTIVE en la lista
  When usuario hace clic en "Pausar"
  Then diálogo de confirmación (sin OTP — cambio no financiero)
  When confirma
  Then PATCH /api/v1/scheduled-transfers/{id} con { status: "PAUSED" }
  And el estado visual cambia a PAUSED inmediatamente
  And botón cambia a "Reactivar"

Scenario: Cancelar transferencia programada
  Given scheduled_transfer ACTIVE en la lista
  When usuario hace clic en "Cancelar" y confirma el diálogo
  Then DELETE /api/v1/scheduled-transfers/{id}
  And la tarjeta desaparece de la lista ACTIVE
  And aparece en historial como CANCELLED

Scenario: Ver historial de ejecuciones de una programada
  Given scheduled_transfer MONTHLY con 3 ejecuciones
  When usuario hace clic en la tarjeta → "Ver historial"
  Then panel lateral muestra las 3 ejecuciones con:
    fecha, importe, estado (SUCCESS/FAILED), referencia de transferencia (si SUCCESS)
  And ejecuciones FAILED muestran el motivo en tooltip

Scenario: Recibir notificación push al ejecutarse
  Given usuario con push activo y scheduled_transfer ejecutada por el scheduler
  When llega push "Transferencia programada ejecutada: 800.00€ — Alquiler"
  Then al hacer clic navega a Transferencias → Programadas con la ejecución destacada

Scenario: Responsive — gestión desde móvil
  Given usuario en dispositivo móvil (viewport < 768px)
  When accede a Transferencias → Programadas
  Then la lista se muestra en formato tarjetas apiladas (no tabla)
  And el formulario de creación es usable con teclado móvil
  And WCAG 2.1 AA cumplido (contraste, labels, focus visible)
```

#### Notas técnicas
- Módulo Angular: `ScheduledTransfersModule` (lazy-loaded en la ruta `/transfers/scheduled`)
- Componentes:
  - `ScheduledTransferListComponent` — lista con filtros y tabs por estado
  - `ScheduledTransferCardComponent` — tarjeta individual con acciones
  - `CreateScheduledTransferComponent` — wizard 3 pasos: Tipo → Datos → Confirmación OTP
  - `ScheduledTransferHistoryComponent` — panel lateral con ejecuciones
- `ScheduledTransferService` Angular — wrapper HTTP sobre el API backend
- Reutilizar `OtpConfirmationComponent` (FEAT-001/008)
- Reutilizar `BeneficiaryPickerComponent` (FEAT-008)
- Integración con `NotificationService` Angular (FEAT-014) para SSE live updates
- Tests: 5 escenarios unitarios con `HttpClientTestingModule` + tests de componente con `TestBed`

---

## Riesgos FEAT-015

| ID | Riesgo | P | I | Nivel | Mitigación |
|---|---|---|---|---|---|
| R-015-01 | Scheduler ejecuta en múltiples instancias si hay scale-out horizontal | M | A | 3 | Añadir `@SchedulerLock` (ShedLock) con Redis como lock store. ADR-026 requerido. |
| R-015-02 | `next_execution_date` incorrecta para meses cortos (feb, fin de mes) | M | M | 2 | `NextExecutionDateCalculator` con test exhaustivo: feb 28/29, meses 30 días, año bisiesto |
| R-015-03 | Core bancario lento degrada el tiempo total del batch scheduler | B | M | 2 | Circuit breaker ya activo (FEAT-009). Monitorizar duración del job en primer sprint. |
| R-015-04 | Usuario con muchas recurrentes activas agota saldo en ejecución simultánea | B | M | 2 | El scheduler ejecuta secuencialmente por usuario — ORDER BY user_id, next_execution_date |
| R-015-05 | Notificaciones push masivas en el momento del scheduler (06:00 UTC) | B | B | 1 | Tasa de push por usuario ≤ 1/job. Monitorizar throughput `WebPushService`. |

---

## ADRs requeridos

| ADR | Decisión | Responsable |
|---|---|---|
| ADR-026 | ¿ShedLock vs DB lock para scheduler single-instance en este sprint? | Architect |
| ADR-027 | ¿Permitir edición de importe en recurrente activa (con nuevo OTP)? | Tech Lead + PO |

**Decisión pragmática Sprint 17**: dado que el despliegue actual es single-instance,
ADR-026 puede documentar "ShedLock diferido a FEAT-016 cuando se contemple scale-out".
Se registra R-015-01 como riesgo mitigado-diferido.

---

## Normativa aplicable

| Normativa | Requisito | Implementación |
|---|---|---|
| PSD2 Art. 66 RTS Art. 10 | SCA obligatoria al configurar la recurrencia, no en cada ejecución | OTP en `CreateScheduledTransferUseCase` — EBA Opinion on RTS Article 10 exemption |
| PSD2 Art. 94 | Trazabilidad completa de operaciones de pago | `audit_log` + `scheduled_transfer_executions` inmutables |
| RGPD Art. 5 (1b) | Limitación de finalidad — datos de transferencia solo para ejecución | `scheduled_transfers` sin uso analítico, acceso restringido a userId propietario |
| PCI-DSS 4.0 req. 7 | Acceso a datos financieros basado en necesidad de conocer | Endpoint `GET /api/v1/scheduled-transfers` filtra siempre por `userId` del JWT |

---

## Definition of Ready (DoR)

- [x] Feature descrita con valor de negocio claro y KPIs medibles
- [x] 5 US + criterios Gherkin completos (≥ 6 escenarios por US)
- [x] Estimación: 17 SP feature + 7 SP deuda = 24 SP (capacidad sprint)
- [x] Dependencias identificadas — todas operativas en develop
- [x] Flyway V17 diseñado con schema completo
- [x] Motor de ejecución con estrategia de idempotencia documentada
- [x] Casos edge de `NextExecutionDateCalculator` identificados
- [x] ADR-026 y ADR-027 abiertos para decisión en Sprint 17 Planning
- [x] Riesgos documentados con mitigación (R-015-01 a R-015-05)
- [x] Normativa PSD2 + RGPD + PCI-DSS mapeada
- [ ] Aprobación Product Owner — Gate 1 Sprint 17 Planning

---

## Definition of Done (DoD)

- [ ] Flyway V17 aplicada sin errores en STG
- [ ] `NextExecutionDateCalculator` con 100% cobertura de ramas
- [ ] Scheduler ejecuta transferencias vencidas y es idempotente (test IT)
- [ ] API REST documentada en OpenAPI (scheduler-api-v1.yaml actualizado)
- [ ] Frontend Angular con lazy loading y WCAG 2.1 AA
- [ ] Cobertura global application ≥ 80%
- [ ] Zero CVEs críticos en security scan
- [ ] DEBT-027, DEBT-028, DEBT-029 cerradas
- [ ] R-016-05 load test SSE ejecutado y resultado documentado
- [ ] Notificaciones push y email verificadas en ejecución exitosa y fallida
- [ ] ADR-026 y ADR-027 documentados y aprobados
- [ ] Deliverables CMMI L3 generados (sprint-17-FEAT-015/)

---

## Release planning

| Release | Contenido | ETA |
|---|---|---|
| **v1.17.0** | **FEAT-015 completo + DEBT-027/028/029** | **2026-04-07** |
| v1.18.0 | FEAT-016 — por definir con PO | 2026-04-21 |

---

*Generado por SOFIA Requirements Analyst — Sprint 17 Planning — 2026-03-24*
*CMMI Level 3 — PP SP 2.1 · PP SP 2.2 · REQM SP 1.1 · RD SP 1.1 · RD SP 2.1 · RD SP 3.1*
*BankPortal — Banco Meridian*
