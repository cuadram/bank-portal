# HLD-FEAT-009 — Core Bancario Real + Pagos de Servicios
# BankPortal / Banco Meridian

## Metadata

| Campo | Valor |
|---|---|
| Feature | FEAT-009 |
| Proyecto | BankPortal — Banco Meridian |
| Stack | Java 21 / Spring Boot 3.3.4 |
| Tipo | new-feature + tech-debt |
| Sprint | 11 |
| Versión | 1.0 |
| Estado | PENDING APPROVAL — Gate 3 Tech Lead |
| Fecha | 2026-03-21 |

---

## Análisis de impacto en monorepo (Paso 0)

| Servicio/Módulo | Impacto | Acción |
|---|---|---|
| `BankCoreMockAdapter` | Reemplazado por `BankCoreRestAdapter` en perfil production | `@Profile` actualizado — sin cambio de interfaz |
| `BankCoreTransferPort` | Ninguno — interfaz sellada sin modificar | — |
| `TransferUseCase` / `TransferToBeneficiaryUseCase` | Ninguno — beneficio del diseño hexagonal | — |
| `TransferController` / `BeneficiaryController` | Añadir decorador `@RateLimited` (DEBT-016) | Rate limiting transparente para el negocio |
| `pom.xml` | Añadir `resilience4j-spring-boot3` + `bucket4j-spring-boot-starter` | Nuevas dependencias |
| Flyway V11 (FEAT-008) | Sin impacto — V12 es aditivo | Nuevas tablas `bills` + `bill_payments` |

**Decisión:** Cambios aditivos y de infraestructura. El diseño hexagonal de FEAT-008 protege el dominio. Dos ADRs requeridos: ADR-017 (Resilience4j) y ADR-018 (rate limiting Bucket4j).

---

## Contexto del sistema — C4 Nivel 1

```mermaid
C4Context
  title BankPortal — FEAT-009 Core Bancario Real + Pagos

  Person(user, "Usuario autenticado", "Cliente Banco Meridian con 2FA activo")

  System(bankportal, "BankPortal Backend", "Spring Boot 3.3 / Java 21")

  System_Ext(bankcore, "Core Bancario Real\nBanco Meridian", "Sistema de registro central. Ejecuta movimientos financieros reales. Expone REST API con autenticación X-API-Key")

  System_Ext(redis, "Redis 7", "Rate limiting Bucket4j + contadores límites transferencia")
  System_Ext(postgres, "PostgreSQL 16", "Persistencia local: transfers, beneficiaries, bills, bill_payments")
  System_Ext(mailhog, "SMTP / MailHog STG", "Notificaciones de pago completado")

  Rel(user, bankportal, "Transferencias y pagos", "HTTPS / JWT RS256")
  Rel(bankportal, bankcore, "Ejecuta operaciones financieras reales", "HTTPS / X-API-Key + idempotencyKey")
  Rel(bankportal, redis, "Rate limiting + contadores", "Redis Protocol")
  Rel(bankportal, postgres, "Persistencia local", "JDBC")
  Rel(bankportal, mailhog, "Notificaciones pagos", "SMTP")
```

---

## Componentes involucrados — C4 Nivel 2

```mermaid
C4Container
  title BankPortal — Nuevos componentes FEAT-009

  Container(rl_filter, "RateLimitFilter (Bucket4j)", "Spring Filter", "DEBT-016: 429 si supera límite por userId/IP")
  Container(cb_adapter, "BankCoreRestAdapter", "Spring @Component @Profile(production)", "US-901: cliente HTTP real con Resilience4j")
  Container(resilience, "ResilienceConfig", "Spring @Configuration", "US-902: CB + Retry + Timeout beans Resilience4j")
  Container(bill_uc, "BillPaymentUseCase", "Spring @Service", "US-903: pago recibo domiciliado")
  Container(bill_lookup, "BillLookupUseCase", "Spring @Service", "US-904: lookup + pago factura con referencia")
  Container(bill_ctrl, "BillController", "Spring @RestController", "GET /bills · POST /bills/{id}/pay · POST /bills/pay")

  Container(core_port, "BankCoreTransferPort", "Interface (sin cambio)", "Puerto hexagonal — BankCoreRestAdapter lo implementa")
  Container(bill_port, "BillPaymentPort", "Interface (nuevo)", "Puerto hexagonal para pagos de facturas al core")
  Container(mock, "BankCoreMockAdapter", "Spring @Profile(staging,test)", "Sin cambios — sigue activo en no-production")

  Rel(rl_filter, cb_adapter, "Permite si no supera límite")
  Rel(cb_adapter, core_port, "Implementa")
  Rel(resilience, cb_adapter, "Decora con @CircuitBreaker @Retry @TimeLimiter")
  Rel(bill_uc, bill_port, "Delega pago al core")
  Rel(bill_ctrl, bill_uc, "Delega")
  Rel(bill_ctrl, bill_lookup, "Delega")
```

---

## Flujo de transferencia con core real + resiliencia

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario
  participant C as TransferController
  participant RL as RateLimitFilter
  participant UC as TransferUseCase
  participant CB as CircuitBreaker (Resilience4j)
  participant RA as BankCoreRestAdapter
  participant CORE as Core Bancario Real
  participant AU as AuditLogService

  U->>RL: POST /api/v1/transfers/own
  RL->>RL: Bucket4j check: rl:transfer:{userId}
  alt Límite superado
    RL-->>U: HTTP 429 RATE_LIMIT_EXCEEDED + Retry-After
    RL->>AU: log TRANSFER_RATE_LIMIT_EXCEEDED
  end

  RL->>C: Petición permitida
  C->>UC: execute(OwnTransferCommand)
  UC->>AU: log TRANSFER_INITIATED
  UC->>UC: Validar límites diarios Redis
  UC->>UC: Verificar saldo + OTP

  UC->>CB: executeOwnTransfer(cmd)
  alt Circuit OPEN
    CB-->>UC: throw CallNotPermittedException
    UC-->>U: HTTP 503 CORE_CIRCUIT_OPEN
  end

  CB->>RA: executeOwnTransfer (con idempotencyKey)
  RA->>CORE: POST /core/v1/transfers/own {idempotencyKey}
  alt Timeout > 5s
    RA-->>CB: TimeoutException
    CB->>CB: Retry (máx 2 reintentos con backoff 500ms)
    CB-->>UC: throw TimeLimiterException
    UC-->>U: HTTP 503 CORE_TIMEOUT
  end
  CORE-->>RA: 200 { transactionId, sourceBalance, targetBalance }
  RA-->>CB: TransferResult(success=true, ...)
  CB-->>UC: TransferResult

  UC->>UC: Persistir en BD local (@Transactional)
  UC->>AU: log TRANSFER_COMPLETED
  UC-->>U: HTTP 200 { transferId, status, balances }
```

---

## ADRs generados

| ADR | Título | Estado |
|---|---|---|
| ADR-017 | Resilience4j para resiliencia de llamadas al core bancario | Propuesto |
| ADR-018 | Bucket4j + Redis para rate limiting en endpoints financieros | Propuesto |

---

## Contrato de integración Backend → Frontend (nuevos endpoints)

| Método | Endpoint | Descripción |
|---|---|---|
| GET | /api/v1/bills | Listar recibos domiciliados PENDING |
| POST | /api/v1/bills/{id}/pay | Pagar recibo domiciliado (OTP) |
| GET | /api/v1/bills/lookup?reference={ref} | Buscar factura por referencia |
| POST | /api/v1/bills/pay | Pagar factura con referencia (OTP) |

---

*Generado por SOFIA Architect Agent — Step 3*
*CMMI Level 3 — TS SP 1.1 · TS SP 2.1*
*BankPortal Sprint 11 — FEAT-009 — 2026-03-21 — v1.0 PENDING APPROVAL*
