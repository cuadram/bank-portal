# LLD-007-backend — Bloqueo de Cuenta (Backend)
## FEAT-006 · US-601 · US-602 · Sprint 7

| Campo | Valor |
|---|---|
| **Documento** | LLD-007-backend-account-lock.md |
| **Feature** | FEAT-006 — Autenticación Contextual |
| **US** | US-601 (Bloqueo automático) · US-602 (Desbloqueo por email) |
| **Estado** | 🔒 PROPUESTO — Pendiente aprobación Tech Lead |
| **Fecha** | 2026-06-09 |
| **Autor** | SOFIA Architect Agent |
| **ADR relacionado** | ADR-007 (token HMAC — reutilizar para unlock link) |

---

## 1. Alcance

Diseño técnico backend para US-601 y US-602. El bloqueo ocurre a nivel de cuenta (campo `account_status` en tabla `users`, Flyway V8), no a nivel de IP (eso es ADR-006 rate limiting, ya existente).

---

## 2. Flyway V8 — Migración de BD

```sql
-- V8__account_lock_and_known_subnets.sql
-- FEAT-006: Bloqueo de cuenta + subnets conocidas
-- Sprint 7 — 2026-06-09

-- Extensión tabla users para bloqueo de cuenta (US-601)
ALTER TABLE users
  ADD COLUMN account_status        VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN failed_otp_attempts   INT         NOT NULL DEFAULT 0,
  ADD COLUMN failed_attempts_since TIMESTAMP,
  ADD COLUMN locked_at             TIMESTAMP,
  ADD COLUMN lock_unlock_token     VARCHAR(128);

-- CHECK constraint: solo valores permitidos
ALTER TABLE users
  ADD CONSTRAINT chk_account_status
    CHECK (account_status IN ('ACTIVE', 'LOCKED'));

-- Índice para unlock link (one-time lookup)
CREATE UNIQUE INDEX idx_users_lock_unlock_token
  ON users(lock_unlock_token)
  WHERE lock_unlock_token IS NOT NULL;

-- Tabla de subnets conocidas por usuario (US-603 — incluida aquí por cohesión)
CREATE TABLE known_subnets (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subnet      VARCHAR(32) NOT NULL,
    first_seen  TIMESTAMP   NOT NULL DEFAULT now(),
    last_seen   TIMESTAMP   NOT NULL DEFAULT now(),
    confirmed   BOOLEAN     NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX idx_known_subnets_user_subnet
  ON known_subnets(user_id, subnet);

CREATE INDEX idx_known_subnets_user_confirmed
  ON known_subnets(user_id) WHERE confirmed = true;

COMMENT ON COLUMN users.account_status
  IS 'ACTIVE | LOCKED — bloqueada por intentos fallidos de OTP';
COMMENT ON COLUMN users.failed_otp_attempts
  IS 'Contador de intentos fallidos de OTP en ventana de 24h (reset al desbloquear)';
COMMENT ON TABLE known_subnets
  IS 'Subnets IP conocidas y confirmadas por usuario — login contextual US-603';
```

---

## 3. Nuevos componentes backend

### 3.1 AccountLockService

```java
@Service
@RequiredArgsConstructor
@Transactional
public class AccountLockService {

    private static final int LOCK_THRESHOLD = 10;
    private static final int WARNING_THRESHOLD = 7;
    private static final Duration ATTEMPT_WINDOW = Duration.ofHours(24);

    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogRepository auditLogRepository;

    /**
     * Registra un intento fallido de OTP.
     * Retorna el resultado: OK (seguir), WARNING (avisar), LOCKED (bloquear).
     */
    public FailedAttemptResult recordFailedAttempt(UUID userId, String clientIp) {
        User user = userRepository.findById(userId).orElseThrow();

        // Resetear contador si la ventana de 24h expiró
        if (user.getFailedAttemptsSince() != null &&
            user.getFailedAttemptsSince().isBefore(LocalDateTime.now().minus(ATTEMPT_WINDOW))) {
            user.setFailedOtpAttempts(0);
            user.setFailedAttemptsSince(null);
        }

        int attempts = user.getFailedOtpAttempts() + 1;
        user.setFailedOtpAttempts(attempts);
        if (user.getFailedAttemptsSince() == null) {
            user.setFailedAttemptsSince(LocalDateTime.now());
        }

        if (attempts >= LOCK_THRESHOLD) {
            lockAccount(user, clientIp);
            userRepository.save(user);
            return FailedAttemptResult.locked();
        }

        userRepository.save(user);

        if (attempts >= WARNING_THRESHOLD) {
            int remaining = LOCK_THRESHOLD - attempts;
            return FailedAttemptResult.warning(remaining);
        }

        return FailedAttemptResult.ok();
    }

    private void lockAccount(User user, String clientIp) {
        user.setAccountStatus(AccountStatus.LOCKED);
        user.setLockedAt(LocalDateTime.now());
        notificationService.sendAccountLockedEmail(user.getId());
        auditLogRepository.save(AuditLog.of(
            user.getId(), SecurityEventType.ACCOUNT_LOCKED, clientIp));
    }

    /**
     * Verifica si la cuenta está bloqueada.
     * Lanza AccountLockedException si está bloqueada.
     */
    public void assertNotLocked(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();
        if (AccountStatus.LOCKED.equals(user.getAccountStatus())) {
            throw new AccountLockedException("Cuenta bloqueada. Revisa tu email para desbloquearla.");
        }
    }
}
```

### 3.2 AccountUnlockService

```java
@Service
@RequiredArgsConstructor
@Transactional
public class AccountUnlockService {

    private final UserRepository userRepository;
    private final HmacTokenService hmacTokenService;  // ADR-007
    private final AuditLogRepository auditLogRepository;

    /**
     * Genera y almacena un token de desbloqueo.
     * Reutiliza el patrón ADR-007: HMAC-SHA256, TTL 1h, one-time use.
     */
    public void initiateUnlock(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();
        if (!AccountStatus.LOCKED.equals(user.getAccountStatus())) {
            throw new IllegalStateException("La cuenta no está bloqueada.");
        }
        // El token HMAC se almacena hasheado en lock_unlock_token
        String rawToken = hmacTokenService.generate(userId.toString(), Duration.ofHours(1));
        user.setLockUnlockToken(hmacTokenService.hash(rawToken));
        userRepository.save(user);
        // El rawToken se envía por email (NotificationService lo llama el controller)
    }

    /**
     * Ejecuta el desbloqueo tras validar el token del email.
     */
    public void confirmUnlock(String rawToken, String clientIp) {
        // Buscar usuario por hash del token
        String tokenHash = hmacTokenService.hash(rawToken);
        User user = userRepository.findByLockUnlockToken(tokenHash)
            .orElseThrow(() -> new InvalidTokenException("Enlace inválido o ya usado."));

        // Validar TTL (lockedAt + 1h)
        if (user.getLockedAt().plus(Duration.ofHours(1)).isBefore(LocalDateTime.now())) {
            throw new TokenExpiredException("Este enlace ha expirado. Solicita uno nuevo desde el login.");
        }

        // Desbloquear cuenta
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setFailedOtpAttempts(0);
        user.setFailedAttemptsSince(null);
        user.setLockedAt(null);
        user.setLockUnlockToken(null);  // one-time: invalida el token
        userRepository.save(user);

        auditLogRepository.save(AuditLog.of(
            user.getId(), SecurityEventType.ACCOUNT_UNLOCKED, clientIp));
    }
}
```

### 3.3 AccountLockController

```java
@RestController
@RequestMapping("/auth/account")
@RequiredArgsConstructor
public class AccountLockController {

    private final AccountUnlockService unlockService;
    private final NotificationService notificationService;

    /**
     * POST /auth/account/unlock/request
     * Solicita enlace de desbloqueo por email. No requiere autenticación.
     * Body: { "email": "user@example.com" }
     */
    @PostMapping("/unlock/request")
    public ResponseEntity<Void> requestUnlock(@RequestBody UnlockRequest request) {
        userRepository.findByEmail(request.email()).ifPresent(user -> {
            unlockService.initiateUnlock(user.getId());
            notificationService.sendUnlockLinkEmail(user.getId(), /* rawToken from initiateUnlock */);
        });
        // Siempre 202 — no revelar si el email existe
        return ResponseEntity.accepted().build();
    }

    /**
     * GET /auth/account/unlock/confirm?token=<raw-token>
     * Confirma el desbloqueo mediante el token del email.
     */
    @GetMapping("/unlock/confirm")
    public ResponseEntity<Void> confirmUnlock(
            @RequestParam String token,
            HttpServletRequest request) {
        unlockService.confirmUnlock(token, extractClientIp(request));
        return ResponseEntity.ok().build();
    }
}
```

---

## 4. Modificaciones a componentes existentes

### 4.1 VerifyOtpUseCase — integrar bloqueo

```java
// Al inicio de execute(), antes de validar el OTP:
accountLockService.assertNotLocked(userId);  // lanza HTTP 423 si bloqueada

// Tras fallo de validación OTP:
FailedAttemptResult result = accountLockService.recordFailedAttempt(userId, clientIp);
if (result.isLocked()) {
    throw new AccountLockedException("Cuenta bloqueada.");
}
if (result.isWarning()) {
    // Incluir warning en response header o body
    response.addHeader("X-Remaining-Attempts", String.valueOf(result.remainingAttempts()));
}
```

### 4.2 SecurityEventType — nuevos valores

```java
ACCOUNT_LOCKED,                    // Cuenta bloqueada por intentos fallidos
ACCOUNT_UNLOCKED,                  // Cuenta desbloqueada por enlace email
ACCOUNT_UNLOCKED_VIA_RECOVERY,     // Desbloqueada mediante código de recuperación
```

### 4.3 AccountLockedException — nueva excepción HTTP 423

```java
@ResponseStatus(HttpStatus.LOCKED)  // HTTP 423
public class AccountLockedException extends RuntimeException {
    public AccountLockedException(String message) { super(message); }
}
```

---

## 5. Tests obligatorios

| Test | Capa | Descripción |
|---|---|---|
| `AccountLockServiceTest` | Unitario | recordFailedAttempt: 1→6 OK, 7→9 WARNING, 10 LOCKED; reseteo ventana 24h |
| `AccountUnlockServiceTest` | Unitario | initiateUnlock: token generado; confirmUnlock: válido, expirado, ya usado |
| `AccountLockControllerTest` | Integración (MockMvc) | requestUnlock: 202 siempre; confirmUnlock: 200, 400 expirado |
| `VerifyOtpUseCaseAccountLockTest` | Integración | Cuenta bloqueada → HTTP 423; warning headers en intento 7+ |
| `AccountLockFlywayV8Test` | Integración BD | V8 ejecutado en H2/Testcontainers sin errores |

---

## 6. Trazabilidad CMMI Nivel 3

| Área | Evidencia |
|---|---|
| REQM | US-601 criterios Gherkin ↔ AccountLockService.recordFailedAttempt; US-602 ↔ AccountUnlockService |
| TS | Diseño antes del código — gate Tech Lead requerido |
| VER | 5 tests definidos antes del código |
| RSKM | R-F6-001 (falsos positivos): umbral conservador 10 + aviso progresivo desde 7; R-F6-004 (Flyway ALTER): test en STG |
| SEC | PCI-DSS 4.0 req. 8.3.4 (bloqueo tras N intentos) — cumplido con LOCK_THRESHOLD=10 |

---

*SOFIA Architect Agent · BankPortal · LLD-007-backend · 2026-06-09*
*🔒 GATE: aprobación Tech Lead requerida antes de iniciar US-601 y US-602*
