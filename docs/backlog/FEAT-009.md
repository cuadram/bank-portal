# FEAT-009 — Integración Core Bancario Real + Pagos de Servicios

## Metadata

| Campo | Valor |
|---|---|
| Feature ID | FEAT-009 |
| Proyecto | BankPortal — Banco Meridian |
| Prioridad | ALTA (P1) |
| Estado | READY FOR SPRINT |
| Epic | Operaciones Bancarias |
| Solicitante | Producto Digital + Operaciones — Banco Meridian |
| Fecha creación | 2026-03-21 |
| Stack | Java/Spring Boot (backend) + Angular 17 (frontend) |
| Rama git | `feature/FEAT-009-sprint11` |

---

## Descripción de negocio

Sprint 11 tiene dos ejes complementarios:

**Eje 1 — Integración core bancario real (continuación FEAT-008)**
Con las transferencias funcionando sobre un mock, el siguiente paso crítico
es conectar `BankCoreTransferPort` al core bancario real de Banco Meridian
mediante un adaptador REST (`BankCoreRestAdapter`). El diseño hexagonal de
Sprint 10 permite este swap sin tocar el dominio.

**Eje 2 — Pagos de servicios y facturas**
Permite al usuario pagar recibos domiciliados y facturas de servicios
(luz, agua, teléfono, seguros) desde el portal, completando el catálogo
de operaciones bancarias básicas junto con las transferencias de FEAT-008.

---

## Objetivo y valor de negocio

- **Core real**: operaciones financieras reales — eliminar riesgo de divergencia mock/producción
- **Pagos de servicios**: reducción del 30% en llamadas al call center para pagos de recibos
- **Cumplimiento PSD2 Art. 66**: iniciación de pagos a través de portal propio del banco
- **KPI**: tiempo de respuesta core bancario ≤ 2s p95 · tasa éxito pagos ≥ 99.5%

---

## Alcance funcional

### Incluido en FEAT-009
- `BankCoreRestAdapter` — implementación REST del puerto `BankCoreTransferPort`
- Circuit breaker + retry + timeout para llamadas al core (Resilience4j)
- Pago de recibos domiciliados guardados en el perfil del usuario
- Pago de facturas con referencia (alta desde el portal)
- Historial de pagos realizados
- Notificación email/SSE tras pago completado

### Excluido (backlog futuro)
- Transferencias SEPA/SWIFT internacionales (FEAT-010)
- Programación de pagos recurrentes (FEAT-010)
- Análisis de gastos con gráficos (FEAT-010)

---

## Dependencias técnicas

| Dependencia | Tipo | Estado |
|---|---|---|
| `BankCoreTransferPort` (FEAT-008) | Puerto hexagonal | ✅ Sellado — listo para swap |
| JWT RS256 (DEBT-014) | Seguridad | ✅ Sprint 10 |
| Flyway V11 transfers (FEAT-008) | BD | ✅ Sprint 10 |
| API core bancario Banco Meridian | Integración | ⚠️ Especificación pendiente de confirmar |
| Resilience4j | Librería | ⚠️ Añadir a pom.xml |
| Flyway V12: tablas `bills` + `bill_payments` | BD | ⚠️ Sprint 11 día 1 |
| DEBT-015 Merge FEAT-008 → develop | Git | ⚠️ Día 1 antes de cualquier desarrollo |
| DEBT-016 Rate limiting Bucket4j en transfers | Seguridad | ⚠️ R-SEC-003 del Security Report |

---

## User Stories

| ID | Título | SP | Prioridad | Semana |
|---|---|---|---|---|
| DEBT-015 | Merge feature/FEAT-008-sprint10 → develop | 1 | Must Have | S1 día 1 |
| DEBT-016 | Rate limiting Bucket4j en endpoints de transferencia | 3 | Must Have | S1 |
| US-901 | BankCoreRestAdapter — integración core bancario real | 5 | Must Have | S1 |
| US-902 | Circuit breaker + retry + timeout (Resilience4j) | 3 | Must Have | S1 |
| US-903 | Pago de recibo domiciliado guardado | 4 | Must Have | S2 |
| US-904 | Pago de factura con referencia | 4 | Must Have | S2 |

**Total: 20 SP** (igual a la capacidad del equipo)

---

## User Stories — detalle completo

---

### DEBT-015 — Merge feature/FEAT-008-sprint10 → develop

**Como** equipo de desarrollo,
**quiero** integrar todos los artefactos de Sprint 10 en la rama develop,
**para** tener la base correcta para Sprint 11 y evitar divergencias entre ramas.

**Estimación:** 1 SP | **Prioridad:** Must Have | **Semana:** S1 día 1 — bloqueante

#### Criterios de aceptación

```gherkin
Escenario 1: Merge limpio sin conflictos
  Dado que feature/FEAT-008-sprint10 tiene todos los commits de Sprint 10
  Cuando se ejecuta git merge feature/FEAT-008-sprint10 → develop
  Entonces el merge se completa sin conflictos
  Y develop contiene todos los artefactos: código Java, Flyway V11, docs, Jenkinsfile

Escenario 2: CI/CD pasa tras el merge
  Dado que develop tiene el código de Sprint 10
  Cuando se ejecuta mvn test
  Entonces los 23 tests unitarios nuevos + tests anteriores pasan
  Y la cobertura se mantiene >= 80%
```

---

### DEBT-016 — Rate limiting Bucket4j en endpoints de transferencia

**Como** equipo de seguridad,
**quiero** añadir rate limiting en los endpoints de transferencia,
**para** proteger contra abuso y ataques automatizados (R-SEC-003 del Security Report Sprint 10).

**Estimación:** 3 SP | **Prioridad:** Must Have | **Semana:** S1

#### Criterios de aceptación

```gherkin
Escenario 1: Rate limiting por usuario en transferencias
  Dado que un usuario intenta más de 10 transferencias por minuto
  Cuando supera el límite
  Entonces recibe HTTP 429 Too Many Requests con Retry-After header
  Y audit_log registra TRANSFER_RATE_LIMIT_EXCEEDED

Escenario 2: Rate limiting por IP en alta de beneficiarios
  Dado que una IP intenta más de 5 altas de beneficiario por minuto
  Cuando supera el límite
  Entonces recibe HTTP 429
  Y el OTP no se intenta verificar

Escenario 3: Rate limiting no afecta tráfico legítimo
  Dado que un usuario realiza 3 transferencias en un minuto (uso normal)
  Cuando las ejecuta
  Entonces todas se procesan correctamente sin ser bloqueadas

Escenario 4: Contador Redis — degradación graceful
  Dado que Redis no está disponible
  Cuando se intenta verificar el rate limit
  Entonces la operación se permite (fail-open) y se loguea WARNING
```

#### Notas técnicas
- Bucket4j con Spring Boot starter (`bucket4j-spring-boot-starter`)
- Key: `rl:transfer:{userId}` y `rl:beneficiary-create:{ip}`
- Límites: 10 transfers/min por usuario · 5 beneficiary creates/min por IP
- Integrar en `TransferController` y `BeneficiaryController` via `@RateLimited` AOP

---

### US-901 — BankCoreRestAdapter — integración core bancario real

**Como** plataforma bancaria,
**quiero** conectar las transferencias al core bancario real de Banco Meridian,
**para** que las operaciones tengan efecto financiero real en lugar de usar el mock de desarrollo.

**Estimación:** 5 SP | **Prioridad:** Must Have | **Semana:** S1

#### Criterios de aceptación

```gherkin
Escenario 1: Transferencia propia ejecutada en core real
  Dado que BankCoreRestAdapter está configurado con la URL del core
  Cuando se ejecuta POST /api/v1/transfers/own con OTP válido
  Entonces la llamada se delega al core bancario REST
  Y el saldo real del usuario se actualiza en el core
  Y la respuesta incluye el nuevo saldo real (no simulado)

Escenario 2: Core bancario no disponible → HTTP 503
  Dado que el core bancario no responde
  Cuando se intenta una transferencia
  Entonces el circuit breaker detecta el fallo
  Y retorna HTTP 503 SERVICE_UNAVAILABLE
  Y NO se debita ningún saldo
  Y audit_log registra TRANSFER_CORE_UNAVAILABLE

Escenario 3: Swap transparente mock → real por perfil
  Dado que el perfil activo es 'production'
  Cuando arranca la aplicación
  Entonces Spring inyecta BankCoreRestAdapter (no BankCoreMockAdapter)
  Y BankCoreMockAdapter NO está disponible en producción
```

#### Notas técnicas
- `BankCoreRestAdapter` implementa `BankCoreTransferPort` (interfaz sellada ADR-016)
- `@Profile({"production","staging-real"})` — perfil nuevo `staging-real` para pruebas con core
- `RestClient` (Spring 6.1) con `connectTimeout(2s)` + `readTimeout(5s)`
- Nuevo credential Jenkins: `bankportal-core-api-url` + `bankportal-core-api-key`

---

### US-902 — Circuit breaker + retry + timeout (Resilience4j)

**Como** plataforma bancaria,
**quiero** proteger las llamadas al core bancario con circuit breaker, retry y timeout,
**para** garantizar resiliencia ante fallos del core sin degradar la experiencia del usuario.

**Estimación:** 3 SP | **Prioridad:** Must Have | **Semana:** S1

#### Criterios de aceptación

```gherkin
Escenario 1: Circuit breaker abre tras 5 fallos consecutivos
  Dado que el core bancario falla 5 veces seguidas
  Cuando se intenta la transferencia número 6
  Entonces el circuit breaker está OPEN
  Y la petición falla inmediatamente (sin esperar timeout)
  Y retorna HTTP 503 con código CORE_CIRCUIT_OPEN

Escenario 2: Retry con backoff en error transitorio
  Dado que el core falla en el primer intento pero funciona en el segundo
  Cuando se ejecuta la transferencia
  Entonces el sistema reintenta automáticamente (máx 2 reintentos)
  Y la transferencia se completa con éxito
  Y el usuario no percibe el reintento

Escenario 3: Timeout en llamada lenta al core
  Dado que el core tarda más de 5 segundos en responder
  Cuando se supera el timeout configurado
  Entonces la llamada se cancela
  Y retorna HTTP 503 CORE_TIMEOUT
  Y no se debita ningún saldo (rollback)
```

#### Notas técnicas
- Resilience4j: `@CircuitBreaker` + `@Retry` + `@TimeLimiter` en `BankCoreRestAdapter`
- Config: threshold 50% fallos en ventana de 10 llamadas → OPEN durante 30s
- Retry: 2 reintentos con backoff 500ms · solo en `ConnectException`/`TimeoutException`
- Timeout: 5s por llamada al core
- ADR-017: documentar decisión Resilience4j vs Spring Retry vs manual

---

### US-903 — Pago de recibo domiciliado guardado

**Como** usuario autenticado,
**quiero** pagar mis recibos domiciliados desde el portal,
**para** gestionar mis pagos periódicos sin acudir a la oficina ni usar banca telefónica.

**Estimación:** 4 SP | **Prioridad:** Must Have | **Semana:** S2

#### Criterios de aceptación

```gherkin
Escenario 1: Listar recibos domiciliados pendientes
  Dado que tengo recibos domiciliados en mi perfil
  Cuando accedo a "Pagos → Mis recibos"
  Entonces veo la lista con: emisor, concepto, importe, fecha de cargo
  Y los recibos están ordenados por fecha de cargo ASC

Escenario 2: Pagar recibo con confirmación OTP
  Dado que selecciono un recibo pendiente de pago
  Cuando confirmo con OTP válido
  Entonces el pago se ejecuta en el core bancario
  Y el recibo cambia a estado PAGADO
  Y audit_log registra BILL_PAYMENT_COMPLETED
  Y se envía notificación email + SSE al usuario

Escenario 3: Saldo insuficiente rechaza antes del OTP
  Dado que el saldo disponible es menor al importe del recibo
  Cuando intento pagar
  Entonces recibo HTTP 422 INSUFFICIENT_FUNDS
  Y el OTP no se solicita

Escenario 4: Recibo ya pagado no puede pagarse dos veces
  Dado que el recibo tiene estado PAGADO
  Cuando intento pagarlo de nuevo
  Entonces recibo HTTP 409 BILL_ALREADY_PAID
```

#### Notas técnicas
- Flyway V12: `bills (id, user_id, issuer, concept, amount, due_date, status)`
- Nuevo puerto: `BillPaymentPort` (interfaz sellada — misma estrategia que transfers)
- Endpoint: `GET /api/v1/bills` · `POST /api/v1/bills/{id}/pay` con `{ otpCode }`
- OTP obligatorio — PSD2 SCA aplica a pagos igual que a transferencias

---

### US-904 — Pago de factura con referencia

**Como** usuario autenticado,
**quiero** pagar facturas introduciendo la referencia de pago,
**para** liquidar facturas de servicios puntuales sin necesidad de domiciliación.

**Estimación:** 4 SP | **Prioridad:** Must Have | **Semana:** S2

#### Criterios de aceptación

```gherkin
Escenario 1: Pagar factura con referencia válida
  Dado que introduzco una referencia de factura válida (código 20 dígitos)
  Cuando el sistema consulta al core los datos de la factura
  Entonces veo: emisor, concepto, importe a pagar
  Y puedo confirmar el pago con OTP

Escenario 2: Referencia inválida rechazada
  Dado que introduzco una referencia con formato incorrecto
  Cuando intento buscar la factura
  Entonces recibo HTTP 422 INVALID_BILL_REFERENCE
  Y se muestra el formato esperado al usuario

Escenario 3: Factura no encontrada en el core
  Dado que introduzco una referencia válida pero inexistente
  Cuando el core no encuentra la factura
  Entonces recibo HTTP 404 BILL_NOT_FOUND

Escenario 4: Pago de factura auditado
  Dado que se completa el pago de una factura
  Entonces audit_log registra BILL_PAYMENT_COMPLETED
  con userId, referencia (parcialmente enmascarada), importe e IP
```

#### Notas técnicas
- Endpoint: `GET /api/v1/bills/lookup?reference={ref}` · `POST /api/v1/bills/pay`
- Validación referencia: 20 dígitos numéricos (formato Banco Meridian)
- El pago de factura NO persiste en `bills` (no es recibo domiciliado) — solo en `bill_payments`
- Flyway V12: `bill_payments (id, user_id, reference, issuer, amount, status, paid_at)`

---

## Riesgos FEAT-009

| ID | Riesgo | P | I | Exposición | Mitigación |
|---|---|---|---|---|---|
| R-F9-001 | API core bancario real no disponible o mal documentada | A | A | Alta | ADR-017 + contrato API pendiente de Banco Meridian. Mock temporal para desarrollo |
| R-F9-002 | Latencia core bancario > 2s p95 en producción | M | M | Media | Circuit breaker 5s timeout + retry. Monitorización desde día 1 |
| R-F9-003 | Rate limiting demasiado restrictivo — bloquea usuarios legítimos | M | M | Media | Límites calibrados con histórico de uso STG. Ajustables via config |
| R-F9-004 | Flyway V12 conflicto con V11 si FEAT-008 no está mergeado | A | A | Alta | DEBT-015 es bloqueante día 1 — sin excepción |
| R-F9-005 | Resilience4j overhead en latencia de transferencias | B | M | Media | Benchmark en STG. Target: overhead < 10ms |

---

## Definition of Ready (DoR)

- [x] Feature descrita con valor de negocio claro
- [x] 6 ítems (4 US + 2 DEBT) con criterios Gherkin completos
- [x] Estimación: 20 SP (igual a capacidad del equipo)
- [x] DEBT-015 identificado como bloqueante día 1
- [x] Riesgos documentados con mitigación
- [x] Flyway V12 diseñado (bills + bill_payments)
- [x] ADR-017 Resilience4j requerido antes de US-902
- [x] Aprobación Product Owner pendiente — Gate 1 Sprint 11 Planning

---

## Release planning

| Release | Contenido | ETA |
|---|---|---|
| **v1.11.0** | **FEAT-009 completo + DEBT-015/016** | **2026-04-05** |
| v1.12.0 | FEAT-010 Transferencias internacionales SEPA | 2026-04-19 |

---

*Generado por SOFIA Scrum Master Agent · BankPortal Sprint 11 Planning · 2026-03-21*
*CMMI Level 3 — PP SP 2.1 · PP SP 2.2 · REQM SP 1.1*
