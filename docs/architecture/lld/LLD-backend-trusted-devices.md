# LLD — Backend: Dispositivos de Confianza

## Metadata

| Campo | Valor |
|---|---|
| **Documento** | LLD-backend-trusted-devices |
| **Feature** | FEAT-003 — Dispositivos de Confianza |
| **Sprint** | 4 (implementado) / 5 (LLD formalizado — ACT-18) |
| **Autor** | SOFIA Architect Agent |
| **Fecha** | 2026-05-12 |
| **Versión** | 1.0.0 |
| **ADRs** | ADR-008 (cookie HttpOnly) · ADR-009 (clave dual HMAC) |
| **Relacionado** | LLD-backend-session-mgmt.md · LLD-frontend-trusted-devices.md |

---

## 1. Responsabilidad del módulo

El módulo `trusteddevice` implementa el flujo completo de "Recordar este dispositivo":

- **US-201:** Generación y persistencia del trust token tras login 2FA exitoso (opt-in del usuario)
- **US-202:** Listado y revocación de dispositivos de confianza
- **US-203:** Validación del trust token en el flujo de login para omitir OTP (con audit PCI-DSS req. 8.3)
- **US-204:** Expiración automática y limpieza nocturna de dispositivos expirados
- **DEBT-006:** Rotación de clave HMAC con ventana de gracia (clave dual, ADR-009)

---

## 2. Arquitectura de capas

```
API (Spring MVC)
  TrustedDeviceController          ← GET/DELETE /api/v1/trusted-devices
  TrustedDeviceAuthFilter          ← OncePerRequestFilter en login

Application
  MarkDeviceAsTrustedUseCase       ← US-201 — genera cookie + persiste en BD
  ValidateTrustedDeviceUseCase     ← US-203 — verifica cookie + fingerprint + HMAC
  ManageTrustedDevicesUseCase      ← US-202 — listado + revocación
                                   ← US-204 — @Scheduled cleanup nocturno

Domain
  TrustedDevice                    ← Entidad — invariantes, revocación, expiración
  TrustedDeviceRepository          ← Puerto (interfaz)
  DeviceFingerprintService         ← ua-parser-java (DEBT-004)

Infrastructure
  TrustedDeviceJpaRepository       ← Spring Data JPA
  TrustedDeviceRepositoryAdapter   ← Adaptador puerto → JPA
```

---

## 3. Modelo de dominio

### Entidad `TrustedDevice`

```java
TrustedDevice {
  UUID   id
  UUID   userId
  String tokenHash              // SHA-256 del trust token (nunca el token en claro)
  String deviceFingerprintHash  // SHA-256 de (User-Agent + IP subnet/16)
  String deviceOs               // ua-parser-java
  String deviceBrowser          // ua-parser-java (Edge ≠ Chrome tras DEBT-004)
  String ipMasked               // primeros 2 octetos + ".x.x"
  LocalDateTime createdAt
  LocalDateTime lastUsedAt
  LocalDateTime expiresAt       // createdAt + 30 días; renovado en cada uso
  LocalDateTime revokedAt       // null si activo
  String revokeReason           // MANUAL | MANUAL_ALL | RENEWED | LRU_EVICTION | null
}
```

**Invariantes:**
- `isActive()` = `revokedAt == null && expiresAt.isAfter(now())`
- `revoke()` lanza `IllegalStateException` si ya está revocado o expirado
- `recordUse()` actualiza `lastUsedAt` (el TTL se renueva en la cookie — BD no cambia `expiresAt`)

### Puerto `TrustedDeviceRepository`

```java
TrustedDevice save(TrustedDevice)
Optional<TrustedDevice> findActiveByTokenHash(String tokenHash)
Optional<TrustedDevice> findActiveByUserIdAndFingerprint(UUID userId, String fpHash)
List<TrustedDevice> findAllActiveByUserId(UUID userId)     // ORDER BY lastUsedAt DESC
int countActiveByUserId(UUID userId)
int markExpiredAsRevoked()                                  // batch — US-204 job
```

---

## 4. Flujos principales

### 4.1 US-201 — Marcar dispositivo como de confianza

**Trigger:** `POST /api/v1/2fa/verify` con `{ "otpCode": "123456", "trustDevice": true }`

```
AuthService.verify(request)
  → TwoFactorService.verifyOtp(userId, code)   // validación OTP existente
  → MarkDeviceAsTrustedUseCase.execute(userId, deviceInfo, rawIp, response)
      1. fingerprintService.extractIpSubnet(rawIp) → "192.168"
      2. fingerprintService.computeHash(userAgent, subnet) → fingerprintHash
      3. deviceRepository.findActiveByUserIdAndFingerprint(userId, fp)
         → si existe: existing.revoke("RENEWED"); save(existing)
      4. deviceRepository.countActiveByUserId(userId)
         → si count >= 10: evicionar LRU (min lastUsedAt) → revocar con "LRU_EVICTION"
      5. token = generateTrustToken(userId, fingerprint)   // HMAC-SHA256
         tokenHash = sha256(token)
      6. device = new TrustedDevice(...)
         deviceRepository.save(device)
      7. ResponseCookie.from("bp_trust", token)
            .httpOnly(true).secure(!isLocal)
            .sameSite("Strict").path("/api/v1/auth/login")
            .maxAge(30 * 24 * 3600)
         response.addHeader("Set-Cookie", cookie.toString())
      8. auditLogService.log("TRUSTED_DEVICE_CREATED", userId, deviceId)
  → jwtService.issueFullSession(userId)         // JWT completo habitual
```

**Generación del trust token:**
```
payload  = userId + ":" + fingerprintHash + ":" + System.currentTimeMillis()
signature = HmacSHA256(TRUSTED_DEVICE_HMAC_KEY, payload)
token    = Base64URL(payload + ":" + hexSignature)
```

### 4.2 US-203 — Login sin OTP desde dispositivo de confianza

**Trigger:** `POST /api/v1/auth/login` con cookie `bp_trust` presente

```
AuthService.login(request)
  → TwoFactorService.validateCredentials(username, password)
  → ValidateTrustedDeviceUseCase.validate(httpRequest, userId, rawIp)
      1. Extraer cookie bp_trust del request
         → null: return false (flujo 2FA normal)
      2. tokenHash = sha256(token)
      3. deviceRepository.findActiveByTokenHash(tokenHash)
         → empty: return false
      4. device.getUserId().equals(userId)
         → false: log WARN timing attack; return false
      5. currentFp = fingerprintService.computeHash(userAgent, ipSubnet)
         device.getDeviceFingerprintHash().equals(currentFp)
         → false: return false
      6. device.isActive()
         → false: return false
      7. device.recordUse(); deviceRepository.save(device)
      8. auditLogService.log("TRUSTED_DEVICE_LOGIN", userId, deviceId)  // PCI-DSS 8.3
      9. return true

  → si validate() == true:
      jwtService.issueFullSession(userId)    // sin solicitar OTP
  → si validate() == false:
      jwtService.issuePreAuth(userId)        // flujo 2FA normal
```

**DEBT-006 — Verificación con clave dual (ADR-009):**
```
verifyWithFallback(token, fingerprint):
  1. Verificar con HMAC_KEY_CURRENT
     → OK: aceptar
  2. Si falla Y HMAC_KEY_PREVIOUS no está vacía:
     Verificar con HMAC_KEY_PREVIOUS
     → OK: aceptar + log "TRUSTED_DEVICE_GRACE_VERIFY"
  3. Si ambas fallan: return false
```

### 4.3 US-202 — Gestionar dispositivos

```
GET  /api/v1/trusted-devices
  → ManageTrustedDevicesUseCase.listActive(userId)
  → deviceRepository.findAllActiveByUserId(userId)
  → List<TrustedDeviceResponse>

DELETE /api/v1/trusted-devices/{deviceId}
  → ManageTrustedDevicesUseCase.revokeOne(deviceId, userId)
  → deviceRepository.findAllActiveByUserId(userId)
     .filter(d -> d.getId().equals(deviceId))     // IDOR protection
  → device.revoke("MANUAL"); save(device)
  → auditLogService.log("TRUSTED_DEVICE_REVOKED", userId, deviceId)

DELETE /api/v1/trusted-devices
  → ManageTrustedDevicesUseCase.revokeAll(userId)
  → deviceRepository.findAllActiveByUserId(userId)
     .forEach(d -> d.revoke("MANUAL_ALL"); save(d))
  → auditLogService.log("TRUSTED_DEVICE_REVOKE_ALL", userId, "revoked=" + count)
```

### 4.4 US-204 — Limpieza nocturna

```java
@Scheduled(cron = "0 0 2 * * *", zone = "UTC")
public void cleanupExpired() {
    int cleaned = deviceRepository.markExpiredAsRevoked();
    // UPDATE trusted_devices SET revoked_at=now(), revoke_reason='EXPIRED'
    // WHERE revoked_at IS NULL AND expires_at < NOW()
    auditLogService.log("TRUSTED_DEVICE_EXPIRED_CLEANUP", SYSTEM_UUID, "count=" + cleaned);
}
```

**Fallback (R-F3-004):** `device.isActive()` verifica `expiresAt` en cada login —
si el job falla, los tokens expirados son rechazados igualmente.

---

## 5. Esquema de base de datos (Flyway V6)

```sql
CREATE TABLE trusted_devices (
    id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash               VARCHAR(64) NOT NULL,  -- SHA-256 del trust token
    device_fingerprint_hash  VARCHAR(64) NOT NULL,  -- SHA-256(UA + IP subnet)
    device_os                VARCHAR(64),
    device_browser           VARCHAR(64),
    ip_masked                VARCHAR(32),
    created_at               TIMESTAMP   NOT NULL DEFAULT now(),
    last_used_at             TIMESTAMP   NOT NULL DEFAULT now(),
    expires_at               TIMESTAMP   NOT NULL,  -- createdAt + 30 días
    revoked_at               TIMESTAMP,
    revoke_reason            VARCHAR(32)
);

-- Lookup por token hash — login filter O(1)
CREATE UNIQUE INDEX idx_trusted_devices_token_hash
    ON trusted_devices(token_hash)
    WHERE revoked_at IS NULL;

-- Dispositivos activos de un usuario (orden UI)
CREATE INDEX idx_trusted_devices_user_active
    ON trusted_devices(user_id, last_used_at DESC)
    WHERE revoked_at IS NULL AND expires_at > now();

-- Job de limpieza nocturna
CREATE INDEX idx_trusted_devices_expires
    ON trusted_devices(expires_at)
    WHERE revoked_at IS NULL;
```

---

## 6. Filtro Spring Security — orden de ejecución

```
Orden de filtros en SecurityConfig (de mayor a menor prioridad):
  1. TokenBlacklistFilter        ← revoca sesiones JWT (FEAT-002, ADR-006)
  2. TrustedDeviceAuthFilter     ← inyecta TRUST_TOKEN en request para login
  3. JwtAuthenticationFilter     ← valida JWT en endpoints protegidos
```

`TrustedDeviceAuthFilter` solo está activo en `POST /api/v1/auth/login`:
```java
@Override
protected boolean shouldNotFilter(HttpServletRequest request) {
    return !"/api/v1/auth/login".equals(request.getRequestURI())
        || !"POST".equals(request.getMethod());
}
```

---

## 7. Variables de entorno

| Variable | Obligatoria | Default | Descripción |
|---|---|---|---|
| `TRUSTED_DEVICE_HMAC_KEY` | ✅ | — | Clave HMAC activa — sign + verify |
| `TRUSTED_DEVICE_HMAC_KEY_PREVIOUS` | No | `""` | Clave HMAC anterior — verify only (ADR-009) |
| `TRUSTED_DEVICE_HMAC_GRACE_DAYS` | No | `30` | Días de ventana de gracia tras rotación |
| `TRUSTED_DEVICE_TTL_DAYS` | No | `30` | TTL del trust token en días |
| `TRUSTED_DEVICE_MAX_PER_USER` | No | `10` | Máximo de dispositivos confiables por usuario |
| `TRUSTED_DEVICE_COOKIE_SECURE` | No | `true` | `false` solo en perfil `local` |

---

## 8. Eventos de auditoría

| Evento | Trigger | PCI-DSS |
|---|---|---|
| `TRUSTED_DEVICE_CREATED` | Usuario marca dispositivo como confiable | — |
| `TRUSTED_DEVICE_LOGIN` | Login exitoso sin OTP desde dispositivo confiable | ✅ Req. 8.3 |
| `TRUSTED_DEVICE_GRACE_VERIFY` | Login con clave anterior (ventana de gracia, ADR-009) | ✅ Req. 8.3 |
| `TRUSTED_DEVICE_REVOKED` | Usuario revoca dispositivo individual | — |
| `TRUSTED_DEVICE_REVOKE_ALL` | Usuario revoca todos los dispositivos | — |
| `TRUSTED_DEVICE_EXPIRED_CLEANUP` | Job nocturno — dispositivos expirados | — |

---

## 9. Controles de seguridad

| Control | Implementación |
|---|---|
| Cookie inaccesible desde JS | HttpOnly + Secure + SameSite=Strict (ADR-008) |
| CSRF en login | SameSite=Strict elimina el vector nativo |
| IDOR | `findAllActiveByUserId(userId)` + `device.getUserId().equals(userId)` |
| Timing attacks en HMAC | Comparación en tiempo constante (`constantTimeEquals()`) |
| Trust token forgery | HMAC-SHA256 firmado con clave de servidor |
| Fingerprint binding | SHA-256(User-Agent + IP subnet) — token inútil en otro dispositivo |
| Token revocado activo | Verificación en BD en cada login (no solo TTL) |
| DoS por LRU | Límite de 10 dispositivos por usuario — evicción automática |
| Auditoría omisión OTP | `TRUSTED_DEVICE_LOGIN` en audit_log inmutable (Flyway V4 trigger) |

---

## 10. Tests cubiertos (Sprint 4)

| Clase de test | Tipo | Escenarios |
|---|---|---|
| `ManageTrustedDevicesUseCaseTest` | Unit | listActive, revokeOne (happy + IDOR + not found), revokeAll, entity invariants |
| `ValidateTrustedDeviceUseCaseTest` | Unit | happy path + no cookie + token not found + IDOR + fingerprint mismatch + expired |
| `DeviceFingerprintServiceTest` | Unit | DEBT-004: Edge≠Chrome + Chrome + Safari + mobile + null + hash determinístico |
| E2E Playwright (Sprint 4) | E2E | E2E-S4-01→09 — ciclo completo cookie + login sin OTP + revocación |

**Tests pendientes para DEBT-006 (Sprint 5):**
- `ValidateTrustedDeviceUseCaseTest.verifyWithGraceKey()` — token emitido con clave anterior, verificado OK con clave dual
- `ValidateTrustedDeviceUseCaseTest.rejectsBothKeys()` — token con ninguna de las dos claves → return false

---

*SOFIA Architect Agent · BankPortal · FEAT-003 · LLD Backend · 2026-05-12 (ACT-18)*
