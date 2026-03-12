# LLD — backend-2fa (Java / Spring Boot 3.x)

## Metadata

| Campo           | Valor                                        |
|-----------------|----------------------------------------------|
| Servicio        | `backend-2fa`                                |
| Stack           | Java 21 / Spring Boot 3.x / PostgreSQL 15    |
| Feature         | FEAT-001 — Autenticación 2FA / TOTP          |
| Proyecto        | BankPortal — Banco Meridian                  |
| Sprint          | 01                                           |
| Versión         | 1.0                                          |
| Estado          | DRAFT                                        |
| Autor           | SOFIA — Architect Agent                      |
| Fecha           | 2026-03-12                                   |

---

## 1. Estructura de módulo (Arquitectura hexagonal)

```
apps/backend-2fa/
├── src/
│   ├── main/
│   │   ├── java/com/experis/sofia/bankportal/twofa/
│   │   │   │
│   │   │   ├── domain/
│   │   │   │   ├── model/
│   │   │   │   │   ├── TotpSecret.java          # Value Object — secreto TOTP cifrado
│   │   │   │   │   ├── RecoveryCode.java         # Entidad — código de recuperación
│   │   │   │   │   ├── AuditEvent.java           # Entidad — registro de auditoría
│   │   │   │   │   └── TwoFactorStatus.java      # Enum: DISABLED, PENDING, ENABLED
│   │   │   │   ├── repository/
│   │   │   │   │   ├── TwoFactorRepository.java  # Puerto: operaciones en tabla users (cols 2FA)
│   │   │   │   │   ├── RecoveryCodeRepository.java
│   │   │   │   │   └── AuditLogRepository.java
│   │   │   │   └── service/
│   │   │   │       ├── TotpDomainService.java    # Genera/valida OTP (wraps librería)
│   │   │   │       ├── TotpEncryptionService.java# AES-256 encrypt/decrypt secreto TOTP
│   │   │   │       └── RateLimiterService.java   # Conteo de intentos fallidos por usuario
│   │   │   │
│   │   │   ├── application/
│   │   │   │   ├── usecase/
│   │   │   │   │   ├── EnrollTwoFactorUseCase.java       # US-001: genera secreto + QR URI
│   │   │   │   │   ├── ConfirmEnrollmentUseCase.java     # US-001: valida primer OTP, activa
│   │   │   │   │   ├── VerifyOtpUseCase.java             # US-002: valida OTP/recovery, emite JWT
│   │   │   │   │   ├── GenerateRecoveryCodesUseCase.java # US-003: genera/regenera recovery codes
│   │   │   │   │   ├── DisableTwoFactorUseCase.java      # US-004: desactiva 2FA
│   │   │   │   │   └── GetRecoveryCodesStatusUseCase.java
│   │   │   │   └── dto/
│   │   │   │       ├── EnrollResponseDto.java    # { secret, qrUri, qrImageBase64 }
│   │   │   │       ├── ConfirmEnrollRequestDto.java  # { otp }
│   │   │   │       ├── VerifyOtpRequestDto.java      # { preAuthToken, otp, recoveryCode }
│   │   │   │       ├── VerifyOtpResponseDto.java     # { accessToken, tokenType, expiresIn }
│   │   │   │       ├── RecoveryCodesResponseDto.java # { codes: List<String> }
│   │   │   │       ├── RecoveryCodesStatusDto.java   # { available: int, total: int }
│   │   │   │       └── DisableTwoFactorRequestDto.java # { password, otp }
│   │   │   │
│   │   │   ├── infrastructure/
│   │   │   │   ├── persistence/
│   │   │   │   │   ├── TwoFactorJpaRepository.java    # Spring Data JPA
│   │   │   │   │   ├── RecoveryCodeJpaRepository.java
│   │   │   │   │   ├── AuditLogJpaRepository.java
│   │   │   │   │   ├── entity/
│   │   │   │   │   │   ├── UserTwoFactorEntity.java   # Proyección de cols 2FA en tabla users
│   │   │   │   │   │   ├── RecoveryCodeEntity.java
│   │   │   │   │   │   └── AuditLogEntity.java
│   │   │   │   │   └── adapter/
│   │   │   │   │       ├── TwoFactorRepositoryAdapter.java
│   │   │   │   │       ├── RecoveryCodeRepositoryAdapter.java
│   │   │   │   │       └── AuditLogRepositoryAdapter.java
│   │   │   │   ├── config/
│   │   │   │   │   ├── TotpConfig.java           # Bean TotpManager (período=30s, tolerancia=1)
│   │   │   │   │   ├── SecurityConfig.java       # Spring Security: JWT filter + rate limit
│   │   │   │   │   └── AesEncryptionConfig.java  # Bean AES cipher clave desde env var
│   │   │   │   └── aop/
│   │   │   │       └── TwoFactorAuditAspect.java # @TwoFactorAudit — intercepta use cases
│   │   │   │
│   │   │   └── api/
│   │   │       ├── controller/
│   │   │       │   ├── TwoFactorEnrollController.java  # POST /2fa/enroll, POST /2fa/enroll/confirm
│   │   │       │   ├── TwoFactorVerifyController.java  # POST /2fa/verify
│   │   │       │   └── RecoveryCodesController.java    # GET /status, POST /generate
│   │   │       └── advice/
│   │   │           └── TwoFactorExceptionHandler.java  # @ControllerAdvice
│   │   │
│   │   └── resources/
│   │       ├── application.yml
│   │       └── db/migration/
│   │           ├── V2__add_two_factor_columns_users.sql
│   │           ├── V3__create_recovery_codes.sql
│   │           └── V4__create_audit_log.sql
│   │
│   └── test/
│       ├── java/com/experis/sofia/bankportal/twofa/
│       │   ├── domain/service/TotpDomainServiceTest.java
│       │   ├── application/usecase/EnrollTwoFactorUseCaseTest.java
│       │   ├── application/usecase/VerifyOtpUseCaseTest.java
│       │   ├── integration/TwoFactorFlowIntegrationTest.java  # SpringBootTest + Testcontainers
│       │   └── integration/AuditLogImmutabilityTest.java
│       └── resources/
│           └── application-test.yml
│
└── pom.xml
```

---

## 2. Diagrama de clases — dominio principal

```mermaid
classDiagram
  class TotpSecret {
    -String encryptedValue
    -String userId
    +TotpSecret encrypt(String raw, TotpEncryptionService svc)
    +String decrypt(TotpEncryptionService svc)
  }

  class RecoveryCode {
    +UUID id
    +String userId
    +String codeHash
    +boolean used
    +Instant createdAt
    +Instant usedAt
    +boolean matches(String rawCode)
    +void markUsed()
  }

  class AuditEvent {
    +UUID id
    +String userId
    +EventType eventType
    +String ipAddress
    +String userAgent
    +Instant timestamp
    +EventResult result
  }

  class EventType {
    <<enumeration>>
    TWO_FACTOR_ENROLLED
    TWO_FACTOR_DISABLED
    OTP_VERIFICATION_SUCCESS
    OTP_VERIFICATION_FAILED
    ACCOUNT_BLOCKED
    LOGIN_RECOVERY_CODE
    RECOVERY_CODES_REGENERATED
  }

  class EventResult {
    <<enumeration>>
    SUCCESS
    FAILURE
    BLOCKED
  }

  class TotpDomainService {
    -TotpManager totpManager
    +String generateSecret()
    +String buildQrUri(String secret, String email, String issuer)
    +boolean verifyOtp(String secret, String otp)
  }

  class TotpEncryptionService {
    -Cipher aesCipher
    +String encrypt(String plain)
    +String decrypt(String cipher)
  }

  class RateLimiterService {
    -Map~String,AttemptBucket~ buckets
    +boolean isBlocked(String userId)
    +void recordFailure(String userId)
    +void reset(String userId)
  }

  AuditEvent --> EventType
  AuditEvent --> EventResult
  TotpSecret --> TotpEncryptionService : usa
  TotpDomainService --> TotpEncryptionService : usa
```

---

## 3. Diagramas de secuencia

### 3.1 Flujo de enrolamiento (US-001)

```mermaid
sequenceDiagram
  actor U as Usuario
  participant C as TwoFactorEnrollController
  participant UC1 as EnrollTwoFactorUseCase
  participant UC2 as ConfirmEnrollmentUseCase
  participant TS as TotpDomainService
  participant ES as TotpEncryptionService
  participant RCS as GenerateRecoveryCodesUseCase
  participant R as TwoFactorRepository
  participant AL as TwoFactorAuditAspect

  U->>C: POST /2fa/enroll (JWT Bearer)
  C->>UC1: execute(userId)
  UC1->>TS: generateSecret()
  TS-->>UC1: rawSecret
  UC1->>TS: buildQrUri(rawSecret, email, "BankMeridian")
  TS-->>UC1: otpauthUri
  UC1->>R: savePendingSecret(userId, rawSecret)
  note over R: Secreto en estado PENDING, aún sin cifrar en sesión temporal
  UC1-->>C: EnrollResponseDto {qrUri, qrImageBase64}
  C-->>U: 200 OK

  U->>C: POST /2fa/enroll/confirm {otp}
  C->>UC2: execute(userId, otp)
  UC2->>R: getPendingSecret(userId)
  R-->>UC2: rawSecret
  UC2->>TS: verifyOtp(rawSecret, otp)
  TS-->>UC2: true/false
  alt OTP inválido
    UC2-->>C: throw InvalidOtpException
    C-->>U: 400 Bad Request
  end
  UC2->>ES: encrypt(rawSecret)
  ES-->>UC2: encryptedSecret
  UC2->>R: activateTwoFactor(userId, encryptedSecret)
  UC2->>RCS: execute(userId)
  RCS-->>UC2: List<String> plainCodes
  AL->>AL: @TwoFactorAudit → log TWO_FACTOR_ENROLLED/SUCCESS
  UC2-->>C: RecoveryCodesResponseDto {codes}
  C-->>U: 200 OK (códigos mostrados UNA sola vez)
```

### 3.2 Flujo de login con 2FA (US-002)

```mermaid
sequenceDiagram
  actor U as Usuario
  participant AC as AuthController (existente)
  participant AS as AuthService (existente)
  participant C as TwoFactorVerifyController
  participant UC as VerifyOtpUseCase
  participant RL as RateLimiterService
  participant TS as TotpDomainService
  participant ES as TotpEncryptionService
  participant R as TwoFactorRepository
  participant AL as TwoFactorAuditAspect

  U->>AC: POST /auth/login {username, password}
  AC->>AS: authenticate(username, password)
  AS->>AS: credenciales OK?
  AS->>R: isTwoFactorEnabled(userId)
  alt 2FA desactivado
    AS-->>AC: JWT completo
    AC-->>U: 200 {access_token}
  else 2FA activo
    AS-->>AC: preAuthToken (JWT, TTL=5min, claim pre_auth=true)
    AC-->>U: 200 {pre_auth_token}
  end

  U->>C: POST /2fa/verify {preAuthToken, otp}
  C->>UC: execute(preAuthToken, otp)
  UC->>UC: validar preAuthToken (firma + TTL + claim pre_auth=true)
  UC->>RL: isBlocked(userId)
  alt bloqueado
    UC-->>C: throw AccountBlockedException
    C-->>U: 429 Too Many Requests
  end
  UC->>R: getEncryptedSecret(userId)
  UC->>ES: decrypt(encryptedSecret)
  ES-->>UC: rawSecret
  UC->>TS: verifyOtp(rawSecret, otp)
  alt OTP inválido
    UC->>RL: recordFailure(userId)
    RL->>RL: ¿intentos >= 5 en 10min?
    alt bloqueo activado
      UC->>R: setBlockedUntil(userId, now+15min)
      AL->>AL: log ACCOUNT_BLOCKED
    else sin bloqueo
      AL->>AL: log OTP_VERIFICATION_FAILED
    end
    UC-->>C: throw InvalidOtpException
    C-->>U: 401 Unauthorized
  end
  UC->>RL: reset(userId)
  UC->>AS: issueFullJwt(userId)
  AS-->>UC: accessToken
  AL->>AL: log OTP_VERIFICATION_SUCCESS
  UC-->>C: VerifyOtpResponseDto {access_token}
  C-->>U: 200 OK
```

### 3.3 Uso de recovery code (US-003 / US-002)

```mermaid
sequenceDiagram
  actor U as Usuario
  participant C as TwoFactorVerifyController
  participant UC as VerifyOtpUseCase
  participant RCR as RecoveryCodeRepository
  participant AL as TwoFactorAuditAspect

  U->>C: POST /2fa/verify {preAuthToken, recoveryCode}
  C->>UC: execute(preAuthToken, null, recoveryCode)
  UC->>UC: validar preAuthToken
  UC->>RCR: findUnusedByUserId(userId)
  loop Por cada código almacenado
    UC->>UC: bcrypt.matches(rawCode, storedHash)
    alt coincide
      UC->>RCR: markUsed(codeId)
      AL->>AL: log LOGIN_RECOVERY_CODE/SUCCESS
      UC-->>C: VerifyOtpResponseDto {access_token}
      C-->>U: 200 OK
    end
  end
  note over UC: Si ningún código coincide
  AL->>AL: log OTP_VERIFICATION_FAILED
  UC-->>C: throw InvalidRecoveryCodeException
  C-->>U: 401 Unauthorized
```

---

## 4. Modelo de datos (ER Diagram)

```mermaid
erDiagram

  USERS {
    uuid id PK
    string email NOT_NULL
    string password_hash NOT_NULL
    boolean two_factor_enabled DEFAULT_false
    string totp_secret_enc "AES-256 cifrado — NULL si 2FA inactivo"
    timestamp two_factor_enrolled_at
    int totp_failed_attempts DEFAULT_0
    timestamp totp_blocked_until
  }

  RECOVERY_CODES {
    uuid id PK
    uuid user_id FK
    string code_hash NOT_NULL "bcrypt coste >= 10"
    boolean used DEFAULT_false
    timestamp created_at NOT_NULL
    timestamp used_at
  }

  AUDIT_LOG {
    uuid id PK
    uuid user_id NOT_NULL
    string event_type NOT_NULL "Ver EventType enum"
    string ip_address NOT_NULL
    string user_agent
    timestamp timestamp NOT_NULL
    string result NOT_NULL "SUCCESS | FAILURE | BLOCKED"
  }

  USERS ||--o{ RECOVERY_CODES : "tiene"
  USERS ||--o{ AUDIT_LOG : "genera"
```

---

## 5. Estrategia de datos

| Aspecto          | Decisión                                                                        |
|------------------|---------------------------------------------------------------------------------|
| Motor            | PostgreSQL 15                                                                   |
| Migraciones      | Flyway — versionado secuencial `V{n}__descripcion.sql`                          |
| Secreto TOTP     | Columna `totp_secret_enc` en tabla `users` — AES-256 CBC, IV aleatorio por registro |
| Recovery codes   | Tabla `recovery_codes` — hash bcrypt (coste=12) — nunca texto plano             |
| Audit log        | Sin UPDATE ni DELETE a nivel de aplicación — constraint DDL `REVOKE UPDATE, DELETE ON audit_log FROM bankportal_app` |
| Índices          | `recovery_codes(user_id, used)` — consulta frecuente de códigos disponibles; `audit_log(user_id, timestamp)` — consultas de auditoría por período |
| Retención        | `audit_log`: política de archivo a tabla histórica cada 12 meses (DevOps)       |

### Migraciones Flyway

**V2__add_two_factor_columns_users.sql**
```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS two_factor_enabled    BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS totp_secret_enc       TEXT,
  ADD COLUMN IF NOT EXISTS two_factor_enrolled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS totp_failed_attempts  INTEGER   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS totp_blocked_until    TIMESTAMPTZ;
```

**V3__create_recovery_codes.sql**
```sql
CREATE TABLE recovery_codes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash   TEXT        NOT NULL,
  used        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at     TIMESTAMPTZ
);
CREATE INDEX idx_recovery_codes_user_used ON recovery_codes(user_id, used);
```

**V4__create_audit_log.sql**
```sql
CREATE TABLE audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL,
  event_type  VARCHAR(50) NOT NULL,
  ip_address  VARCHAR(45) NOT NULL,
  user_agent  TEXT,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  result      VARCHAR(10) NOT NULL CHECK (result IN ('SUCCESS','FAILURE','BLOCKED'))
);
CREATE INDEX idx_audit_log_user_ts ON audit_log(user_id, timestamp);

-- Inmutabilidad a nivel DDL
REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM bankportal_app;
```

---

## 6. Contrato OpenAPI (definido por Architect)

> El Developer implementa este contrato. Puede proponer ajustes al Architect si detecta inconsistencias durante la implementación.

---

### POST /api/v1/2fa/enroll
**Descripción:** Genera secreto TOTP y devuelve URI QR para enrolamiento. No activa 2FA aún.
**Auth:** Bearer JWT de sesión completa.

**Response 200:**
```json
{
  "secret": "BASE32_ENCODED_SECRET",
  "qr_uri": "otpauth://totp/BankMeridian:user@bank.com?secret=...&issuer=BankMeridian",
  "qr_image_base64": "data:image/png;base64,..."
}
```
**Errores:** 401 (sin JWT), 409 (2FA ya activo)

---

### POST /api/v1/2fa/enroll/confirm
**Descripción:** Valida el primer OTP, activa 2FA y genera recovery codes.
**Auth:** Bearer JWT de sesión completa.

**Request:**
```json
{ "otp": "123456" }
```
**Response 200:**
```json
{
  "codes": [
    "A1B2-C3D4-E5F6", "G7H8-I9J0-K1L2"
    // ... 10 códigos en total — mostrar UNA sola vez
  ]
}
```
**Errores:** 400 (OTP inválido), 401 (sin JWT), 409 (2FA ya activo)

---

### POST /api/v1/2fa/verify
**Descripción:** Verifica OTP o recovery code. Emite JWT de acceso completo.
**Auth:** Header `Authorization: PreAuth <pre_auth_token>`

**Request:**
```json
{
  "otp": "123456",
  "recovery_code": null
}
```
*(Enviar `otp` o `recovery_code`, no ambos)*

**Response 200:**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```
**Errores:** 401 (pre_auth_token inválido/expirado o OTP incorrecto), 429 (rate limit — bloqueado 15min)

---

### GET /api/v1/2fa/recovery-codes/status
**Descripción:** Retorna cuántos recovery codes quedan disponibles.
**Auth:** Bearer JWT de sesión completa.

**Response 200:**
```json
{ "available": 7, "total": 10 }
```

---

### POST /api/v1/2fa/recovery-codes/generate
**Descripción:** Regenera los 10 recovery codes. Invalida los anteriores.
**Auth:** Bearer JWT de sesión completa.

**Request:**
```json
{ "password": "contraseña_actual" }
```
**Response 200:**
```json
{
  "codes": ["...", "..."]
}
```
**Errores:** 400 (contraseña incorrecta), 401 (sin JWT), 403 (2FA no activo)

---

### DELETE /api/v1/2fa/disable
**Descripción:** Desactiva 2FA. Elimina secreto TOTP e invalida todos los recovery codes.
**Auth:** Bearer JWT de sesión completa.

**Request:**
```json
{ "password": "contraseña_actual", "otp": "123456" }
```
**Response 200:**
```json
{ "message": "2FA desactivado correctamente." }
```
**Errores:** 400 (contraseña u OTP incorrecto), 401 (sin JWT), 403 (2FA no activo)

---

## 7. Variables de entorno requeridas

| Variable                  | Descripción                                         | Ejemplo / Formato                         |
|---------------------------|-----------------------------------------------------|-------------------------------------------|
| `TOTP_ISSUER`             | Nombre mostrado en la app autenticadora             | `BankMeridian`                            |
| `TOTP_AES_KEY`            | Clave AES-256 en Base64 (32 bytes → 44 chars Base64)| `(generada con openssl rand -base64 32)`  |
| `TOTP_AES_IV_SALT`        | Salt para derivar IV por registro                   | `(generada con openssl rand -base64 16)`  |
| `JWT_SECRET`              | Clave HMAC-SHA256 para firmar JWT                   | `(secret — no hardcodear)`               |
| `PRE_AUTH_TOKEN_TTL_MIN`  | TTL del pre-auth token en minutos                   | `5`                                       |
| `DB_URL`                  | URL de conexión PostgreSQL                          | `jdbc:postgresql://localhost:5432/bankdb` |
| `DB_USERNAME`             | Usuario DB                                          | `bankportal_app`                          |
| `DB_PASSWORD`             | Contraseña DB                                       | `(secret)`                                |
| `RATE_LIMIT_MAX_ATTEMPTS` | Intentos OTP antes de bloqueo                       | `5`                                       |
| `RATE_LIMIT_WINDOW_MIN`   | Ventana de tiempo para el rate limit (minutos)      | `10`                                      |
| `RATE_LIMIT_BLOCK_MIN`    | Duración del bloqueo en minutos                     | `15`                                      |

> ⚠️ `TOTP_AES_KEY` y `JWT_SECRET` **nunca** deben aparecer en código fuente ni en git. Inyectar desde Vault o variables de entorno del servidor CI/CD.

---

*Generado por SOFIA Architect Agent · BankPortal · Sprint 01 · 2026-03-12*
