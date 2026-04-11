# HLD-FEAT-008 — Transferencias Bancarias
# BankPortal / Banco Meridian

## Metadata

| Campo | Valor |
|---|---|
| Feature | FEAT-008 — Transferencias Bancarias |
| Proyecto | BankPortal — Banco Meridian |
| Stack | Java 21 / Spring Boot 3.3.4 + Angular 17 |
| Tipo de trabajo | new-feature |
| Sprint | 10 |
| Versión | 1.0 |
| Estado | PENDING APPROVAL — Gate 3 Tech Lead |
| Fecha | 2026-03-20 |
| Autor | SOFIA Architect Agent |

---

## Análisis de impacto en monorepo (Paso 0)

| Servicio/Módulo | Tipo de impacto | Acción requerida |
|---|---|---|
| `JwtTokenProvider` / `PreAuthTokenProvider` | Cambio de algoritmo HS256 → RS256 | DEBT-014: reemplazar Keys.hmacShaKeyFor por keypair RSA-2048 |
| `JwtProperties` | Cambio de propiedades | Reemplazar `secret`/`pre-auth-secret` por `private-key-pem`/`public-key-pem` |
| `application-staging.yml` | Nuevas variables de configuración | Añadir claves RSA en Base64 + `docker-compose down -v` previo |
| `SecurityFilterChain` (FEAT-001) | Verificación JWT — cambio de key type | Actualizar `JwtAuthenticationFilter` para usar PublicKey RSA |
| Flyway V10 (FEAT-007) | Adición de V11 — sin modificar V10 | Nueva migración aditiva — sin impacto en datos existentes |
| `AccountSummaryUseCase` (FEAT-007) | Ninguno | — |
| `audit_log` (FEAT-005) | Nuevos event types | INSERT-only — compatible hacia adelante |

**Decisión:** Con impacto en JWT (DEBT-014) — documentado en ADR-015. Resto de cambios son aditivos y no breaking.

---

## Contexto del sistema — C4 Nivel 1

```mermaid
C4Context
  title BankPortal — FEAT-008 Transferencias Bancarias

  Person(user, "Usuario autenticado", "Cliente Banco Meridian con 2FA activo")

  System(bankportal, "BankPortal Backend", "Spring Boot 3.3 / Java 21. Gestiona autenticacion, sesiones, notificaciones y operaciones bancarias")

  System_Ext(bankcore, "Core Bancario (Mock Sprint 10)", "Adaptador de integracion. Ejecuta movimientos reales en cuentas. Real en Sprint 11")

  System_Ext(redis, "Redis 7", "Cache de contadores de limites de transferencia con TTL diario")

  System_Ext(postgres, "PostgreSQL 16", "Persistencia de beneficiarios, transferencias y limites")

  System_Ext(mailhog, "SMTP / MailHog STG", "Envio de notificaciones por email (confirmacion OTP, alertas)")

  Rel(user, bankportal, "Inicia transferencias y gestiona beneficiarios", "HTTPS / JWT RS256")
  Rel(bankportal, bankcore, "Ejecuta movimientos de fondos", "HTTP / Mock Interface")
  Rel(bankportal, redis, "Lee/escribe contadores diarios de limites", "Redis Protocol")
  Rel(bankportal, postgres, "Persiste beneficiarios, transferencias, limites", "JDBC / HikariCP")
  Rel(bankportal, mailhog, "Envia notificaciones operacionales", "SMTP")
```

---

## Componentes involucrados — C4 Nivel 2

```mermaid
C4Container
  title BankPortal Backend — Modulos FEAT-008

  Container(api_transfer, "TransferController", "Spring @RestController", "POST /api/v1/transfers/own y /beneficiary")
  Container(api_benef, "BeneficiaryController", "Spring @RestController", "CRUD /api/v1/beneficiaries")
  Container(api_limits, "TransferLimitsController", "Spring @RestController", "GET /api/v1/transfers/limits")

  Container(uc_transfer, "TransferUseCase", "Spring @Service", "Orquesta validacion + OTP + persistencia atomica")
  Container(uc_benef, "BeneficiaryManagementUseCase", "Spring @Service", "CRUD beneficiarios con validacion IBAN")
  Container(svc_limits, "TransferLimitValidationService", "Spring @Service", "Valida limites diario/mensual/operacion vs Redis")
  Container(svc_jwt, "JwtTokenProvider RS256", "Spring @Component", "DEBT-014: firma y verifica JWT con keypair RSA-2048")

  Container(port_core, "BankCoreTransferPort", "Interface (puerto hexagonal)", "Abstraccion del core bancario. Mock Sprint 10")
  Container(port_benef, "BeneficiaryRepositoryPort", "Interface JPA", "Acceso a tabla beneficiaries")
  Container(port_transfer, "TransferRepositoryPort", "Interface JPA", "Acceso a tabla transfers")

  Container(redis_adapter, "TransferLimitRedisAdapter", "Spring @Component", "INCRBY atomico + TTL medianoche UTC")
  Container(audit, "AuditLogService", "Spring @Service", "Registra eventos TRANSFER_* en audit_log inmutable")
  Container(flyway, "Flyway V11", "Migraciones SQL", "beneficiaries + transfers + transfer_limits")

  Rel(api_transfer, uc_transfer, "Delega")
  Rel(api_benef, uc_benef, "Delega")
  Rel(uc_transfer, svc_limits, "Valida antes de ejecutar")
  Rel(uc_transfer, port_core, "Ejecuta movimiento")
  Rel(uc_transfer, port_transfer, "Persiste transferencia")
  Rel(uc_transfer, audit, "Registra eventos")
  Rel(uc_benef, port_benef, "CRUD beneficiarios")
  Rel(svc_limits, redis_adapter, "Contador diario Redis")
  Rel(svc_jwt, redis_adapter, "Invalida JWT revocados")
```

---

## Flujo de transferencia — diagrama de secuencia principal

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario
  participant C as TransferController
  participant UC as TransferUseCase
  participant LS as LimitValidationService
  participant TF as TwoFactorService
  participant CP as BankCoreTransferPort
  participant TR as TransferRepository
  participant AU as AuditLogService
  participant RD as Redis

  U->>C: POST /transfers/own {sourceAccountId, targetAccountId, amount, concept, otpCode}
  C->>AU: log TRANSFER_INITIATED
  C->>UC: execute(OwnTransferCommand)

  UC->>LS: validate(userId, amount)
  LS->>RD: GET transfer:daily:{userId}:{date}
  RD-->>LS: dailyAccumulated
  alt limite superado
    LS-->>C: throw DailyLimitExceededException
    C-->>U: HTTP 422 DAILY_LIMIT_EXCEEDED
  end

  UC->>CP: getAvailableBalance(sourceAccountId)
  CP-->>UC: balance
  alt saldo insuficiente
    UC-->>C: throw InsufficientFundsException
    C-->>U: HTTP 422 INSUFFICIENT_FUNDS
  end

  UC->>TF: verifyCurrentOtp(userId, otpCode)
  alt OTP invalido
    TF-->>UC: throw InvalidOtpException
    UC->>AU: log TRANSFER_OTP_FAILED
    UC-->>C: HTTP 422 OTP_INVALID
  end
  UC->>AU: log TRANSFER_OTP_VERIFIED

  UC->>CP: executeOwnTransfer(cmd) [dentro de @Transactional]
  CP-->>UC: TransferResult {transferId, newBalances}
  UC->>TR: save(Transfer{COMPLETED})
  UC->>RD: INCRBY transfer:daily:{userId}:{date} amount
  UC->>AU: log TRANSFER_COMPLETED

  UC-->>C: TransferResponseDto
  C-->>U: HTTP 200 {transferId, status, executedAt, sourceBalance, targetBalance}
```

---

## Decisiones técnicas — ADRs generados

| ADR | Título | Estado |
|---|---|---|
| ADR-015 | Migración JWT de HS256 a RS256 (DEBT-014) | Propuesto |
| ADR-016 | Patrón saga local para atomicidad de transferencias | Propuesto |

---

## Servicios nuevos y modificados

| Servicio/Clase | Acción | Bounded Context | Notas |
|---|---|---|---|
| `TransferController` | NUEVO | Transfers | POST /own + /beneficiary |
| `BeneficiaryController` | NUEVO | Beneficiaries | CRUD + validacion IBAN |
| `TransferLimitsController` | NUEVO | Transfers | Solo lectura |
| `TransferUseCase` | NUEVO | Transfers | Saga local con @Transactional |
| `TransferToBeneficiaryUseCase` | NUEVO | Transfers | Reutiliza TransferUseCase |
| `BeneficiaryManagementUseCase` | NUEVO | Beneficiaries | CRUD + OTP en alta |
| `TransferLimitValidationService` | NUEVO | Transfers | Redis INCRBY atomic |
| `BankCoreTransferPort` | NUEVO | Transfers | Interfaz hexagonal sellada |
| `BankCoreMockAdapter` | NUEVO | Transfers | Mock Sprint 10 |
| `JwtTokenProvider` | MODIFICADO | Auth | HS256 -> RS256 (DEBT-014) |
| `PreAuthTokenProvider` | MODIFICADO | Auth | HS256 -> RS256 (DEBT-014) |
| `JwtProperties` | MODIFICADO | Auth | Nuevas propiedades PEM |
| Flyway V11 | NUEVO | DB | 3 tablas nuevas aditivas |

---

## Contrato de integración Backend -> Frontend

**Base URL:** `http://localhost:8081/api/v1` (STG)
**Auth:** `Authorization: Bearer {JWT RS256}`
**Content-Type:** `application/json`

| Método | Endpoint | Descripción |
|---|---|---|
| POST | /transfers/own | Transferencia entre cuentas propias |
| POST | /transfers/beneficiary | Transferencia a beneficiario guardado |
| GET | /transfers/limits | Consultar límites vigentes |
| GET | /beneficiaries | Listar beneficiarios activos |
| POST | /beneficiaries | Dar de alta beneficiario (con OTP) |
| PUT | /beneficiaries/{id} | Editar alias (sin OTP) |
| DELETE | /beneficiaries/{id} | Eliminar beneficiario (soft delete) |

---

*Generado por SOFIA Architect Agent — Step 3*
*CMMI Level 3 — TS SP 1.1 · TS SP 2.1 · TS SP 3.1*
*BankPortal Sprint 10 — FEAT-008 — 2026-03-20 — v1.0 PENDING APPROVAL*
