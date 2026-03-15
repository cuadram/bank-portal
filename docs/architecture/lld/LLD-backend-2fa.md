# LLD — backend-2fa (FEAT-001)

## Metadata

| Campo | Valor |
|---|---|
| **Servicio** | `backend-2fa` |
| **Feature** | FEAT-001 — 2FA TOTP |
| **Stack** | Java 17 / Spring Boot 3.x / PostgreSQL |
| **Arquitectura** | Hexagonal (Ports & Adapters) |
| **Versión** | 1.0 |
| **Estado** | DRAFT — 🔒 Pendiente aprobación Tech Lead |
| **Fecha** | 2026-03-14 |

---

## Estructura de módulo (Java Hexagonal)

```
apps/backend-2fa/
├── pom.xml
└── src/
    ├── main/
    │   ├── java/com/experis/sofia/twofa/
    │   │   ├── domain/
    │   │   │   ├── model/
    │   │   │   │   ├── TotpSecret.java          # Value Object — secreto cifrado
    │   │   │   │   ├── RecoveryCode.java         # Value Object — código recuperación
    │   │   │   │   └── AuditEvent.java           # Entidad de auditoría
    │   │   │   ├── repository/
    │   │   │   │   ├── TotpSecretRepository.java # Puerto (interface)
    │   │   │   │   ├── RecoveryCodeRepository.java
    │   │   │   │   └── AuditEventRepository.java
    │   │   │   └── service/
    │   │   │       ├── TotpService.java          # Lógica TOTP (RFC 6238)
    │   │   │       ├── EncryptionService.java    # AES-256 cifrado/descifrado
    │   │   │       └── AuditService.java         # Registro de eventos
    │   │   ├── application/
    │   │   │   ├── usecase/
    │   │   │   │   ├── EnrollTotpUseCase.java    # US-001: enrolamiento
    │   │   │   │   ├── ActivateTotpUseCase.java  # US-001: activación
    │   │   │   │   ├── VerifyOtpUseCase.java     # US-002: verificación login
    │   │   │   │   ├── VerifyRecoveryUseCase.java# US-003: código recuperación
    │   │   │   │   ├── GenerateRecoveryUseCase.java # US-003: regenerar códigos
    │   │   │   │   └── DeactivateTotpUseCase.java# US-004: desactivación
    │   │   │   └── dto/
    │   │   │       ├── EnrollResponse.java       # { qrUri, secret }
    │   │   │       ├── ActivateRequest.java      # { otpCode }
    │   │   │       ├── ActivateResponse.java     # { recoveryCodes[] }
    │   │   │       ├── VerifyRequest.java        # { otpCode }
    │   │   │       ├── VerifyResponse.java       # { fullSessionToken }
    │   │   │       ├── RecoveryVerifyRequest.java# { recoveryCode }
    │   │   │       ├── DeactivateRequest.java    # { currentPassword }
    │   │   │       └── TwoFaStatusResponse.java  # { enabled, codesRemaining }
    │   │   ├── infrastructure/
    │   │   │   ├── persistence/
    │   │   │   │   ├── JpaTotpSecretRepository.java    # Adaptador JPA
    │   │   │   │   ├── JpaRecoveryCodeRepository.java
    │   │   │   │   ├── JpaAuditEventRepository.java
    │   │   │   │   └── entity/
    │   │   │   │       ├── TotpSecretEntity.java
    │   │   │   │       ├── RecoveryCodeEntity.java
    │   │   │   │       └── AuditEventEntity.java
    │   │   │   └── security/
    │   │   │       ├── JwtValidator.java         # Valida JWT parcial/completo
    │   │   │       ├── RateLimiterService.java   # 5 intentos → bloqueo 15 min
    │   │   │       └── AesEncryptionAdapter.java # Implementación AES-256
    │   │   └── api/
    │   │       ├── controller/
    │   │       │   └── TwoFaController.java      # @RestController /api/2fa
    │   │       └── advice/
    │   │           └── TwoFaExceptionHandler.java # @RestControllerAdvice
    │   └── resources/
    │       ├── application.yml
    │       └── db/migration/
    │           ├── V1__add_totp_columns_to_users.sql
    │           ├── V2__create_recovery_codes.sql
    │           └── V3__create_audit_log.sql
    └── test/
        └── java/com/experis/sofia/twofa/
            ├── domain/service/
            │   ├── TotpServiceTest.java
            │   └── AuditServiceTest.java
            ├── application/usecase/
            │   ├── EnrollTotpUseCaseTest.java
            │   ├── VerifyOtpUseCaseTest.java
            │   └── VerifyRecoveryUseCaseTest.java
            └── api/controller/
                └── TwoFaControllerTest.java      # @WebMvcTest
```

---

## Diagrama de clases — Dominio

```mermaid
classDiagram
  class TotpService {
    +String generateSecret()
    +String generateQRUrl(String secret, String userEmail, String issuer)
    +boolean verifyCode(String secret, String code, int tolerance)
  }

  class EncryptionService {
    +String encrypt(String plaintext)
    +String decrypt(String ciphertext)
  }

  class AuditService {
    +void logEvent(AuditEventType type, UUID userId, String ip, boolean success, String detail)
  }

  class TotpSecret {
    +UUID id
    +UUID userId
    +String encryptedSecret
    +boolean enabled
    +Instant activatedAt
  }

  class RecoveryCode {
    +UUID id
    +UUID userId
    +String codeHash
    +boolean used
    +Instant usedAt
  }

  class AuditEvent {
    +UUID id
    +AuditEventType eventType
    +UUID userId
    +String ipAddress
    +Instant timestamp
    +boolean success
    +String detail
  }

  class AuditEventType {
    <<enumeration>>
    2FA_ACTIVATED
    2FA_ACTIVATION_FAILED
    2FA_VERIFY_SUCCESS
    2FA_VERIFY_FAILED
    2FA_ACCOUNT_LOCKED
    2FA_RECOVERY_USED
    2FA_RECOVERY_FAILED
    2FA_RECOVERY_REGENERATED
    2FA_DEACTIVATED
    2FA_DEACTIVATION_FAILED
  }

  TotpService ..> TotpSecret : usa
  TotpSecret --> EncryptionService : delega cifrado
  AuditService --> AuditEvent : crea
  AuditEvent --> AuditEventType : tipo
  RecoveryCode --> TotpSecret : pertenece a userId
```

---

## Diagrama de secuencia — Verificación OTP en Login (US-002)

```mermaid
sequenceDiagram
  autonumber
  participant FE as Angular Frontend
  participant GW as API Gateway / Auth
  participant TFC as TwoFaController
  participant VOC as VerifyOtpUseCase
  participant RL as RateLimiterService
  participant TS as TotpService
  participant TSR as TotpSecretRepository
  participant ES as EncryptionService
  participant AS as AuditService
  participant JV as JwtValidator

  FE->>GW: POST /auth/login {user, pwd}
  GW-->>FE: JWT parcial {scope: "2fa-pending", sub: userId}

  FE->>TFC: POST /api/2fa/verify {otpCode} + Bearer JWT-parcial
  TFC->>JV: validatePartialJwt(token)
  JV-->>TFC: userId (valid)

  TFC->>RL: checkRateLimit(userId, ip)
  alt Bloqueado (≥5 intentos)
    RL-->>TFC: BLOCKED
    TFC->>AS: logEvent(2FA_ACCOUNT_LOCKED, userId, ip, false)
    TFC-->>FE: 429 Too Many Requests
  else Permitido
    RL-->>TFC: ALLOWED (intentos = N)
    TFC->>VOC: execute(userId, otpCode)
    VOC->>TSR: findByUserId(userId)
    TSR-->>VOC: TotpSecretEntity {encryptedSecret}
    VOC->>ES: decrypt(encryptedSecret)
    ES-->>VOC: plainSecret
    VOC->>TS: verifyCode(plainSecret, otpCode, tolerance=1)
    alt OTP válido
      TS-->>VOC: true
      VOC->>JV: issueFullSessionToken(userId)
      JV-->>VOC: JWT completo {scope: "full-session"}
      VOC->>AS: logEvent(2FA_VERIFY_SUCCESS, userId, ip, true)
      VOC-->>TFC: VerifyResponse {fullSessionToken}
      TFC-->>FE: 200 OK {token: fullSessionToken}
    else OTP inválido
      TS-->>VOC: false
      VOC->>RL: incrementFailureCount(userId, ip)
      VOC->>AS: logEvent(2FA_VERIFY_FAILED, userId, ip, false)
      VOC-->>TFC: OtpInvalidException
      TFC-->>FE: 401 Unauthorized {message: "Código incorrecto. Intento N de 5."}
    end
  end
```

---

## Diagrama de secuencia — Enrolamiento 2FA (US-001)

```mermaid
sequenceDiagram
  autonumber
  participant FE as Angular Frontend
  participant TFC as TwoFaController
  participant EUC as EnrollTotpUseCase
  participant AUC as ActivateTotpUseCase
  participant TS as TotpService
  participant ES as EncryptionService
  participant TSR as TotpSecretRepository
  participant RCR as RecoveryCodeRepository
  participant AS as AuditService

  FE->>TFC: POST /api/2fa/enroll (Bearer JWT completo)
  TFC->>EUC: execute(userId, userEmail)
  EUC->>TS: generateSecret()
  TS-->>EUC: rawSecret
  EUC->>TS: generateQRUrl(rawSecret, email, "BankPortal")
  TS-->>EUC: qrUri (otpauth://totp/...)
  EUC-->>TFC: EnrollResponse {qrUri, rawSecret}
  TFC-->>FE: 200 OK {qrUri, secret}

  Note over FE: Usuario escanea QR con app autenticadora

  FE->>TFC: POST /api/2fa/activate {otpCode}
  TFC->>AUC: execute(userId, otpCode, rawSecret)
  AUC->>TS: verifyCode(rawSecret, otpCode, tolerance=1)
  alt OTP válido (confirmación de enrolamiento)
    TS-->>AUC: true
    AUC->>ES: encrypt(rawSecret)
    ES-->>AUC: encryptedSecret
    AUC->>TSR: save(TotpSecretEntity{userId, encryptedSecret, enabled=true})
    AUC->>RCR: saveAll(10 × RecoveryCode{userId, hash(code)})
    AUC->>AS: logEvent(2FA_ACTIVATED, userId, ip, true)
    AUC-->>TFC: ActivateResponse {recoveryCodes[10]}
    TFC-->>FE: 200 OK {recoveryCodes}
  else OTP inválido
    TS-->>AUC: false
    AUC->>AS: logEvent(2FA_ACTIVATION_FAILED, userId, ip, false)
    AUC-->>TFC: OtpInvalidException
    TFC-->>FE: 400 Bad Request {message: "Código incorrecto."}
  end
```

---

## Modelo de datos

```mermaid
erDiagram
  users {
    uuid id PK
    varchar email NOT_NULL
    varchar password_hash NOT_NULL
    boolean totp_enabled DEFAULT_false
    timestamp created_at
    timestamp updated_at
  }

  totp_secrets {
    uuid id PK
    uuid user_id FK_users_id NOT_NULL UNIQUE
    text encrypted_secret NOT_NULL
    boolean enabled DEFAULT_false
    timestamp activated_at
    timestamp updated_at
  }

  recovery_codes {
    uuid id PK
    uuid user_id FK_users_id NOT_NULL
    varchar code_hash NOT_NULL
    boolean used DEFAULT_false
    timestamp used_at
    timestamp created_at
  }

  audit_log {
    uuid id PK
    varchar event_type NOT_NULL
    uuid user_id
    varchar ip_address NOT_NULL
    boolean success NOT_NULL
    text detail
    timestamp created_at NOT_NULL
  }

  users ||--o| totp_secrets : "tiene"
  users ||--o{ recovery_codes : "posee"
  users ||--o{ audit_log : "genera eventos"
```

---

## Estrategia de datos

| Aspecto | Decisión |
|---|---|
| **Motor** | PostgreSQL 15 (existente en proyecto) |
| **Patrón acceso** | Repository (Hexagonal — interfaces en domain, JPA en infrastructure) |
| **Migraciones** | Flyway — scripts versionados en `db/migration/` |
| **Índice `totp_secrets`** | `(user_id)` UNIQUE — búsqueda por usuario en cada verificación |
| **Índice `recovery_codes`** | `(user_id, used)` — filtrado rápido de códigos disponibles |
| **Índice `audit_log`** | `(user_id, created_at DESC)` — consultas forenses por usuario y fecha |
| **Cifrado `encrypted_secret`** | AES-256-GCM, clave en variable de entorno `TOTP_ENCRYPTION_KEY` |
| **Hash `code_hash`** | BCrypt (cost factor 12) — resistente a rainbow tables |

---

## Scripts de migración Flyway

### V1__add_totp_columns_to_users.sql
```sql
ALTER TABLE users
  ADD COLUMN totp_enabled BOOLEAN NOT NULL DEFAULT FALSE;
```

### V2__create_totp_secrets_and_recovery_codes.sql
```sql
CREATE TABLE totp_secrets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  encrypted_secret TEXT NOT NULL,
  enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  activated_at    TIMESTAMP WITH TIME ZONE,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE recovery_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash   VARCHAR(72) NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  used_at     TIMESTAMP WITH TIME ZONE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recovery_codes_user_available ON recovery_codes(user_id, used);
```

### V3__create_audit_log.sql
```sql
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  VARCHAR(50) NOT NULL,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address  VARCHAR(45) NOT NULL,
  success     BOOLEAN NOT NULL,
  detail      TEXT,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_date ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
```

---

## Variables de entorno requeridas

| Variable | Descripción | Ejemplo |
|---|---|---|
| `SPRING_DATASOURCE_URL` | URL JDBC PostgreSQL | `jdbc:postgresql://localhost:5432/bankportal` |
| `SPRING_DATASOURCE_USERNAME` | Usuario BD | `bankportal_user` |
| `SPRING_DATASOURCE_PASSWORD` | Contraseña BD | *(secret)* |
| `TOTP_ENCRYPTION_KEY` | Clave AES-256 (32 bytes base64) | *(secret — jamás hardcodeada)* |
| `JWT_PARTIAL_SECRET` | Clave firma JWT sesión parcial | *(secret)* |
| `JWT_FULL_SECRET` | Clave firma JWT sesión completa | *(secret)* |
| `TOTP_ISSUER` | Nombre emisor en QR | `BankPortal - Banco Meridian` |
| `RATE_LIMIT_MAX_ATTEMPTS` | Máx. intentos OTP | `5` |
| `RATE_LIMIT_BLOCK_MINUTES` | Minutos de bloqueo | `15` |

---

## Dependencias Maven (pom.xml additions)

```xml
<!-- TOTP — RFC 6238 -->
<dependency>
  <groupId>dev.samstevens.totp</groupId>
  <artifactId>totp-spring-boot-starter</artifactId>
  <version>1.7.1</version>
</dependency>

<!-- BCrypt para códigos de recuperación -->
<dependency>
  <groupId>org.springframework.security</groupId>
  <artifactId>spring-security-crypto</artifactId>
</dependency>

<!-- Rate limiting -->
<dependency>
  <groupId>com.bucket4j</groupId>
  <artifactId>bucket4j-core</artifactId>
  <version>8.10.1</version>
</dependency>

<!-- Flyway migraciones -->
<dependency>
  <groupId>org.flywaydb</groupId>
  <artifactId>flyway-core</artifactId>
</dependency>
```

---

*Generado por SOFIA Architect Agent — 2026-03-14*
*Estado: DRAFT — 🔒 Pendiente aprobación Tech Lead*
