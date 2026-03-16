# LLD — Backend: Bloqueo de Cuenta y Autenticación Contextual

## Metadata

| Campo | Valor |
|---|---|
| **Documento** | LLD-backend-contextual-auth |
| **Feature** | FEAT-006 — US-601/602/603 |
| **Sprint** | 7 |
| **Autor** | SOFIA Architect Agent |
| **Fecha** | 2026-06-09 |
| **ADRs** | ADR-002 (fases JWT) · ADR-005 (RS256) · ADR-007 (HMAC) · ADR-011 (context-pending) |

---

## 1. Responsabilidad del módulo

El módulo `auth` (extensión de autenticación) implementa:

- **US-601:** Bloqueo automático de cuenta tras 10 intentos fallidos de OTP en 24h
- **US-602:** Desbloqueo por enlace HMAC-SHA256 en email (patrón ADR-007)
- **US-603:** Detección de subnet IP nueva → scope JWT `context-pending` → confirmación email

---

## 2. Arquitectura de capas

```
API
  AccountController          ← POST /account/unlock · GET /account/unlock/{token}
  ConfirmContextController   ← POST /auth/confirm-context

Application
  AccountLockUseCase         ← US-601: gestiona contador de intentos + bloqueo
  AccountUnlockUseCase       ← US-602: genera y verifica unlock link HMAC
  LoginContextUseCase        ← US-603: verifica known_subnets + emite context-pending o full-session

Domain (extensión)
  AccountStatus (enum)       ← ACTIVE | LOCKED
  KnownSubnetRepository      ← Puerto: findByUserIdAndSubnet, save, existsConfirmed

Infrastructure
  KnownSubnetJpaRepository   ← Spring Data JPA sobre known_subnets (Flyway V8)
```

---

## 3. US-601 — Bloqueo automático

### Integración en TwoFactorService.verifyOtp()

```
TwoFactorService.verifyOtp(userId, otpCode):
  1. Verificar account_status == ACTIVE
     → LOCKED: throw AccountLockedException → HTTP 423

  2. Verificar OTP
     → OK:
        AccountLockUseCase.resetFailedAttempts(userId)
        return JWT (full-session o context-pending según subnet)
     → FAIL:
        AccountLockUseCase.recordFailedAttempt(userId)
        if attemptsInWindow >= 10:
          AccountLockUseCase.lockAccount(userId)
          NotificationService.createNotification(userId, ACCOUNT_LOCKED, ...)
          throw AccountLockedException
        else if attemptsInWindow >= 7:
          // Aviso progresivo
          return OtpErrorResponse(attemptsRemaining = 10 - attemptsInWindow)
```

### AccountLockUseCase

```java
// recordFailedAttempt: incrementa failed_otp_attempts y establece failed_attempts_since si es el primer intento
// Ventana de 24h: si failed_attempts_since < now() - 24h → resetear contador y empezar de nuevo
// lockAccount: account_status = LOCKED, locked_at = now()
// resetFailedAttempts: failed_otp_attempts = 0, failed_attempts_since = null
```

### Código de recuperación como escape hatch (US-601 Escenario 3)

Si el usuario usa un código de recuperación válido mientras la cuenta está bloqueada,
`verifyRecoveryCode()` hace bypass del check de `account_status` y además llama a
`AccountLockUseCase.resetFailedAttempts()` + `unlockAccount()`.

---

## 4. US-602 — Desbloqueo por email

### Flujo

```
POST /api/v1/account/unlock
  Body: { email: "user@banco.com" }
  → AccountUnlockUseCase.requestUnlock(email)
      1. findUserByEmail(email) — si no existe o no está bloqueada: respuesta 204 neutral
      2. token = HMAC-SHA256(userId + ":" + System.currentTimeMillis(), ACCOUNT_UNLOCK_HMAC_KEY)
      3. users.lock_unlock_token = sha256(token)
      4. emailService.sendUnlockEmail(email, token)
  → Response: 204 (siempre — evita user enumeration)

GET /api/v1/account/unlock/{token}
  → AccountUnlockUseCase.unlockByToken(token)
      1. tokenHash = sha256(token)
      2. findUserByLockUnlockToken(tokenHash)
         → not found: 400 TOKEN_INVALID
      3. Verificar TTL: locked_at + 1h > now()
         → expirado: 400 TOKEN_EXPIRED
      4. users.account_status = ACTIVE
         users.failed_otp_attempts = 0
         users.lock_unlock_token = null
      5. audit_log: ACCOUNT_UNLOCKED
      6. Redirect: /login?reason=account-unlocked
```

**Credential nuevo:** `ACCOUNT_UNLOCK_HMAC_KEY` — registrar en Jenkins + K8s Secret + README-CREDENTIALS.md

---

## 5. US-603 — Login contextual

### Flujo principal

```
TwoFactorService.verifyOtp() → OTP correcto
  → LoginContextUseCase.evaluateContext(userId, rawIp)
      1. subnet = fingerprintService.extractIpSubnet(rawIp)  // "192.168"
      2. subnetRepo.existsConfirmed(userId, subnet)
         → true: emitir full-session normalmente
         → false: CONTEXTO NUEVO
              a. JWT context-pending (scope=context-pending, pendingSubnet=subnet, TTL 15min)
              b. confirmToken = HMAC(userId + ":" + subnet + ":" + timestamp, CONTEXT_CONFIRM_KEY)
              c. emailService.sendContextConfirmEmail(userId, confirmToken)
              d. subnetRepo.save(KnownSubnet(userId, subnet, confirmed=false))
              e. audit_log: LOGIN_NEW_CONTEXT_DETECTED
              f. return ContextPendingResult(jwt=context-pending, subnet=subnet)
```

### ConfirmContextUseCase (endpoint /auth/confirm-context)

```
POST /api/v1/auth/confirm-context
  Headers: Authorization: Bearer <context-pending JWT>
  Body: { confirmationToken: "<token HMAC>" }

  1. Extraer userId + pendingSubnet del JWT claim
  2. Verificar confirmationToken HMAC (patrón ADR-007: TTL 15min, one-time use Redis)
  3. subnet actual del request == pendingSubnet del claim
     → mismatch: 400 SUBNET_MISMATCH
  4. subnetRepo.confirmSubnet(userId, pendingSubnet)  // confirmed = true
  5. Revocar context-pending JWT (blacklist Redis)
  6. Emitir full-session JWT
  7. audit_log: LOGIN_NEW_CONTEXT_CONFIRMED
```

---

## 6. SecurityFilterChain — extensión

```java
// JwtAuthenticationFilter — switch de scopes (ADR-011)
String scope = jwt.getClaim("scope");
Set<String> allowedPaths = switch (scope) {
    case "2fa-pending"     -> PRE_AUTH_PATHS;
    case "context-pending" -> Set.of("/api/v1/auth/confirm-context");  // ADR-011
    case "full-session"    -> ALL_PROTECTED_PATHS;
    default                -> throw new InvalidScopeException();
};
if (!allowedPaths.contains(requestPath)) throw FORBIDDEN;
```

---

## 7. Nuevos SecurityEventTypes (FEAT-006)

```java
// Añadir a SecurityEventType enum:
ACCOUNT_LOCKED("Cuenta bloqueada por exceso de intentos", true),      // crítico → SSE
ACCOUNT_UNLOCKED("Cuenta desbloqueada por enlace de email", false),
ACCOUNT_UNLOCKED_VIA_RECOVERY("Cuenta desbloqueada via código de recuperación", false),
LOGIN_NEW_CONTEXT_DETECTED("Acceso desde nueva ubicación de red detectado", true),  // crítico → SSE
LOGIN_NEW_CONTEXT_CONFIRMED("Nuevo acceso confirmado por email", false),
```

---

## 8. Variables de entorno nuevas

| Variable | Obligatoria | Descripción |
|---|---|---|
| `ACCOUNT_UNLOCK_HMAC_KEY` | ✅ | Clave HMAC para tokens de desbloqueo de cuenta (TTL 1h) |
| `CONTEXT_CONFIRM_HMAC_KEY` | ✅ | Clave HMAC para tokens de confirmación de contexto (TTL 15min) |
| `LOGIN_CONTEXT_ENABLED` | No (default: true) | Feature flag para desactivar login contextual en emergencia |

---

## 9. Tests requeridos (DoD Sprint 7)

| Test | Tipo | Escenarios clave |
|---|---|---|
| `AccountLockUseCaseTest` | Unit | Bloqueo a los 10 intentos · aviso desde el 7 · reset al login correcto · ventana 24h |
| `AccountUnlockUseCaseTest` | Unit | Unlock link válido · expirado · ya usado · user enumeration neutral |
| `LoginContextUseCaseTest` | Unit | Subnet conocida → full-session · subnet nueva → context-pending · confirmación OK · subnet mismatch |
| `ConfirmContextControllerTest` | @WebMvcTest | scope=context-pending requerido · confirmToken inválido · subnet mismatch |

---

*SOFIA Architect Agent · BankPortal · FEAT-006 · LLD Backend · 2026-06-09*
