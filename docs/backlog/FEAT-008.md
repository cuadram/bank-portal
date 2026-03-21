# FEAT-008 — Transferencias Bancarias

## Metadata

| Campo | Valor |
|---|---|
| Feature ID | FEAT-008 |
| Proyecto | BankPortal — Banco Meridian |
| Prioridad | ALTA (P1) |
| Estado | READY FOR SPRINT |
| Epic | Operaciones Bancarias |
| Solicitante | Producto Digital + Operaciones — Banco Meridian |
| Fecha creación | 2026-03-20 |
| Stack | Java/Spring Boot (backend) + Angular 17 (frontend) |
| Rama git | `feature/FEAT-008-sprint10` |

---

## Descripción de negocio

Con la consulta de cuentas y movimientos operativa (FEAT-007), el siguiente paso
natural en la épica de Operaciones Bancarias es habilitar las **transferencias**.
FEAT-008 permite al usuario mover dinero entre sus propias cuentas y hacia
cuentas de terceros (beneficiarios guardados), con confirmación obligatoria
mediante 2FA para proteger cada operación.

Todas las transferencias quedan registradas en `audit_log` (FEAT-005) y protegidas
por autenticación contextual (FEAT-006). El flujo de autorización reutiliza el
patrón JWT de dos fases establecido en FEAT-001 (ADR-001).

---

## Objetivo y valor de negocio

- **Autoservicio financiero completo**: el usuario realiza transferencias sin acudir a oficina ni banca telefónica
- **Reducción de carga operativa**: estimación Banco Meridian de 40% reducción en llamadas al call center para operaciones de transferencia
- **Seguridad robusta**: toda transferencia confirmada con OTP — alineado con PSD2 SCA (Strong Customer Authentication)
- **Cumplimiento PSD2 Art. 74 + PCI-DSS 4.0 req. 8.3**: autenticación fuerte para transacciones de pago
- **KPI**: tasa de adopción transferencia digital >= 60% en 3 meses · tasa de abandono <= 5%

---

## Alcance funcional

### Incluido en FEAT-008
- Transferencia entre cuentas propias del usuario (misma entidad)
- Transferencia a beneficiarios guardados (terceros en libreta de contactos)
- Alta, edición y eliminación de beneficiarios
- Límites de transferencia configurables (diario/mensual) con validación en tiempo real
- Confirmación obligatoria con OTP (2FA) para cada transferencia — PSD2 SCA
- Historial de transferencias realizadas (integrado en FEAT-007 US-702)

### Excluido (backlog futuro)
- Transferencias internacionales SEPA/SWIFT (FEAT-009)
- Transferencias inmediatas bizum/SCT Inst (FEAT-009)
- Pagos de recibos y facturas (FEAT-009)
- Transferencias programadas/recurrentes (FEAT-010)

---

## Dependencias técnicas

| Dependencia | Tipo | Estado |
|---|---|---|
| JWT + SecurityFilterChain (FEAT-001) | Seguridad | OK Operativo |
| 2FA TOTP verification (FEAT-001) | Seguridad | OK Operativo |
| audit_log inmutable (FEAT-005) | BD | OK Operativo |
| Autenticación contextual (FEAT-006) | Seguridad | OK Operativo |
| accounts + transactions (FEAT-007 Flyway V10) | BD | OK Sprint 9 |
| API core bancario — adaptador transferencias | Integración | Mock Sprint 10 · real Sprint 11 |
| Flyway V11: beneficiaries + transfers + transfer_limits | BD | Sprint 10 día 1 |
| DEBT-014 JWT RS256 (este sprint) | Seguridad | Precede US-801 en S1 |

---

## User Stories

| ID | Título | SP | Prioridad | Semana |
|---|---|---|---|---|
| DEBT-013 | Tests integración BD real con Testcontainers | 3 | Must Have | S1 |
| DEBT-014 | Migración JWT de HS256 a RS256 | 5 | Must Have | S1 |
| US-801 | Transferencia entre cuentas propias | 5 | Must Have | S1 |
| US-802 | Transferencia a beneficiario guardado | 5 | Must Have | S2 |
| US-803 | Gestión de beneficiarios | 3 | Must Have | S2 |
| US-804 | Límites de transferencia + confirmación 2FA | 3 | Must Have | S2 |

**Total: 24 SP** (igual a la capacidad del equipo)

---

## User Stories — detalle completo

---

### DEBT-013 — Tests de integración con BD real (Testcontainers)

**Como** equipo de desarrollo,
**quiero** sustituir H2 in-memory por PostgreSQL real (Testcontainers) en los tests de integración,
**para** detectar problemas reales de SQL y Flyway antes de llegar a STG.

**Estimación:** 3 SP | **Prioridad:** Must Have | **Semana:** S1

#### Criterios de aceptación

```gherkin
Escenario 1: Tests de integración con PostgreSQL real
  Dado que el perfil 'integration' está activo
  Cuando se ejecutan los tests de integración
  Entonces se levanta un contenedor PostgreSQL real via Testcontainers
  Y todos los tests de repository pasan contra la BD real
  Y las migraciones Flyway se ejecutan en el contenedor de test

Escenario 2: Tests unitarios mantienen H2 (retrocompatibilidad)
  Dado que se ejecutan los tests sin perfil 'integration'
  Cuando se corre 'mvn test'
  Entonces los tests unitarios usan H2 como hasta ahora
  Y no hay regresión en la suite existente (72 tests PASS)

Escenario 3: CI/CD ejecuta ambos perfiles
  Dado que el Jenkinsfile activa el perfil 'integration' en el stage de QA
  Cuando el pipeline CI/CD corre
  Entonces se ejecutan tests unitarios (H2) + integración (PostgreSQL)
  Y el resultado se reporta por separado en el informe de cobertura
```

#### Notas técnicas
- @SpringBootTest + @Testcontainers + @Container PostgreSQLContainer
- Activar con perfil Maven 'integration' (ya configurado en pom.xml)
- Dependencia ya en pom.xml: spring-boot-testcontainers + testcontainers:postgresql
- Refactorizar tests de repository existentes para usar @DataJpaTest con Testcontainers

---

### DEBT-014 — Migración JWT de HS256 a RS256

**Como** equipo de seguridad,
**quiero** migrar los JWT de HMAC-SHA256 a RSA-SHA256,
**para** cumplir con el ADR-001 original y habilitar verificación stateless en microservicios futuros.

**Estimación:** 5 SP | **Prioridad:** Must Have | **Semana:** S1

#### Criterios de aceptación

```gherkin
Escenario 1: JWT emitido con RS256
  Dado que el usuario completa el flujo de autenticación 2FA
  Cuando se emite el JWT de sesión completa
  Entonces el algoritmo del header JWT es RS256
  Y el JWT está firmado con la clave privada RSA-2048 del servidor

Escenario 2: Verificación con clave pública
  Dado que una petición llega con JWT RS256 válido
  Cuando el SecurityFilterChain lo verifica
  Entonces la verificación usa únicamente la clave pública RSA
  Y no requiere acceso a la clave privada en la verificación

Escenario 3: Compatibilidad — tokens HS256 anteriores rechazados
  Dado que existe un JWT emitido con HS256 (sprint anterior)
  Cuando ese token se usa para autenticarse
  Entonces el sistema devuelve HTTP 401 con error TOKEN_ALGORITHM_REJECTED
  Y el usuario es redirigido a login

Escenario 4: Rotación de claves sin downtime
  Dado que se rota el par de claves RSA
  Cuando se actualiza la clave pública en el servidor
  Entonces los tokens emitidos con la clave anterior se invalidan limpiamente
  Y los nuevos tokens funcionan inmediatamente
```

#### Notas técnicas
- JwtTokenProvider y PreAuthTokenProvider: Keys.hmacShaKeyFor() -> Jwts.SIG.RS256 + keypair RSA-2048
- JwtProperties: reemplazar secret/pre-auth-secret por private-key-pem / public-key-pem (Base64 PEM)
- Generar par RSA-2048 para STG: openssl genrsa -out stg-private.pem 2048
- Actualizar application-staging.yml y .env con las nuevas propiedades
- ADR-001 actualizado: documentar la migración
- NOTA: requiere docker-compose down -v en STG para limpiar tokens HS256 existentes

---

### US-801 — Transferencia entre cuentas propias

**Como** usuario autenticado,
**quiero** transferir dinero entre mis propias cuentas del banco,
**para** gestionar mi liquidez entre cuenta corriente y cuenta de ahorro sin ir a la oficina.

**Estimación:** 5 SP | **Prioridad:** Must Have | **Semana:** S1

#### Criterios de aceptación

```gherkin
Escenario 1: Transferencia entre cuentas propias exitosa
  Dado que tengo saldo suficiente en la cuenta de origen
  Cuando introduzco importe (ej. 500€) y confirmo con OTP válido
  Entonces el importe se descuenta de la cuenta origen
  Y se abona en la cuenta destino
  Y ambas cuentas se actualizan en tiempo real vía SSE
  Y audit_log registra TRANSFER_COMPLETED con userId, cuentas, importe, IP

Escenario 2: Saldo insuficiente
  Dado que el saldo disponible de la cuenta origen es menor al importe
  Cuando intento iniciar la transferencia
  Entonces recibo HTTP 422 INSUFFICIENT_FUNDS antes de pedir el OTP
  Y no se genera ningún movimiento

Escenario 3: OTP incorrecto en confirmación
  Dado que introduzco un OTP incorrecto en la pantalla de confirmación
  Cuando confirmo la transferencia
  Entonces recibo error OTP_INVALID con intentos restantes
  Y la transferencia NO se procesa
  Y audit_log registra TRANSFER_OTP_FAILED

Escenario 4: Transferencia auditada
  Dado que se completa una transferencia
  Entonces audit_log registra:
    - TRANSFER_INITIATED (al introducir datos)
    - TRANSFER_OTP_VERIFIED (al confirmar con OTP)
    - TRANSFER_COMPLETED (al persistir el movimiento)
```

#### Notas técnicas
- TransferUseCase + TransferRepositoryPort (adaptador mock -> real Sprint 11)
- Patrón saga simple: validar saldo -> solicitar OTP -> confirmar -> persistir (@Transactional)
- Endpoint: POST /api/v1/transfers/own
- Request: { sourceAccountId, targetAccountId, amount, concept, otpCode }
- Response: { transferId, status, executedAt, sourceBalance, targetBalance }
- Flyway V11: tabla transfers + índices

---

### US-802 — Transferencia a beneficiario guardado

**Como** usuario autenticado,
**quiero** transferir dinero a un beneficiario previamente guardado en mi libreta,
**para** realizar pagos a terceros de forma rápida sin introducir el IBAN cada vez.

**Estimación:** 5 SP | **Prioridad:** Must Have | **Semana:** S2

#### Criterios de aceptación

```gherkin
Escenario 1: Transferencia a beneficiario guardado exitosa
  Dado que tengo al menos un beneficiario guardado
  Cuando selecciono el beneficiario, introduzco el importe y confirmo con OTP
  Entonces el importe se descuenta de la cuenta origen
  Y el movimiento aparece en el historial como "Transferencia a [alias beneficiario]"
  Y audit_log registra TRANSFER_TO_BENEFICIARY_COMPLETED

Escenario 2: Primera transferencia a beneficiario — validación IBAN
  Dado que selecciono un beneficiario recién añadido (primera transferencia)
  Cuando confirmo la operación
  Entonces el sistema muestra un aviso "Primera transferencia a este beneficiario"
  Y requiere confirmación explícita adicional (checkbox + OTP)

Escenario 3: Límite diario superado
  Dado que el total transferido hoy ya alcanzó el límite diario (US-804)
  Cuando intento una nueva transferencia
  Entonces recibo HTTP 422 DAILY_LIMIT_EXCEEDED con el importe disponible restante
  Y se muestra la hora de reset del límite (medianoche UTC)

Escenario 4: Beneficiario inactivo o eliminado
  Dado que intento transferir a un beneficiario que fue eliminado
  Cuando confirmo la operación
  Entonces recibo HTTP 404 BENEFICIARY_NOT_FOUND
  Y se redirige a la pantalla de gestión de beneficiarios
```

#### Notas técnicas
- TransferToBeneficiaryUseCase — mismo patrón que US-801
- Endpoint: POST /api/v1/transfers/beneficiary
- Request: { beneficiaryId, sourceAccountId, amount, concept, otpCode }
- Reutiliza BeneficiaryRepositoryPort (US-803)
- Flyway V11: FK transfers.beneficiary_id -> beneficiaries.id

---

### US-803 — Gestión de beneficiarios

**Como** usuario autenticado,
**quiero** añadir, editar y eliminar beneficiarios en mi libreta de contactos bancarios,
**para** tener mis destinatarios habituales guardados y simplificar las transferencias.

**Estimación:** 3 SP | **Prioridad:** Must Have | **Semana:** S2

#### Criterios de aceptación

```gherkin
Escenario 1: Añadir beneficiario
  Dado que accedo a "Beneficiarios → Nuevo"
  Cuando introduzco alias, IBAN y nombre del titular
  Y confirmo con OTP (alta de beneficiario requiere SCA — PSD2)
  Entonces el beneficiario queda guardado y disponible para transferencias
  Y audit_log registra BENEFICIARY_ADDED

Escenario 2: Validación de IBAN
  Dado que introduzco un IBAN con formato inválido
  Cuando intento guardar el beneficiario
  Entonces recibo error INVALID_IBAN con formato esperado
  Y el formulario no se envía

Escenario 3: Editar alias de beneficiario
  Dado que tengo un beneficiario guardado
  Cuando cambio su alias
  Entonces el alias se actualiza sin requerir OTP (cambio no financiero)
  Y audit_log registra BENEFICIARY_UPDATED

Escenario 4: Eliminar beneficiario
  Dado que tengo un beneficiario guardado
  Cuando lo elimino
  Entonces deja de aparecer en la lista y en el selector de transferencias
  Y sus transferencias históricas conservan el registro (soft delete)
  Y audit_log registra BENEFICIARY_DELETED
```

#### Notas técnicas
- BeneficiaryManagementUseCase + BeneficiaryRepositoryPort
- IBAN validation: commons-validator IBANValidator
- Flyway V11: beneficiaries (id, user_id, alias, iban, holder_name, created_at, deleted_at)
- Soft delete: deleted_at IS NOT NULL
- Endpoints: GET/POST /api/v1/beneficiaries · PUT/DELETE /api/v1/beneficiaries/{id}

---

### US-804 — Límites de transferencia + confirmación 2FA

**Como** sistema de seguridad,
**quiero** validar límites de transferencia configurables y exigir 2FA en cada operación,
**para** proteger al usuario frente a operaciones no autorizadas y fraude.

**Estimación:** 3 SP | **Prioridad:** Must Have | **Semana:** S2

#### Criterios de aceptación

```gherkin
Escenario 1: Límite diario respetado
  Dado que el límite diario es 3.000€ y el usuario ya transfirió 2.500€ hoy
  Cuando intenta transferir 600€
  Entonces recibo HTTP 422 DAILY_LIMIT_EXCEEDED
  Y el mensaje indica "Límite diario restante: 500€"

Escenario 2: Límite por operación respetado
  Dado que el límite por operación es 2.000€
  Cuando el usuario intenta transferir 2.500€ en una sola operación
  Entonces recibo HTTP 422 OPERATION_LIMIT_EXCEEDED
  Y el mensaje indica "Límite máximo por operación: 2.000€"

Escenario 3: Confirmación 2FA obligatoria en toda transferencia
  Dado que el usuario inicia cualquier transferencia
  Cuando introduce los datos de la operación
  Entonces el sistema SIEMPRE solicita OTP de confirmación
  Independientemente del importe (PSD2 SCA sin umbral mínimo)

Escenario 4: Límites configurables por el banco
  Dado que el banco configura límites en la BD (tabla transfer_limits)
  Cuando el usuario consulta sus límites en "Configuración → Límites"
  Entonces ve los límites vigentes aplicados a su perfil
  Y NO puede modificarlos desde el portal (requiere contacto con la oficina)
```

#### Notas técnicas
- TransferLimitValidationService — validación previa a cualquier TransferUseCase
- Flyway V11: transfer_limits (user_id, daily_limit, per_operation_limit, monthly_limit)
- Límites por defecto: operación 2.000€ · diario 3.000€ · mensual 10.000€
- Contador diario en Redis (TTL hasta medianoche UTC)
- Integración con AccountLockUseCase (FEAT-006): 5 OTPs fallidos en transferencias -> bloqueo

---

## Riesgos FEAT-008

| ID | Riesgo | P | I | Exposición | Mitigación |
|---|---|---|---|---|---|
| R-F8-001 | API core bancario no disponible para transferencias reales | A | A | Alta | Mock completo con adaptador sellado; swap real en Sprint 11 |
| R-F8-002 | DEBT-014 (RS256) genera incompatibilidad con tokens STG existentes | M | M | Media | docker-compose down -v antes de arrancar Sprint 10 |
| R-F8-003 | Validación IBAN insuficiente | B | M | Media | commons-validator con tests de casos límite |
| R-F8-004 | Límites de transferencia en Redis se resetean al reiniciar | M | M | Media | Redis con persistencia AOF (ya activo en compose) |
| R-F8-005 | Transacción de transferencia incompleta si falla a mitad | B | A | Media | @Transactional strict + compensación en caso de error |

---

## Definition of Ready (DoR)

- [x] Feature descrita con valor de negocio claro (PSD2 SCA + KPIs)
- [x] 6 ítems (4 US + 2 DEBT) con criterios Gherkin completos
- [x] Estimación: 24 SP (igual a capacidad del equipo)
- [x] Dependencias identificadas — R-F8-001 con mitigación (mock)
- [x] Riesgos documentados con mitigación para los 5 riesgos
- [x] Flyway V11 diseñado (beneficiaries + transfers + transfer_limits)
- [x] ADR-001 actualización requerida (DEBT-014 RS256)
- [x] Aprobación Product Owner pendiente — Gate 1 Sprint 10 Planning

---

## Release planning

| Release | Contenido | ETA |
|---|---|---|
| **v1.10.0** | **FEAT-008 completo + DEBT-013/014** | **2026-04-03** |
| v2.0.0 | FEAT-009 Pagos de servicios | 2026-04-17 |

---

*Generado por SOFIA Scrum Master Agent — BankPortal Sprint 10 Planning — 2026-03-20*
*CMMI Level 3 — PP SP 2.1 · PP SP 2.2 · REQM SP 1.1*
