# SRS-FEAT-009 — Software Requirements Specification
# Core Bancario Real + Pagos de Servicios — BankPortal / Banco Meridian

## Metadata CMMI (RD SP 1.1 · RD SP 2.1 · RD SP 3.1)

| Campo | Valor |
|---|---|
| Documento | SRS-FEAT-009 |
| Versión | 1.0 |
| Feature | FEAT-009 — Core Bancario Real + Pagos de Servicios |
| Proyecto | BankPortal — Banco Meridian |
| Sprint | 11 |
| Autor | SOFIA Requirements Analyst Agent |
| Fecha | 2026-03-21 |
| Estado | PENDING APPROVAL — Gate 2 |
| Jira Epic | SCRUM-32 |

---

## 1. Introducción

### 1.1 Propósito

Este documento especifica los requerimientos funcionales y no funcionales de
FEAT-009. Cubre dos ámbitos complementarios: la sustitución del adaptador mock
del core bancario por una integración REST real con Banco Meridian, y el inicio
de la funcionalidad de pagos de servicios (recibos domiciliados y facturas).

### 1.2 Alcance

FEAT-009 cubre:
- `BankCoreRestAdapter` — implementación real de `BankCoreTransferPort`
- Resiliencia de las llamadas al core: circuit breaker, retry y timeout (Resilience4j)
- Rate limiting en endpoints de transferencia y alta de beneficiarios (DEBT-016)
- Pago de recibos domiciliados del usuario (US-903)
- Pago de facturas con referencia de pago (US-904)
- Merge de FEAT-008 → develop (DEBT-015)

Quedan fuera de alcance: transferencias SEPA/SWIFT, pagos recurrentes programados,
análisis de gastos, notificaciones push móviles.

### 1.3 Documentos relacionados

| Documento | Versión | Relación |
|---|---|---|
| FEAT-008.md | 1.0 | Feature predecesora — puertos hexagonales definidos |
| SRS-FEAT-008.md | 1.0 | SRS anterior — contratos `BankCoreTransferPort` |
| LLD-011-transfers-backend.md | 1.0 | Diseño hexagonal base |
| ADR-016 | 1.0 | Saga local — evoluciona a compensación en este sprint |
| SecurityReport-Sprint10-FEAT-008.md | 1.0 | R-SEC-003 rate limiting pendiente |

---

## 2. Requerimientos funcionales

### RF-901: BankCoreRestAdapter — integración core bancario real

**ID:** RF-901 | **Prioridad:** Must Have | **US:** US-901

El sistema debe sustituir `BankCoreMockAdapter` por `BankCoreRestAdapter`,
que implementa `BankCoreTransferPort` realizando llamadas HTTP reales al
core bancario de Banco Meridian.

**Precondiciones:**
- `bankportal-core-api-url` y `bankportal-core-api-key` configurados en Jenkins/entorno
- Flyway V11 aplicada (tablas `transfers`, `beneficiaries`)

**Contrato de integración con core bancario:**

```
Base URL: ${BANK_CORE_BASE_URL}
Auth:     X-API-Key: ${BANK_CORE_API_KEY}

GET  /core/v1/accounts/{accountId}/balance
     → { "accountId": "UUID", "available": 9500.00, "retained": 0.00 }

POST /core/v1/transfers/own
     Body: { "sourceAccountId", "targetAccountId", "amount", "concept", "idempotencyKey" }
     → { "transactionId", "status": "COMPLETED", "sourceBalance", "targetBalance" }

POST /core/v1/transfers/external
     Body: { "sourceAccountId", "targetIban", "amount", "concept", "idempotencyKey" }
     → { "transactionId", "status": "COMPLETED", "sourceBalance" }

POST /core/v1/bills/{billId}/pay
     Body: { "sourceAccountId", "amount", "idempotencyKey" }
     → { "transactionId", "status": "COMPLETED" }

POST /core/v1/bills/lookup
     Body: { "reference" }
     → { "billId", "issuer", "concept", "amount", "expiryDate" }
```

**Idempotencia:** toda llamada de escritura incluye `idempotencyKey` (UUID de la transferencia)
para garantizar que reintentos no generen dobles cargos.

**Activación por perfil:**
- `@Profile("production")` → `BankCoreRestAdapter` activo
- `@Profile({"staging","test"})` → `BankCoreMockAdapter` activo (sin cambios)

---

### RF-902: Resiliencia — circuit breaker, retry y timeout

**ID:** RF-902 | **Prioridad:** Must Have | **US:** US-902

El sistema debe proteger todas las llamadas al core bancario con tres
mecanismos de resiliencia implementados con Resilience4j.

**Circuit Breaker:**
- Threshold: 50% de fallos en ventana de 10 llamadas → estado OPEN
- Tiempo en OPEN: 30 segundos antes de intentar HALF-OPEN
- Transición HALF-OPEN → CLOSED: 3 llamadas exitosas consecutivas
- Estado OPEN → HTTP 503 `CORE_CIRCUIT_OPEN` inmediato (sin esperar timeout)

**Retry:**
- Máximo 2 reintentos (3 intentos en total)
- Backoff: 500ms entre intentos
- Solo reintentar en: `ConnectException`, `SocketTimeoutException`, `HttpServerErrorException` (5xx)
- NO reintentar en: 4xx (errores del cliente), `InsufficientFundsException`

**Timeout:**
- Timeout por llamada: 5 segundos
- Si se supera: `TimeoutException` → HTTP 503 `CORE_TIMEOUT`
- El rollback de la transacción en curso es responsabilidad del `@Transactional`

**ADR-017:** documentar la decisión de Resilience4j vs alternativas antes de implementar.

---

### RF-903: Rate limiting en endpoints de transferencia (DEBT-016)

**ID:** RF-903 | **Prioridad:** Must Have | **DEBT:** DEBT-016

El sistema debe limitar la frecuencia de solicitudes en los endpoints
financieros sensibles para proteger contra abuso y ataques automatizados.

**Límites configurados:**

| Endpoint | Límite | Key | Ventana |
|---|---|---|---|
| `POST /api/v1/transfers/own` | 10 req/min | `rl:transfer:{userId}` | Deslizante 60s |
| `POST /api/v1/transfers/beneficiary` | 10 req/min | `rl:transfer:{userId}` | Deslizante 60s |
| `POST /api/v1/beneficiaries` | 5 req/min | `rl:beneficiary:{clientIp}` | Deslizante 60s |

**Respuesta al superar el límite:**
- HTTP 429 Too Many Requests
- Header `Retry-After: {segundos hasta reset}`
- Body: `{ "errorCode": "RATE_LIMIT_EXCEEDED", "retryAfter": N }`
- `audit_log`: `TRANSFER_RATE_LIMIT_EXCEEDED` o `BENEFICIARY_RATE_LIMIT_EXCEEDED`

**Degradación graceful:** si Redis no está disponible → permitir la operación
(fail-open) y registrar `WARN` en logs. No bloquear operaciones legítimas por
indisponibilidad del rate limiter.

---

### RF-904: Pago de recibo domiciliado

**ID:** RF-904 | **Prioridad:** Must Have | **US:** US-903

El sistema debe permitir al usuario visualizar y pagar sus recibos
domiciliados activos, con confirmación OTP obligatoria (PSD2 SCA).

**Modelo de datos — Flyway V12:**
```sql
CREATE TABLE bills (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID          NOT NULL REFERENCES users(id),
    issuer      VARCHAR(128)  NOT NULL,
    concept     VARCHAR(256)  NOT NULL,
    amount      DECIMAL(15,2) NOT NULL,
    due_date    DATE          NOT NULL,
    status      VARCHAR(16)   NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING','PAID','CANCELLED')),
    created_at  TIMESTAMP     NOT NULL DEFAULT now()
);

CREATE TABLE bill_payments (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID          NOT NULL REFERENCES users(id),
    bill_id         UUID          REFERENCES bills(id),
    reference       VARCHAR(64),  -- para pagos de facturas sin domiciliar
    issuer          VARCHAR(128),
    amount          DECIMAL(15,2) NOT NULL,
    source_account  UUID          NOT NULL REFERENCES accounts(id),
    status          VARCHAR(16)   NOT NULL DEFAULT 'COMPLETED',
    core_txn_id     VARCHAR(64),  -- ID de transacción del core bancario
    paid_at         TIMESTAMP     NOT NULL DEFAULT now()
);
```

**Endpoints:**
```
GET  /api/v1/bills           → lista recibos PENDING del usuario
POST /api/v1/bills/{id}/pay  → { sourceAccountId, otpCode }
                             → 200 { paymentId, status, paidAt }
```

**Reglas de negocio:**
- Un recibo PAID no puede pagarse de nuevo → HTTP 409 `BILL_ALREADY_PAID`
- Saldo insuficiente rechazado antes de solicitar OTP → HTTP 422 `INSUFFICIENT_FUNDS`
- OTP obligatorio → PSD2 SCA igual que en transferencias
- Pago ejecutado via `BankCoreTransferPort` (mismo adaptador que transfers)
- `audit_log`: `BILL_PAYMENT_INITIATED` + `BILL_PAYMENT_COMPLETED`
- Notificación email + SSE tras pago exitoso

---

### RF-905: Pago de factura con referencia

**ID:** RF-905 | **Prioridad:** Must Have | **US:** US-904

El sistema debe permitir pagar facturas puntuales introduciendo una
referencia de pago, sin necesidad de domiciliación previa.

**Flujo:**
1. Usuario introduce referencia de 20 dígitos
2. Sistema consulta al core: `POST /core/v1/bills/lookup`
3. Sistema muestra datos de la factura: emisor, concepto, importe
4. Usuario selecciona cuenta origen y confirma con OTP
5. Sistema ejecuta el pago y registra en `bill_payments`

**Validación de referencia:**
- Formato: exactamente 20 dígitos numéricos
- Validación local antes de llamar al core (evitar llamadas innecesarias)
- Error: HTTP 422 `INVALID_BILL_REFERENCE`

**Enmascarado en audit_log:**
La referencia se almacena parcialmente enmascarada en audit_log:
primeros 4 + `****` + últimos 4 dígitos (análogo al IBAN).

---

### RF-906: DEBT-015 — Merge FEAT-008 → develop

**ID:** RF-906 | **Prioridad:** Must Have | **DEBT:** DEBT-015

La rama `feature/FEAT-008-sprint10` debe mergearse a `develop` como primer
acto del Sprint 11, antes de iniciar cualquier desarrollo de FEAT-009.

**Criterios de aceptación:**
- Merge sin conflictos
- `mvn test` pasa en develop con todos los tests de Sprint 10
- Flyway V11 presente en develop
- `feature/FEAT-009-sprint11` creada desde el estado post-merge de develop

---

## 3. Requerimientos no funcionales

### RNF-F9-001: Rendimiento

| Métrica | Valor objetivo | Percentil |
|---|---|---|
| Latencia end-to-end transferencia (incluye core real) | ≤ 2.000ms | p95 |
| Overhead Resilience4j sobre latencia | ≤ 10ms | p99 |
| Tiempo de respuesta pago de recibo | ≤ 2.000ms | p95 |
| Latencia rate limiter (Redis check) | ≤ 5ms | p99 |

### RNF-F9-002: Resiliencia

- Circuit breaker evita cascada de fallos al core bancario
- Timeout 5s por llamada — nunca bloquear un hilo indefinidamente
- Fail-open en rate limiter cuando Redis no disponible
- Idempotencia en todas las escrituras al core (UUID como `idempotencyKey`)

### RNF-F9-003: Seguridad

- `BANK_CORE_API_KEY` nunca en código — solo en variables de entorno / Jenkins credentials
- Rate limiting activo desde el primer deploy en STG
- OTP obligatorio en todo pago (PSD2 SCA)
- Referencia de factura enmascarada en logs
- `idempotencyKey` previene dobles cargos en reintentos

### RNF-F9-004: Observabilidad

- Métricas Resilience4j expuestas en `/actuator/metrics`:
  - `resilience4j.circuitbreaker.state` — estado del circuit breaker
  - `resilience4j.circuitbreaker.calls` — llamadas exitosas/fallidas
  - `resilience4j.retry.calls` — reintentos realizados
- Log estructurado en cada transición de estado del circuit breaker
- Contador Redis rate limiting accesible para monitorización

---

## 4. Requerimientos de integración

### RI-F9-001: API Core Bancario Banco Meridian

| Atributo | Valor |
|---|---|
| Protocolo | HTTPS REST |
| Autenticación | Header `X-API-Key` |
| Formato | JSON (application/json) |
| Timeout | 5 segundos (configurado en `BankCoreRestAdapter`) |
| Entorno STG | `${BANK_CORE_BASE_URL}` (credential Jenkins) |
| Idempotencia | Header `X-Idempotency-Key: {UUID}` |

### RI-F9-002: Resilience4j — configuración Spring Boot

```yaml
resilience4j:
  circuitbreaker:
    instances:
      bankCore:
        slidingWindowSize: 10
        failureRateThreshold: 50
        waitDurationInOpenState: 30s
        permittedNumberOfCallsInHalfOpenState: 3
        registerHealthIndicator: true
  retry:
    instances:
      bankCore:
        maxAttempts: 3
        waitDuration: 500ms
        retryExceptions:
          - java.net.ConnectException
          - java.net.SocketTimeoutException
  timelimiter:
    instances:
      bankCore:
        timeoutDuration: 5s
        cancelRunningFuture: true
```

### RI-F9-003: Bucket4j — rate limiting

```yaml
bucket4j:
  enabled: true
  filters:
    - cache-name: rate-limit-transfer
      url: /api/v1/transfers/.*
      rate-limits:
        - bandwidths:
            - capacity: 10
              time: 1
              unit: minutes
              refill-speed: interval
    - cache-name: rate-limit-beneficiary
      url: /api/v1/beneficiaries
      rate-limits:
        - bandwidths:
            - capacity: 5
              time: 1
              unit: minutes
              refill-speed: interval
```

---

## 5. RTM — Requirements Traceability Matrix

| Req. | US/DEBT | Sprint | Gherkin | Test unitario | Integración | API Endpoint |
|---|---|---|---|---|---|---|
| RF-901 BankCoreRestAdapter | US-901 | S1 | 3 escenarios | BankCoreRestAdapterTest | TransferWithRealCoreIT | POST /transfers/own·/beneficiary |
| RF-902 Resilience4j | US-902 | S1 | 3 escenarios | ResilienceTest | — | transversal |
| RF-903 Rate limiting | DEBT-016 | S1 | 4 escenarios | RateLimitFilterTest | — | POST /transfers/* /beneficiaries |
| RF-904 Pago recibo | US-903 | S2 | 4 escenarios | BillPaymentUseCaseTest | BillPaymentControllerIT | GET/POST /bills |
| RF-905 Pago factura | US-904 | S2 | 4 escenarios | BillLookupUseCaseTest | — | GET /bills/lookup · POST /bills/pay |
| RF-906 Merge DEBT-015 | DEBT-015 | S1 día 1 | 2 escenarios | suite completa PASS | — | — |
| RNF-F9-001 Rendimiento | — | S1+S2 | — | — | PerformanceIT | — |
| RNF-F9-002 Resiliencia | US-902 | S1 | — | — | CircuitBreakerIT | — |
| RNF-F9-003 Seguridad | DEBT-016 | S1 | — | — | RateLimitIT | — |

---

## 6. Criterios de aceptación globales

- [ ] `BankCoreRestAdapter` activo en perfil `production` · mock solo en `staging`/`test`
- [ ] Circuit breaker abre en 5 fallos consecutivos · cierra tras 3 éxitos en HALF-OPEN
- [ ] Rate limiting retorna 429 con `Retry-After` al superar límite
- [ ] Toda llamada de escritura al core incluye `idempotencyKey` — sin dobles cargos
- [ ] OTP obligatorio en todo pago de recibo y factura
- [ ] Referencia de factura enmascarada en audit_log
- [ ] `BANK_CORE_API_KEY` nunca en código — solo en variables de entorno
- [ ] Métricas Resilience4j expuestas en `/actuator/metrics`

---

*Generado por SOFIA Requirements Analyst Agent — Step 2*
*CMMI Level 3 — RD SP 1.1 · RD SP 2.1 · RD SP 3.1 · REQM SP 1.1 · REQM SP 1.5*
*BankPortal Sprint 11 — FEAT-009 — 2026-03-21 — v1.0 PENDING APPROVAL*
