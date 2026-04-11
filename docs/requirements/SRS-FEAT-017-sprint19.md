# SRS — FEAT-017 · Domiciliaciones y Recibos (SEPA Direct Debit)

## 1. Metadata

| Campo | Valor |
|---|---|
| **ID Feature** | FEAT-017 |
| **Proyecto** | BankPortal |
| **Cliente** | Banco Meridian |
| **Stack** | Java 21 / Spring Boot 3.3.4 · Angular 17 · PostgreSQL 16 |
| **Tipo de trabajo** | new-feature |
| **Sprint objetivo** | Sprint 19 (2026-05-08 → 2026-05-22) |
| **Release** | v1.19.0 |
| **Prioridad** | Alta |
| **Epic Jira** | SCRUM-88 |
| **Solicitado por** | Product Owner — Banco Meridian |
| **Versión** | 1.0 |
| **Estado** | APPROVED |
| **Generado** | 2026-03-27T06:13:20.749Z |
| **Agente** | Requirements Analyst — SOFIA v2.2 |

---

## 2. Descripción del sistema / contexto

BankPortal es el portal de banca digital de Banco Meridian que permite a sus clientes gestionar sus productos financieros de forma autónoma. Actualmente el portal permite autenticación 2FA, consulta de cuentas y movimientos, transferencias nacionales e internacionales, transferencias programadas y gestión completa de tarjetas (FEAT-001 a FEAT-016).

FEAT-017 extiende el portal con el módulo de **Domiciliaciones y Recibos**, permitiendo a los clientes gestionar sus mandatos SEPA Direct Debit Core: consultar domiciliaciones activas, autorizar nuevas domiciliaciones, revocar mandatos existentes y recibir notificaciones push en cada evento de cobro o devolución de recibos. El módulo cumple íntegramente con el **SEPA DD Core Rulebook v3.4**, **PSD2 Art.77/80** y **RGPD Art.6.1.b**.

Los actores principales son: **Cliente bancario** (usuario final autenticado), **Sistema CoreBanking** (fuente de verdad de mandatos y cobros), **Scheduler interno** (SimulaCobro job) y el **Servicio de notificaciones push** (ya integrado en FEAT-011).

---

## 3. Alcance

**Incluido en FEAT-017:**
- Modelo de datos: tablas `debit_mandates` y `direct_debits` (Flyway V19)
- API REST: consulta, alta y anulación de mandatos (4 endpoints GET + 1 POST + 1 DELETE)
- Consulta paginada de recibos con filtros
- Validación IBAN acreedor (ISO 13616 mod-97, 34 países SEPA)
- Regla PSD2 D-2: bloqueo de cancelación si recibo PENDING ≤ 2 días hábiles
- Notificaciones push en eventos CHARGED / RETURNED / REJECTED
- Emails transaccionales en alta y cancelación de mandato
- Frontend Angular: módulo lazy-loaded `DirectDebitsModule` con 6 componentes
- Audit log de operaciones críticas (MANDATE_CREATED, MANDATE_CANCELLED)
- DEBT-031: Rate limiting `/cards/{id}/pin` (CVSS 4.2)

**Excluido de FEAT-017:**
- Simulación de cargo real hacia CoreBanking (el job SimulaCobro opera internamente)
- Mandatos SEPA B2B (tipología reservada para FEAT posterior)
- Exportación de mandatos a PDF (solo recibos incluidos en US-1706)
- Integración con sistemas de domiciliación de terceros (ADE, ADEQ)
- Gestión de devoluciones iniciadas por el banco (R-transactions automáticas)

---

## 4. Épica

**SCRUM-88 — FEAT-017: Domiciliaciones y Recibos**

Dotar a los clientes de Banco Meridian de control completo sobre sus domiciliaciones bancarias SEPA desde el portal digital, reduciendo la necesidad de atención en sucursal para la gestión de mandatos y recibos. El módulo aporta transparencia, control de pagos recurrentes y cumplimiento normativo PSD2/SEPA.

---

## 5. User Stories

### US-1701 — Modelo de datos `direct_debits` + `debit_mandates` (Flyway V19)

**Como** sistema BankPortal  
**Quiero** persistir mandatos SEPA y el histórico de recibos domiciliados  
**Para** disponer de la base de datos que sustenta todas las operaciones FEAT-017

**Story Points:** 3 · **Prioridad:** Alta · **Dependencias:** Ninguna

#### Criterios de Aceptación

```gherkin
Scenario: Flyway V19 ejecuta correctamente en STG
  Given el entorno STG con PostgreSQL 16 activo
  When se despliega la versión v1.19.0 con Flyway habilitado
  Then la migración V19__direct_debits.sql completa sin errores
  And las tablas debit_mandates y direct_debits existen en el esquema public
  And todos los índices definidos están creados

Scenario: Integridad referencial mandato → cuenta
  Given una cuenta inexistente en la tabla accounts
  When se intenta insertar un mandato con ese account_id
  Then la base de datos rechaza la inserción con violación FK
  And no se crea ningún registro parcial

Scenario: Mandato duplicado detectado por constraint
  Given un mandato con mandate_ref 'BNK-001234-1714567890'
  When se intenta insertar otro mandato con el mismo mandate_ref
  Then se lanza UniqueConstraintViolationException
  And el segundo mandato no persiste
```

#### DoD
- [ ] Migración Flyway V19 ejecuta en STG sin errores
- [ ] Tests de integración con Testcontainers PostgreSQL 16
- [ ] Constraints y FK verificados en test
- [ ] Pipeline CI/CD verde

---

### US-1702 — Consulta de domiciliaciones y recibos

**Como** cliente de Banco Meridian autenticado  
**Quiero** consultar mis domiciliaciones activas y el historial de recibos cobrados y devueltos  
**Para** tener visibilidad completa sobre mis pagos recurrentes autorizados

**Story Points:** 4 · **Prioridad:** Alta · **Dependencias:** US-1701

#### Criterios de Aceptación

```gherkin
Scenario: Cliente consulta sus mandatos activos
  Given un cliente autenticado con 3 mandatos activos y 1 cancelado
  When realiza GET /api/v1/direct-debits/mandates
  Then recibe lista con los 4 mandatos con sus status
  And la respuesta llega en menos de 200ms (p95)

Scenario: Cliente filtra recibos por rango de fechas
  Given un cliente con 15 recibos entre enero y marzo 2026
  When realiza GET /api/v1/direct-debits/debits?from=2026-01-01&to=2026-01-31&page=0&size=10
  Then recibe exactamente los recibos de enero paginados
  And el response incluye totalElements, totalPages y hasNext

Scenario: Cliente sin domiciliaciones
  Given un cliente sin ningún mandato registrado
  When realiza GET /api/v1/direct-debits/mandates
  Then recibe 200 OK con lista vacía []
  And no se produce error 404 ni 500

Scenario: Token JWT expirado
  Given un token JWT expirado
  When realiza GET /api/v1/direct-debits/mandates
  Then recibe 401 Unauthorized
  And el body contiene error_code: TOKEN_EXPIRED
```

#### DoD
- [ ] 4 endpoints implementados y documentados en OpenAPI 3.0
- [ ] Tests unitarios ≥ 80% cobertura en service layer
- [ ] Tests de integración Testcontainers para queries complejas
- [ ] p95 < 200ms verificado en QA

---

### US-1703 — Alta de nueva domiciliación con mandato SEPA

**Como** cliente de Banco Meridian autenticado  
**Quiero** autorizar una nueva domiciliación SEPA a un acreedor  
**Para** permitir cobros recurrentes sin intervenir manualmente en cada pago

**Story Points:** 4 · **Prioridad:** Alta · **Dependencias:** US-1701

#### Criterios de Aceptación

```gherkin
Scenario: Alta exitosa de mandato SEPA
  Given un cliente autenticado con cuenta activa
  And un IBAN acreedor válido ES9121000418450200051332
  And un OTP válido de 6 dígitos
  When realiza POST /api/v1/direct-debits/mandates con los datos completos
  Then se crea el mandato con status ACTIVE
  And se genera mandate_ref único formato BNK-{userId6}-{timestamp}
  And se envía push Domiciliación autorizada con {creditorName}
  And se envía email de confirmación
  And se registra audit log MANDATE_CREATED
  And responde 201 Created con Location header

Scenario: IBAN acreedor inválido
  Given un cliente autenticado
  When realiza POST con IBAN ES00000000000000000001
  Then recibe 422 Unprocessable Entity
  And el body contiene field: creditorIban, error: INVALID_IBAN

Scenario: OTP incorrecto
  Given un cliente autenticado con OTP 999999 (incorrecto)
  When realiza POST con datos válidos pero OTP incorrecto
  Then recibe 401 Unauthorized
  And el body contiene error_code: INVALID_OTP

Scenario: Mandato duplicado mismo acreedor e IBAN
  Given un cliente con mandato ACTIVE para acreedor Gym SA con IBAN ES91...
  When intenta crear otro mandato para el mismo acreedor e IBAN
  Then recibe 409 Conflict
  And el body contiene error_code: DUPLICATE_MANDATE
```

#### DoD
- [ ] Validación IBAN mod-97 (ISO 13616) implementada para 34 países SEPA
- [ ] OTP verificado con servicio 2FA existente
- [ ] Audit log MANDATE_CREATED en tabla audit_events
- [ ] Tests unitarios ≥ 80%
- [ ] Tests de integración: happy path + 3 error paths

---

### US-1704 — Anulación / revocación de mandato domiciliado

**Como** cliente de Banco Meridian autenticado  
**Quiero** cancelar una domiciliación SEPA existente  
**Para** revocar la autorización de cobro a un acreedor

**Story Points:** 3 · **Prioridad:** Alta · **Dependencias:** US-1701, US-1702

#### Criterios de Aceptación

```gherkin
Scenario: Cancelación exitosa de mandato activo
  Given un mandato con status ACTIVE sin recibos PENDING en los próximos 2 días hábiles
  And OTP válido
  When realiza DELETE /api/v1/direct-debits/mandates/{id}
  Then el mandato cambia a status CANCELLED con cancelled_at = now()
  And se envía push Domiciliación cancelada con {creditorName}
  And se envía email de confirmación de cancelación
  And se registra audit log MANDATE_CANCELLED
  And responde 200 OK

Scenario: Bloqueo PSD2 D-2 - recibo pendiente en 2 días hábiles
  Given un mandato ACTIVE con un recibo PENDING con due_date = mañana (día hábil)
  When realiza DELETE /api/v1/direct-debits/mandates/{id}
  Then recibe 422 Unprocessable Entity
  And el body contiene error_code: MANDATE_CANCELLATION_BLOCKED_PSD2
  And el body contiene due_date del recibo bloqueante

Scenario: Mandato no pertenece al cliente
  Given un mandato que pertenece a otro usuario
  When el cliente intenta cancelarlo
  Then recibe 403 Forbidden
  And no se modifica el mandato

Scenario: OTP incorrecto en cancelación
  Given un mandato ACTIVE del cliente
  When realiza DELETE con OTP 000000 (incorrecto)
  Then recibe 401 Unauthorized
  And el mandato permanece ACTIVE
```

#### DoD
- [ ] Regla PSD2 D-2 implementada con HolidayCalendarService
- [ ] Verificación ownership (mandato pertenece al usuario autenticado)
- [ ] Audit log MANDATE_CANCELLED
- [ ] Tests: happy path + PSD2 D-2 + ownership + OTP error

---

### US-1705 — Notificaciones push en cobro/devolución de recibo

**Como** cliente de Banco Meridian autenticado  
**Quiero** recibir una notificación push cuando se cobra, devuelve o rechaza un recibo  
**Para** estar informado en tiempo real de los movimientos de mis domiciliaciones

**Story Points:** 4 · **Prioridad:** Alta · **Dependencias:** US-1701

#### Criterios de Aceptación

```gherkin
Scenario: Push al cobrar un recibo (DEBIT_CHARGED)
  Given un recibo en estado PENDING con due_date = hoy
  When el scheduler procesa el cobro y cambia status a CHARGED
  Then se envía push con mensaje Se ha cobrado un recibo de {creditorName} por {amount}EUR
  And el push llega en menos de 30 segundos tras el evento

Scenario: Push en devolución (DEBIT_RETURNED)
  Given un recibo en estado CHARGED
  When el CoreBanking notifica devolución con return_reason AM04
  Then el recibo cambia a status RETURNED
  And se envía push Recibo devuelto de {creditorName} - motivo: Fondos insuficientes

Scenario: Push en rechazo (DEBIT_REJECTED)
  Given un recibo PENDING con cuenta sin saldo suficiente
  When el scheduler intenta procesar el cobro
  Then el recibo cambia a status REJECTED
  And se envía push Recibo rechazado - saldo insuficiente

Scenario: Cliente sin dispositivo registrado para push
  Given un cliente sin token de dispositivo push registrado
  When se produce evento DEBIT_CHARGED
  Then no se intenta enviar push (no error)
  And el evento queda registrado en audit log
```

#### DoD
- [ ] Integración con NotificationService existente (FEAT-011)
- [ ] 3 tipos de evento implementados (CHARGED, RETURNED, REJECTED)
- [ ] Graceful degradation si dispositivo sin push token
- [ ] Tests unitarios del handler de eventos

---

### US-1706 — Frontend Angular — gestión completa domiciliaciones

**Como** cliente de Banco Meridian autenticado  
**Quiero** gestionar mis domiciliaciones desde el portal web Angular  
**Para** consultar, autorizar y cancelar mandatos SEPA sin acceder a una sucursal

**Story Points:** 4 · **Prioridad:** Alta · **Dependencias:** US-1702, US-1703, US-1704

#### Criterios de Aceptación

```gherkin
Scenario: Cliente navega al módulo de domiciliaciones
  Given un cliente autenticado en el portal
  When navega a /direct-debits
  Then el módulo DirectDebitsModule se carga lazy (< 3s)
  And visualiza la lista de mandatos con chips de estado (ACTIVE verde, CANCELLED gris)

Scenario: Wizard de alta de nueva domiciliación
  Given el cliente en MandateListComponent
  When pulsa Nueva domiciliación
  Then se abre el wizard CreateMandateComponent (3 pasos)
  And el paso 1 valida IBAN en frontend antes de llamar al backend
  And el paso 3 solicita OTP y muestra confirmación

Scenario: Exportar historial de recibos a PDF
  Given el cliente en DebitHistoryComponent con 12 recibos filtrados
  When pulsa Exportar PDF
  Then se descarga un PDF con los recibos del filtro activo
  And el archivo se nombra recibos-{mandateRef}-{fecha}.pdf

Scenario: Accesibilidad WCAG 2.1 AA
  Given cualquier componente del módulo DirectDebits
  When se audita con axe-core
  Then 0 violaciones de nivel A o AA

Scenario: Error de red al cargar mandatos
  Given un error 503 del backend
  When MandateListComponent intenta cargar datos
  Then muestra mensaje No se pueden cargar las domiciliaciones. Inténtelo de nuevo.
  And ofrece botón Reintentar
```

#### DoD
- [ ] Módulo lazy-loaded sin impacto en bundle principal
- [ ] DirectDebitService con HttpClient + estado reactivo (BehaviorSubject)
- [ ] 0 violaciones WCAG 2.1 AA (axe-core)
- [ ] Tests unitarios Jasmine/Karma ≥ 80% en service y componentes críticos
- [ ] Error handling con mensajes UX amigables

---

## 6. Requerimientos No Funcionales (Delta FEAT-017)

> **Base:** ver SRS Baseline BankPortal (Confluence page 229398)

| ID | Categoría | Descripción | Criterio medible | Tipo |
|---|---|---|---|---|
| RNF-D17-01 | Rendimiento | Consulta de mandatos y recibos paginada | p95 < 200ms | Delta |
| RNF-D17-02 | Rendimiento | Alta de mandato (incluye validación IBAN + OTP) | p95 < 400ms | Delta |
| RNF-D17-03 | Rendimiento | Notificación push tras evento cobro | < 30s desde evento | Delta |
| RNF-D17-04 | Seguridad | Operaciones de escritura (alta/baja mandato) | OTP 2FA obligatorio | Delta |
| RNF-D17-05 | Normativa | Cumplimiento SEPA DD Core Rulebook v3.4 | 100% campos mandato | Restricción |
| RNF-D17-06 | Normativa | PSD2 Art.77 — derecho reembolso 8 semanas | Regla D-2 implementada | Restricción |
| RNF-D17-07 | Trazabilidad | Audit log operaciones críticas | MANDATE_CREATED, MANDATE_CANCELLED | Delta |
| RNF-D17-08 | Accesibilidad | Frontend WCAG 2.1 AA | 0 violaciones axe-core | Baseline |

---

## 7. Restricciones

| ID | Tipo | Descripción |
|---|---|---|
| RR-017-01 | Normativa | SEPA Direct Debit Core Rulebook v3.4 — estructura mandatos |
| RR-017-02 | Normativa | PSD2 RTS Art.80 — notificación previa al cargo |
| RR-017-03 | Normativa | PSD2 Art.77 — derecho de reembolso 8 semanas |
| RR-017-04 | Legal | RGPD Art.6.1.b — base legal tratamiento datos de pago |
| RR-017-05 | Tecnología | Stack mandatorio: Java 21 / Spring Boot 3.3.4 / Angular 17 / PostgreSQL 16 |
| RR-017-06 | Seguridad | OTP 2FA obligatorio en operaciones de alta y cancelación |
| RR-017-07 | Datos | IBAN validado según ISO 13616 (mod-97, 34 países SEPA) |

---

## 8. Supuestos y dependencias

**Supuestos documentados:**
- El `CoreBankingAdapter` existente (FEAT-016) se extiende con métodos para mandatos y recibos
- `HolidayCalendarService` se implementa como mock (días hábiles Spain + SEPA TARGET2)
- El servicio de notificaciones push (FEAT-011) está disponible y operativo
- La librería `iban4j` (validada en Sprint 11) se reutiliza para validación IBAN acreedor
- Los emails transaccionales usan el `EmailService` existente con nuevas plantillas

**Dependencias entre User Stories:**
- US-1702, US-1703, US-1704 dependen de US-1701 (Flyway V19 debe estar en DONE)
- US-1706 depende de US-1702, US-1703 y US-1704 (APIs backend deben estar disponibles)
- US-1705 es paralela a US-1703/1704, requiere solo US-1701

**Dependencias externas:**
- DEBT-031: resuelto en S1 Día 1 (no bloquea FEAT-017 pero es MUST de sprint)

---

## 9. Matriz de Trazabilidad (RTM)

| ID US | Proceso Negocio | RF/RNF vinculados | Jira Issue | Componente Arq. | Caso Prueba | Estado |
|---|---|---|---|---|---|---|
| US-1701 | Persistencia mandatos SEPA | RF-1701, RNF-D17-05 | SCRUM-89 | DirectDebitRepository, Flyway V19 | TC-1701-01..03 | APPROVED |
| US-1702 | Consulta mandatos y recibos | RF-1702, RNF-D17-01 | SCRUM-90 | DirectDebitController, DirectDebitService | TC-1702-01..04 | APPROVED |
| US-1703 | Alta mandato SEPA | RF-1703, RNF-D17-02, RNF-D17-04, RR-017-07 | SCRUM-91 | MandateCreateService, IbanValidator | TC-1703-01..04 | APPROVED |
| US-1704 | Anulación mandato | RF-1704, RNF-D17-06, RNF-D17-07 | SCRUM-92 | MandateCancelService, HolidayCalendarService | TC-1704-01..04 | APPROVED |
| US-1705 | Notificaciones push cobro | RF-1705, RNF-D17-03 | SCRUM-93 | DebitEventHandler, NotificationService | TC-1705-01..04 | APPROVED |
| US-1706 | Frontend Angular domiciliaciones | RF-1706, RNF-D17-08 | SCRUM-94 | DirectDebitsModule, DirectDebitService | TC-1706-01..05 | APPROVED |
| DEBT-031 | Rate limiting /cards/pin | RNF-Security | SCRUM-95 | RateLimitingFilter | TC-DEBT031-01..02 | APPROVED |

---

## 10. DoD aplicable

### DoD Base SOFIA — New Feature
- [ ] Código implementado y revisado por Code Reviewer
- [ ] Tests unitarios escritos (cobertura ≥ 80%)
- [ ] Tests de integración con Testcontainers pasando
- [ ] Documentación técnica actualizada (OpenAPI, README)
- [ ] Aprobado por QA Lead
- [ ] Pipeline CI/CD verde
- [ ] Aprobación del Product Owner

### DoD Customizado — Banco Meridian
- [ ] Cumplimiento normativo SEPA/PSD2 verificado
- [ ] OTP 2FA validado en operaciones de escritura
- [ ] Audit log completo (MANDATE_CREATED, MANDATE_CANCELLED)
- [ ] WCAG 2.1 AA — 0 violaciones axe-core
- [ ] Notificaciones push verificadas (3 tipos de evento)

---

*Requirements Analyst Agent · CMMI RD SP 1.1, 1.2, 2.1, 3.1 · SOFIA v2.2 · BankPortal — Banco Meridian · Sprint 19 · 2026-05-08*