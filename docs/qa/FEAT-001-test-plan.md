# Test Plan — FEAT-001: Autenticación de Doble Factor (2FA)

> **Artefacto:** Test Plan & Report  
> **Proceso CMMI:** VER — Verification / VAL — Validation  
> **Generado por:** SOFIA — QA Tester Agent  
> **Fecha:** 2026-03-12  
> **Versión:** 1.0 | **Estado:** DRAFT — Pendiente aprobación QA Lead

---

## Metadata

| Campo | Valor |
|---|---|
| Proyecto | BankPortal |
| Cliente | Banco Meridian |
| Stack | Java 21 / Spring Boot 3.x (backend) · Angular 17+ (frontend) |
| Tipo de trabajo | new-feature |
| Sprint | Sprint 01 (2026-03-11 → 2026-03-25) |
| Referencia Jira | FEAT-001 |
| Rama git | `feature/FEAT-001-autenticacion-2fa` |
| SRS baseline | `docs/srs/FEAT-001-srs.md` v1.0 |
| LLD Backend | `docs/architecture/lld/FEAT-001-lld-backend.md` |
| Commit backend HEAD | `874c206` (fix post-revisión E2E) |
| Alcance actual | Backend completo ✅ · Frontend pendiente ⏳ |

---

## Resumen de cobertura Gherkin → Test Cases

| User Story | Scenarios Gherkin | TCs Funcionales | TCs Seguridad | TCs Accesibilidad | TCs E2E | Total TCs |
|---|---|---|---|---|---|---|
| US-001 Enrolamiento 2FA | 4 | 6 | 2 | 3 ⏳ | 1 ⏳ | 12 |
| US-002 Verificación OTP login | 5 | 7 | 3 | 2 ⏳ | 2 ⏳ | 14 |
| US-003 Recovery codes | 4 | 5 | 2 | 1 ⏳ | 1 ⏳ | 9 |
| US-004 Desactivar 2FA | 4 | 5 | 2 | 1 ⏳ | 1 ⏳ | 9 |
| US-005 Auditoría eventos | 5 | 7 | 1 | — | — | 8 |
| US-006 Infra TOTP | 3 | 3 | — | — | — | 3 |
| US-007 Tests E2E (auditoría) | 3 | — | — | — | — | auditado |
| RNF delta (cross-cutting) | — | — | 5 | — | — | 5 |
| **TOTAL** | **28** | **33** | **15** | **7 ⏳** | **5 ⏳** | **60** |

> ⏳ = pendiente implementación frontend  
> Los 33 TCs funcionales + 15 TCs de seguridad = **48 TCs ejecutables en el estado actual del backend**

---

## Estado de ejecución

| Nivel | Total TCs | ✅ PASS | ❌ FAIL | ⚠️ Blocked | Estado |
|---|---|---|---|---|---|
| L1 — Unitarias (auditoría) | — | — | — | — | ⏳ Pendiente ejecución |
| L2 — Funcional / Aceptación API | 33 | — | — | — | ⏳ Pendiente ejecución |
| L3 — Seguridad backend | 15 | — | — | — | ⏳ Pendiente ejecución |
| L4 — Accesibilidad WCAG 2.1 AA | 7 | — | — | — | ⏳ Bloqueado — frontend pendiente |
| L5 — Integración (Testcontainers) | — | auditado | — | — | ⏳ Auditoría pendiente |
| L6 — E2E Playwright | 5 | — | — | — | ⏳ Bloqueado — frontend pendiente |

---

## NIVEL 1 — Auditoría de pruebas unitarias

### Checklist de auditoría (Dev Backend — Spring Boot)

| Clase de test | Escenarios esperados | Patrón AAA | Happy path | Error path | Edge case |
|---|---|---|---|---|---|
| `CryptoServiceTest` | 5 | □ verificar | □ | □ | □ |
| `TotpServiceTest` | — | □ | □ | □ | □ |
| `RecoveryCodeGeneratorServiceTest` | 7 | □ | □ | □ | □ |
| `PreAuthTokenProviderTest` | 5 | □ | □ | □ | □ |
| `RateLimiterServiceTest` | 7 | □ | □ | □ | □ |
| `EnrollTwoFactorUseCaseTest` | 5 | □ | □ | □ | □ |
| `ConfirmEnrollmentUseCaseTest` | 6 | □ | □ | □ | □ |
| `LoginUseCaseTest` | 4 | □ | □ | □ | □ |
| `VerifyOtpUseCaseTest` | 8 | □ | □ | □ | □ |
| `GenerateRecoveryCodesUseCaseTest` | 5 | □ | □ | □ | □ |
| `GetRecoveryCodesStatusUseCaseTest` | 6 | □ | □ | □ | □ |
| `DisableTwoFactorUseCaseTest` | 7 | □ | □ | □ | □ |
| `TwoFactorAuditAspectTest` | 9 | □ | □ | □ | □ |
| `ApplicationContextSmokeTest` | — | — | □ | — | — |

**Criterio:** Cobertura JaCoCo ≥ 80% en código nuevo. Si < 80% → GAP bloqueante.

**Instrucción de verificación:**
```bash
cd apps/backend-2fa
mvn verify -Pcoverage
# Revisar: target/site/jacoco/index.html
```

---

## NIVEL 2 — Casos de prueba funcionales / Aceptación (API)

> **Base URL:** `http://localhost:8080`  
> **Perfil activo:** `integration` (Testcontainers + PostgreSQL)  
> **Herramienta sugerida:** Postman collection o Bruno

---

### US-001 — Enrolamiento 2FA

---

#### TC-F-001 — Generación de secreto TOTP y QR de enrolamiento
- **US:** US-001 | **Gherkin:** Scenario: Generación de QR de enrolamiento
- **Nivel:** Funcional | **Tipo:** Happy Path | **Prioridad:** Alta
- **Precondiciones:** Usuario autenticado con JWT válido; `two_factor_enabled = false`

**Request:**
```http
POST /2fa/enroll
Authorization: Bearer {jwt_usuario_sin_2fa}
```

**Resultado esperado:**
- HTTP `200 OK`
- Body contiene `secret` (no vacío, no nulo)
- Body contiene `qrDataUri` con prefijo `data:image/png;base64,`
- `qrDataUri` decodificado contiene URI `otpauth://totp/BankMeridian:{email}?secret=...&issuer=BankMeridian`

**Resultado obtenido:** _[completar al ejecutar]_  
**Estado:** ⏳ Pendiente  
**Evidencia:** _[response body]_

---

#### TC-F-002 — Activación exitosa con OTP válido
- **US:** US-001 | **Gherkin:** Scenario: Activación exitosa con OTP válido
- **Nivel:** Funcional | **Tipo:** Happy Path | **Prioridad:** Alta
- **Precondiciones:** Usuario con enrolamiento iniciado (secreto generado); OTP producido por TOTP helper

**Request:**
```http
POST /2fa/enroll/confirm
Authorization: Bearer {jwt_usuario}
Content-Type: application/json

{
  "otpCode": "{otp_valido_generado}"
}
```

**Resultado esperado:**
- HTTP `200 OK`
- Body contiene lista `recoveryCodes` con exactamente 10 elementos
- Cada código cumple formato `XXXX-XXXX` (8 caracteres sin guión o según impl.)
- BD: `users.two_factor_enabled = true`
- BD: `users.totp_secret_enc` no nulo y distinto del secreto en texto plano (cifrado)
- BD: `recovery_codes` tiene 10 registros con `used = false`
- BD: `audit_log` tiene registro `event_type = TWO_FACTOR_ENROLLED`, `result = SUCCESS`

**Resultado obtenido:** _[completar]_  
**Estado:** ⏳ Pendiente

---

#### TC-F-003 — Rechazo de OTP inválido en enrolamiento
- **US:** US-001 | **Gherkin:** Scenario: Rechazo de OTP inválido en enrolamiento
- **Nivel:** Funcional | **Tipo:** Error Path | **Prioridad:** Alta
- **Precondiciones:** Usuario con enrolamiento iniciado

**Request:**
```http
POST /2fa/enroll/confirm
Authorization: Bearer {jwt_usuario}
Content-Type: application/json

{
  "otpCode": "000000"
}
```

**Resultado esperado:**
- HTTP `400 Bad Request` o `422 Unprocessable Entity`
- Body ProblemDetail con `detail` que contiene mensaje de código inválido
- BD: `two_factor_enabled` permanece `false`
- BD: `totp_secret_enc` permanece nulo (no persistido)

**Resultado obtenido:** _[completar]_  
**Estado:** ⏳ Pendiente

---

#### TC-F-004 — Intento de activar 2FA ya activo
- **US:** US-001 | **Gherkin:** Scenario: Intento de activar 2FA ya activo
- **Nivel:** Funcional | **Tipo:** Error Path | **Prioridad:** Media
- **Precondiciones:** Usuario con `two_factor_enabled = true`

**Request:**
```http
POST /2fa/enroll
Authorization: Bearer {jwt_usuario_con_2fa}
```

**Resultado esperado:**
- HTTP `409 Conflict`
- Body ProblemDetail indica que 2FA ya está activo
- No se genera nuevo secreto TOTP

**Resultado obtenido:** _[completar]_  
**Estado:** ⏳ Pendiente

---

#### TC-F-005 — Enrolamiento sin JWT retorna 401
- **US:** US-001 | **Tipo:** Edge Case | **Prioridad:** Alta
- **Precondiciones:** Sin token de autorización

**Request:**
```http
POST /2fa/enroll
```

**Resultado esperado:** HTTP `401 Unauthorized`

**Estado:** ⏳ Pendiente

---

#### TC-F-006 — QR URI contiene issuer y account correctos
- **US:** US-001 | **Gherkin:** Scenario: Generación de QR (campo issuer/account)
- **Tipo:** Edge Case | **Prioridad:** Alta

**Pasos:**
1. Ejecutar TC-F-001
2. Extraer `qrDataUri` y decodificar el QR o parsear el URI `otpauth://`

**Resultado esperado:**
- URI contiene `issuer=BankMeridian`
- URI contiene `{email_usuario}` como account
- URI sigue formato RFC 6238: `otpauth://totp/BankMeridian:{email}?secret={base32}&issuer=BankMeridian`

**Estado:** ⏳ Pendiente

---

### US-002 — Verificación OTP en flujo de login

---

#### TC-F-007 — Login con 2FA activo: emite pre-auth token, no JWT completo
- **US:** US-002 | **Gherkin:** Scenario: Login con 2FA activo — emisión de pre-auth token
- **Nivel:** Funcional | **Tipo:** Happy Path | **Prioridad:** Alta
- **Precondiciones:** Usuario con `two_factor_enabled = true`

**Request:**
```http
POST /auth/login
Content-Type: application/json

{
  "username": "test_user",
  "password": "Test1234!"
}
```

**Resultado esperado:**
- HTTP `200 OK`
- Body contiene `requiresTwoFactor: true`
- Body contiene `preAuthToken` (no nulo, no vacío)
- Body **NO** contiene `accessToken` con JWT completo
- `preAuthToken` tiene TTL de 5 minutos

**Resultado obtenido:** _[completar]_  
**Estado:** ⏳ Pendiente

---

#### TC-F-008 — Verificación OTP exitosa: emite JWT completo
- **US:** US-002 | **Gherkin:** Scenario: Verificación OTP exitosa — emisión de JWT completo
- **Nivel:** Funcional | **Tipo:** Happy Path | **Prioridad:** Alta
- **Precondiciones:** pre-auth token válido obtenido de TC-F-007

**Request:**
```http
POST /2fa/verify
Authorization: Bearer {pre_auth_token}
Content-Type: application/json

{
  "otpCode": "{otp_valido}",
  "recoveryCode": null
}
```

**Resultado esperado:**
- HTTP `200 OK`
- Body contiene `accessToken` (JWT completo con claims del usuario)
- BD: `audit_log` registra `event_type = OTP_VERIFICATION_SUCCESS`, `result = SUCCESS`

**Resultado obtenido:** _[completar]_  
**Estado:** ⏳ Pendiente

---

#### TC-F-009 — Pre-auth token expirado retorna 401
- **US:** US-002 | **Gherkin:** Scenario: Pre-auth token expirado
- **Tipo:** Error Path | **Prioridad:** Alta
- **Precondiciones:** pre-auth token con TTL expirado (simular via TTL=1s en test o usando token expirado)

**Request:**
```http
POST /2fa/verify
Authorization: Bearer {pre_auth_token_expirado}
Content-Type: application/json

{ "otpCode": "123456", "recoveryCode": null }
```

**Resultado esperado:**
- HTTP `401 Unauthorized`
- Body ProblemDetail indica sesión expirada

**Estado:** ⏳ Pendiente

---

#### TC-F-010 — Bloqueo tras 5 intentos OTP fallidos
- **US:** US-002 | **Gherkin:** Scenario: Bloqueo tras 5 intentos OTP fallidos
- **Tipo:** Error Path | **Prioridad:** Alta
- **Precondiciones:** pre-auth token válido; usuario no bloqueado

**Pasos:**
1. Enviar 5 peticiones `POST /2fa/verify` con `otpCode = "000000"` (inválido)
2. Enviar 6ª petición

**Resultado esperado:**
- Peticiones 1-4: HTTP `401` (OTP inválido)
- Petición 5: HTTP `401` + contador = 5
- Petición 6: HTTP `429 Too Many Requests`
- BD: `audit_log` registra `event_type = ACCOUNT_BLOCKED`, `result = BLOCKED`, con IP registrada
- Mensaje: indica bloqueo temporal de 15 minutos

**Resultado obtenido:** _[completar]_  
**Estado:** ⏳ Pendiente

---

#### TC-F-011 — Login usando código de recuperación como alternativa al OTP
- **US:** US-002 | **Gherkin:** Scenario: Login usando código de recuperación
- **Tipo:** Happy Path | **Prioridad:** Alta
- **Precondiciones:** pre-auth token válido; código de recuperación disponible no usado

**Request:**
```http
POST /2fa/verify
Authorization: Bearer {pre_auth_token}
Content-Type: application/json

{
  "otpCode": null,
  "recoveryCode": "ABCD-EFGH"
}
```

**Resultado esperado:**
- HTTP `200 OK`
- Body contiene `accessToken` (JWT completo)
- BD: código de recuperación usado tiene `used = true`
- BD: `audit_log` registra `event_type = LOGIN_RECOVERY_CODE`, `result = SUCCESS`

**Estado:** ⏳ Pendiente

---

#### TC-F-012 — Login sin 2FA activo emite JWT directo (sin pre-auth)
- **US:** US-002 | **Tipo:** Edge Case | **Prioridad:** Media
- **Precondiciones:** Usuario con `two_factor_enabled = false`

**Request:**
```http
POST /auth/login
Content-Type: application/json

{ "username": "user_sin_2fa", "password": "Test1234!" }
```

**Resultado esperado:**
- HTTP `200 OK`
- Body contiene `requiresTwoFactor: false`
- Body contiene `accessToken` (JWT completo directo)
- Body **NO** contiene `preAuthToken`

**Estado:** ⏳ Pendiente

---

#### TC-F-013 — Credenciales incorrectas en login retorna 401
- **US:** US-002 | **Tipo:** Edge Case | **Prioridad:** Alta

**Request:**
```http
POST /auth/login
Content-Type: application/json

{ "username": "test_user", "password": "wrongpassword" }
```

**Resultado esperado:** HTTP `401 Unauthorized`  
**Estado:** ⏳ Pendiente

---

### US-003 — Gestión de códigos de recuperación

---

#### TC-F-014 — Status de recovery codes retorna cantidad correcta
- **US:** US-003 | **Tipo:** Happy Path | **Prioridad:** Media
- **Precondiciones:** Usuario con 2FA activo y 10 códigos generados

**Request:**
```http
GET /2fa/recovery-codes/status
Authorization: Bearer {jwt_usuario}
```

**Resultado esperado:**
- HTTP `200 OK`
- Body: `available` = número de códigos no usados (10 si ninguno usado)
- Body: `total` = 10
- Body: `lowWarning` = `false` (si > umbral, e.g. > 3 disponibles)

**Estado:** ⏳ Pendiente

---

#### TC-F-015 — Reutilización de código de recuperación ya usado es rechazada
- **US:** US-003 | **Gherkin:** Scenario: Intento de reutilizar código ya usado
- **Tipo:** Error Path | **Prioridad:** Alta
- **Precondiciones:** Código de recuperación con `used = true` en BD

**Request:**
```http
POST /2fa/verify
Authorization: Bearer {pre_auth_token}
Content-Type: application/json

{ "otpCode": null, "recoveryCode": "{codigo_ya_usado}" }
```

**Resultado esperado:**
- HTTP `401 Unauthorized`
- Body ProblemDetail: código ya utilizado

**Estado:** ⏳ Pendiente

---

#### TC-F-016 — Regeneración de códigos con contraseña correcta
- **US:** US-003 | **Gherkin:** Scenario: Regenerar códigos desde perfil
- **Tipo:** Happy Path | **Prioridad:** Alta
- **Precondiciones:** Usuario con 2FA activo; códigos originales existentes

**Request:**
```http
POST /2fa/recovery-codes/generate
Authorization: Bearer {jwt_usuario}
Content-Type: application/json

{ "password": "Test1234!" }
```

**Resultado esperado:**
- HTTP `200 OK`
- Body contiene `recoveryCodes` con exactamente 10 códigos nuevos
- BD: códigos anteriores `used = true` (invalidados)
- BD: 10 nuevos registros `used = false`
- BD: `audit_log` registra `event_type = RECOVERY_CODES_REGENERATED`, `result = SUCCESS`

**Estado:** ⏳ Pendiente

---

#### TC-F-017 — Regeneración con contraseña incorrecta es rechazada
- **US:** US-003 | **Gherkin:** Scenario: Contraseña incorrecta al regenerar
- **Tipo:** Error Path | **Prioridad:** Alta

**Request:**
```http
POST /2fa/recovery-codes/generate
Authorization: Bearer {jwt_usuario}
Content-Type: application/json

{ "password": "wrongpassword" }
```

**Resultado esperado:**
- HTTP `400 Bad Request` o `401 Unauthorized`
- BD: códigos anteriores no modificados

**Estado:** ⏳ Pendiente

---

#### TC-F-018 — lowWarning activo cuando quedan ≤ 3 códigos disponibles
- **US:** US-003 | **Tipo:** Edge Case | **Prioridad:** Media
- **Precondiciones:** Usuario con exactamente 2 códigos disponibles (8 usados)

**Request:** `GET /2fa/recovery-codes/status`

**Resultado esperado:**
- `available` = 2
- `lowWarning` = `true`

**Estado:** ⏳ Pendiente

---

### US-004 — Desactivar 2FA

---

#### TC-F-019 — Desactivación exitosa con contraseña y OTP correctos
- **US:** US-004 | **Gherkin:** Scenario: Desactivación exitosa
- **Tipo:** Happy Path | **Prioridad:** Alta
- **Precondiciones:** Usuario con 2FA activo; JWT completo; OTP válido

**Request:**
```http
DELETE /2fa/disable
Authorization: Bearer {jwt_usuario}
Content-Type: application/json

{
  "password": "Test1234!",
  "otpCode": "{otp_valido}"
}
```

**Resultado esperado:**
- HTTP `200 OK`
- BD: `users.two_factor_enabled = false`
- BD: `users.totp_secret_enc = null`
- BD: todos los `recovery_codes` del usuario con `used = true`
- BD: `audit_log` registra `event_type = TWO_FACTOR_DISABLED`, `result = SUCCESS`

**Estado:** ⏳ Pendiente

---

#### TC-F-020 — Rechazo por contraseña incorrecta en desactivación
- **US:** US-004 | **Gherkin:** Scenario: Rechazo por contraseña incorrecta
- **Tipo:** Error Path | **Prioridad:** Alta

**Request:**
```http
DELETE /2fa/disable
Authorization: Bearer {jwt_usuario}
Content-Type: application/json

{ "password": "wrongpassword", "otpCode": "{otp_valido}" }
```

**Resultado esperado:**
- HTTP `400` o `401`
- BD: 2FA permanece activo; secreto TOTP no eliminado

**Estado:** ⏳ Pendiente

---

#### TC-F-021 — Rechazo por OTP inválido en desactivación
- **US:** US-004 | **Gherkin:** Scenario: Rechazo por OTP inválido
- **Tipo:** Error Path | **Prioridad:** Alta

**Request:**
```http
DELETE /2fa/disable
Authorization: Bearer {jwt_usuario}
Content-Type: application/json

{ "password": "Test1234!", "otpCode": "000000" }
```

**Resultado esperado:**
- HTTP `400 Bad Request`
- BD: 2FA permanece activo

**Estado:** ⏳ Pendiente

---

#### TC-F-022 — Intento de desactivar 2FA ya inactivo
- **US:** US-004 | **Gherkin:** Scenario: Desactivar 2FA cuando ya está inactivo
- **Tipo:** Error Path | **Prioridad:** Media
- **Precondiciones:** Usuario con `two_factor_enabled = false`

**Request:**
```http
DELETE /2fa/disable
Authorization: Bearer {jwt_usuario_sin_2fa}
Content-Type: application/json

{ "password": "Test1234!", "otpCode": "123456" }
```

**Resultado esperado:**
- HTTP `409 Conflict` o `400 Bad Request`
- Body indica que 2FA no está activo

**Estado:** ⏳ Pendiente

---

#### TC-F-023 — Verificar limpieza completa en BD tras desactivación
- **US:** US-004 | **Tipo:** Edge Case | **Prioridad:** Alta
- **Precondiciones:** TC-F-019 ejecutado con éxito

**Pasos:**
1. Verificar directamente en BD: `SELECT totp_secret_enc, two_factor_enabled FROM users WHERE username='test_user'`
2. Verificar: `SELECT COUNT(*) FROM recovery_codes WHERE user_id={id} AND used=false`

**Resultado esperado:**
- `totp_secret_enc = NULL`
- `two_factor_enabled = false`
- `COUNT(*) = 0` (ningún código activo)

**Estado:** ⏳ Pendiente

---

### US-005 — Auditoría de eventos 2FA

---

#### TC-F-024 — Registro de TWO_FACTOR_ENROLLED en audit_log
- **US:** US-005 | **Gherkin:** Scenario: Registro de evento de activación 2FA
- **Tipo:** Happy Path | **Prioridad:** Alta
- **Precondiciones:** Flujo de TC-F-002 ejecutado

**Verificación BD:**
```sql
SELECT event_type, ip_address, result, timestamp
FROM audit_log
WHERE user_id = {id}
  AND event_type = 'TWO_FACTOR_ENROLLED'
ORDER BY timestamp DESC
LIMIT 1;
```

**Resultado esperado:**
- 1 registro con `event_type = TWO_FACTOR_ENROLLED`
- `result = SUCCESS`
- `ip_address` no nulo
- `timestamp` en UTC, no nulo

**Estado:** ⏳ Pendiente

---

#### TC-F-025 — Registro de OTP_VERIFICATION_FAILED en audit_log
- **US:** US-005 | **Gherkin:** Scenario: Registro de intento de login OTP fallido
- **Tipo:** Happy Path | **Prioridad:** Alta
- **Precondiciones:** TC-F-010 ejecutado (al menos 1 intento fallido)

**Verificación BD:**
```sql
SELECT event_type, result, ip_address FROM audit_log
WHERE event_type = 'OTP_VERIFICATION_FAILED'
ORDER BY timestamp DESC LIMIT 1;
```

**Resultado esperado:** `result = FAILURE`, IP registrada

**Estado:** ⏳ Pendiente

---

#### TC-F-026 — Registro de ACCOUNT_BLOCKED en audit_log
- **US:** US-005 | **Gherkin:** Scenario: Registro de bloqueo de cuenta
- **Tipo:** Happy Path | **Prioridad:** Alta
- **Precondiciones:** TC-F-010 ejecutado (5 intentos)

**Resultado esperado:**
- Registro con `event_type = ACCOUNT_BLOCKED`, `result = BLOCKED`

**Estado:** ⏳ Pendiente

---

#### TC-F-027 — Inmutabilidad: intento de UPDATE en audit_log es rechazado
- **US:** US-005 | **Gherkin:** Scenario: Inmutabilidad de registros
- **Tipo:** Edge Case | **Prioridad:** Alta

**Pasos:**
1. Obtener un `id` de registro en `audit_log`
2. Intentar llamar a cualquier endpoint de modificación; verificar que no existe
3. Intentar ejecutar directamente via el adapter:
   ```java
   auditLogJpaRepository.save(existingRecord.withModifiedField());
   ```
   o verificar que `AuditLogEntity` está anotada con `@Immutable`

**Resultado esperado:**
- No existe endpoint de API que permita UPDATE/DELETE en `audit_log`
- Entidad `AuditLogEntity` tiene `@Immutable` o equivalente
- Intento de save con cambio lanza excepción o no persiste el cambio

**Estado:** ⏳ Pendiente

---

#### TC-F-028 — Cobertura completa: todos los event_types están implementados
- **US:** US-005 | **Gherkin:** Scenario: Cobertura completa de eventos auditables
- **Tipo:** Edge Case | **Prioridad:** Alta

**Pasos:** Ejecutar los siguientes flujos y verificar registro en `audit_log`:

| Flujo | event_type esperado |
|---|---|
| TC-F-002 — Confirmar enrolamiento | `TWO_FACTOR_ENROLLED` |
| TC-F-019 — Desactivar 2FA | `TWO_FACTOR_DISABLED` |
| TC-F-008 — Verificar OTP exitoso | `OTP_VERIFICATION_SUCCESS` |
| TC-F-010 — 1 intento OTP fallido | `OTP_VERIFICATION_FAILED` |
| TC-F-010 — 5 intentos fallidos | `ACCOUNT_BLOCKED` |
| TC-F-011 — Login con recovery code | `LOGIN_RECOVERY_CODE` |
| TC-F-016 — Regenerar recovery codes | `RECOVERY_CODES_REGENERATED` |

**Resultado esperado:** Los 7 `event_types` presentes en `audit_log` con resultados correctos

**Estado:** ⏳ Pendiente

---

#### TC-F-029 — OTP_VERIFICATION_SUCCESS registrado tras login exitoso
- **US:** US-005 | **Tipo:** Happy Path | **Prioridad:** Alta
- **Precondiciones:** TC-F-008 ejecutado con éxito

**Verificación BD:**
```sql
SELECT event_type, result FROM audit_log
WHERE event_type = 'OTP_VERIFICATION_SUCCESS' ORDER BY timestamp DESC LIMIT 1;
```

**Resultado esperado:** `result = SUCCESS`  
**Estado:** ⏳ Pendiente

---

#### TC-F-030 — TWO_FACTOR_DISABLED registrado tras desactivación
- **US:** US-005 | **Tipo:** Happy Path | **Prioridad:** Alta
- **Precondiciones:** TC-F-019 ejecutado

**Resultado esperado:** Registro con `event_type = TWO_FACTOR_DISABLED`, `result = SUCCESS`  
**Estado:** ⏳ Pendiente

---

### US-006 — Infraestructura TOTP

---

#### TC-F-031 — Contexto Spring se levanta correctamente (smoke)
- **US:** US-006 | **Tipo:** Happy Path | **Prioridad:** Alta

**Pasos:** Ejecutar `ApplicationContextSmokeTest`

**Resultado esperado:** Contexto Spring levanta sin errores; `TotpService` es inyectable

**Estado:** ⏳ Pendiente

---

#### TC-F-032 — Endpoints públicos accesibles sin JWT
- **US:** US-006 | **Tipo:** Happy Path | **Prioridad:** Alta

**Requests:**
```http
POST /auth/login     → debe responder (no 401 por filtro de seguridad)
POST /2fa/verify     → debe responder (no 401 de filtro, puede 401 por token inválido)
```

**Resultado esperado:**
- `/auth/login` no requiere JWT → responde con lógica de negocio (no 401 por security filter)
- `/2fa/verify` no requiere JWT propio → acepta `preAuthToken` en Authorization header

**Estado:** ⏳ Pendiente

---

#### TC-F-033 — AES key no presente en texto plano en código fuente
- **US:** US-006 | **Tipo:** Edge Case | **Prioridad:** Alta

**Pasos:**
1. Buscar en el repositorio: `git grep -r "totp.aes-key" -- "*.java" "*.yml" "*.properties"`
2. Verificar que `application.yml` principal usa `${TOTP_AES_KEY}` (variable de entorno)
3. Verificar que `application-integration.yml` tiene valor de prueba solo en ese perfil

**Resultado esperado:**
- No existe clave AES hardcodeada en archivos Java
- `application.yml` main usa variable de entorno
- Historial git no contiene la clave real

**Estado:** ⏳ Pendiente

---

## NIVEL 3 — Casos de prueba de seguridad (backend)

---

#### TC-SEC-001 — Endpoints protegidos retornan 401 sin token
- **Prioridad:** Alta | **RF relacionado:** RNF-003

**Requests (sin Authorization header):**
```http
POST /2fa/enroll
POST /2fa/enroll/confirm
GET  /2fa/recovery-codes/status
POST /2fa/recovery-codes/generate
DELETE /2fa/disable
```

**Resultado esperado:** HTTP `401 Unauthorized` para cada request  
**Estado:** ⏳ Pendiente

---

#### TC-SEC-002 — Endpoint /auth/login no expone stack traces en errores
- **Prioridad:** Alta | **RNF:** RNF-003, RR-005

**Request:**
```http
POST /auth/login
Content-Type: application/json

{ "username": "", "password": "" }
```

**Resultado esperado:**
- Respuesta de error (400 o 401) con ProblemDetail
- Body **no** contiene `stack`, `trace`, `at com.`, `exception`, clase Java
- Header no expone versión de Spring Boot

**Estado:** ⏳ Pendiente

---

#### TC-SEC-003 — SQL injection en campo username rechazada con 400/401
- **Prioridad:** Alta | **RNF:** RNF-003

**Request:**
```http
POST /auth/login
Content-Type: application/json

{ "username": "' OR '1'='1' --", "password": "test" }
```

**Resultado esperado:**
- HTTP `400 Bad Request` o `401 Unauthorized`
- **No** HTTP `500` (que indicaría error no controlado)
- No se ejecuta la inyección en BD (JPA/Hibernate usa prepared statements)

**Estado:** ⏳ Pendiente

---

#### TC-SEC-004 — Input con caracteres especiales en otpCode rechazado con 400
- **Prioridad:** Alta | **RNF:** RNF-003

**Request:**
```http
POST /2fa/verify
Authorization: Bearer {pre_auth_token}
Content-Type: application/json

{ "otpCode": "<script>alert(1)</script>", "recoveryCode": null }
```

**Resultado esperado:**
- HTTP `400 Bad Request`
- No se procesa el script; no se refleja en respuesta

**Estado:** ⏳ Pendiente

---

#### TC-SEC-005 — Secreto TOTP almacenado cifrado, nunca en texto plano
- **Prioridad:** Alta | **RNF-D01:** AES-256 obligatorio

**Pasos:**
1. Ejecutar TC-F-002 (enrolamiento exitoso)
2. Consultar BD: `SELECT totp_secret_enc FROM users WHERE username = 'test_user'`

**Resultado esperado:**
- `totp_secret_enc` es una cadena Base64 con formato `{iv_base64}:{ciphertext_base64}`
- El valor **no** es el secreto TOTP legible en Base32
- Verificar que el valor cifrado tiene estructura válida AES-256-CBC con IV

**Estado:** ⏳ Pendiente

---

#### TC-SEC-006 — Recovery codes almacenados como hash bcrypt
- **Prioridad:** Alta | **RNF-D02:** bcrypt coste ≥ 10

**Pasos:**
1. Ejecutar TC-F-002 o TC-F-016
2. Consultar BD: `SELECT code_hash FROM recovery_codes WHERE user_id = {id} LIMIT 3`

**Resultado esperado:**
- Cada `code_hash` empieza con `$2a$` o `$2b$` (indicador bcrypt)
- El coste de bcrypt (segundo segmento) es ≥ `10`
- El hash **no** es el código de recuperación en texto plano

**Estado:** ⏳ Pendiente

---

#### TC-SEC-007 — Pre-auth token no reutilizable tras uso exitoso
- **Prioridad:** Alta | **ADR-001**

**Pasos:**
1. Obtener pre-auth token (TC-F-007)
2. Verificar OTP exitosamente — TC-F-008 (consume el token)
3. Intentar reutilizar el mismo pre-auth token

**Request:**
```http
POST /2fa/verify
Authorization: Bearer {pre_auth_token_ya_usado}
Content-Type: application/json

{ "otpCode": "{otp_nuevo_valido}", "recoveryCode": null }
```

**Resultado esperado:** HTTP `401 Unauthorized`  
**Estado:** ⏳ Pendiente

---

#### TC-SEC-008 — Rate limiting activo en /2fa/verify (5 intentos / 10 min)
- **Prioridad:** Alta | **RNF-D03**

Ver TC-F-010 — este TC valida la regla de negocio; la verificación de seguridad confirma que:
- El rate limiter bloquea en el intento 6 con HTTP `429`
- El bloqueo persiste durante 15 minutos (verificar que el intento 7 también devuelve `429`)
- El bloqueo es por usuario, no por IP (mismo user, distinta IP = mismo contador)

**Estado:** ⏳ Pendiente

---

#### TC-SEC-009 — JWT de otro usuario no puede operar sobre recursos de un tercero
- **Prioridad:** Alta | **RNF-003**

**Pasos:**
1. Usuario A hace login y obtiene JWT-A
2. Intentar `/2fa/enroll` con JWT-A donde el endpoint espera recursos del usuario A
3. Verificar que JWT-A no puede acceder a datos del usuario B (si aplicable)

**Resultado esperado:** Cada JWT da acceso solo a los recursos del usuario propietario  
**Estado:** ⏳ Pendiente

---

#### TC-SEC-010 — Datos sensibles no aparecen en logs de aplicación
- **Prioridad:** Alta | **RR-005**

**Pasos:**
1. Activar logs a nivel DEBUG en el perfil de integración
2. Ejecutar flujo completo de enrolamiento (TC-F-001 + TC-F-002)
3. Revisar `stdout` / logs del contenedor

**Resultado esperado:**
- El secreto TOTP **no** aparece en ningún log
- Los recovery codes en texto plano **no** aparecen en logs
- La contraseña del usuario **no** aparece en logs
- El pre-auth token **no** se loguea completo

**Estado:** ⏳ Pendiente

---

#### TC-SEC-011 — OTP ya usado no puede reutilizarse (replay attack)
- **Prioridad:** Alta | **RNF-D04**
- **Nota:** la librería `dev.samstevens.totp` implementa la ventana de tolerancia pero el mismo OTP no debe aceptarse dos veces en el mismo período TOTP

**Pasos:**
1. Obtener un OTP válido
2. Usarlo exitosamente en TC-F-008
3. Dentro del mismo período de 30 s, intentar usarlo nuevamente

**Resultado esperado:** HTTP `401` (OTP ya consumido o inválido en replay)  
**Nota:** Verificar si la implementación actual protege contra replay. Si no → defecto a registrar.

**Estado:** ⏳ Pendiente

---

#### TC-SEC-012 — Bloqueo de cuenta no libera antes del TTL de 15 min
- **Prioridad:** Media | **RNF-D03**

**Pasos:**
1. Ejecutar TC-F-010 (bloquear cuenta)
2. Esperar 1 minuto (mucho menos que 15)
3. Intentar verificación OTP con código válido

**Resultado esperado:** HTTP `429` — bloqueo aún activo  
**Estado:** ⏳ Pendiente

---

#### TC-SEC-013 — Endpoint /2fa/disable requiere JWT, no pre-auth token
- **Prioridad:** Alta

**Request:**
```http
DELETE /2fa/disable
Authorization: Bearer {pre_auth_token}
Content-Type: application/json

{ "password": "Test1234!", "otpCode": "123456" }
```

**Resultado esperado:** HTTP `401 Unauthorized` (pre-auth token no válido para este endpoint)  
**Estado:** ⏳ Pendiente

---

#### TC-SEC-014 — Validación RFC 6238: OTP con drift exactamente ±1 período es aceptado
- **Prioridad:** Media | **RNF-D04:** tolerancia ±1 período (±60 s)

**Pasos:** (requiere mock de SystemTimeProvider o test de integración con offset)
1. Generar OTP para t-30s (período anterior)
2. Verificarlo en el endpoint

**Resultado esperado:** HTTP `200 OK` — OTP del período anterior aceptado por tolerancia  
**Estado:** ⏳ Pendiente

---

#### TC-SEC-015 — OTP con drift > ±1 período es rechazado
- **Prioridad:** Media | **RNF-D04**

**Pasos:**
1. Generar OTP para t-90s (2 períodos atrás)
2. Verificarlo

**Resultado esperado:** HTTP `401` — fuera de ventana de tolerancia  
**Estado:** ⏳ Pendiente

---

## NIVEL 4 — Accesibilidad WCAG 2.1 AA (⏳ BLOQUEADO — pendiente frontend)

> Estos TCs se ejecutan una vez el Dev Frontend implemente los componentes Angular.  
> Herramienta: axe DevTools + verificación manual con teclado.

---

#### TC-ACC-001 — Flujo de enrolamiento completo navegable con teclado
- **US:** US-001 | **Prioridad:** Alta
- **Pasos:** Tab → Enter para cada acción; sin uso de ratón

**Resultado esperado:** Todo el flujo (pantalla QR → input OTP → pantalla recovery codes) completable con teclado  
**Estado:** ⏳ Bloqueado — frontend pendiente

---

#### TC-ACC-002 — Input de OTP tiene label accesible
- **US:** US-002 | **Prioridad:** Alta

**Resultado esperado:** `<label for="otp-input">` o `aria-label` presente y descriptivo  
**Estado:** ⏳ Bloqueado

---

#### TC-ACC-003 — Mensajes de error del OTP accesibles por lectores de pantalla
- **US:** US-002 | **Prioridad:** Alta

**Resultado esperado:** Mensaje de error en elemento con `aria-live="assertive"` o `role="alert"`  
**Estado:** ⏳ Bloqueado

---

#### TC-ACC-004 — Contraste de texto en pantalla de enrolamiento ≥ 4.5:1
- **US:** US-001, US-002 | **Prioridad:** Alta

**Herramienta:** axe DevTools → verificar ratio de contraste en todos los textos  
**Resultado esperado:** Ratio ≥ 4.5:1 para texto normal, ≥ 3:1 para texto grande  
**Estado:** ⏳ Bloqueado

---

#### TC-ACC-005 — Recovery codes pantalla tiene texto alternativo y es copiable sin ratón
- **US:** US-003 | **Prioridad:** Media

**Resultado esperado:** Botón "Copiar" accesible con teclado; texto de códigos seleccionable  
**Estado:** ⏳ Bloqueado

---

#### TC-ACC-006 — Foco visible en todos los elementos interactivos del flujo 2FA
- **Prioridad:** Alta

**Resultado esperado:** Outline de foco visible en cada Tab stop del flujo  
**Estado:** ⏳ Bloqueado

---

#### TC-ACC-007 — Sin parpadeo ni animaciones > 3 flashes/segundo
- **Prioridad:** Media

**Resultado esperado:** Ningún elemento parpadea más de 3 veces por segundo  
**Estado:** ⏳ Bloqueado

---

## NIVEL 5 — Integración (auditoría de tests Testcontainers existentes)

> Dev Backend implementó 32 escenarios E2E con Testcontainers + PostgreSQL 17.  
> La auditoría verifica que los tests cubren lo requerido; **no se reescriben**.

| Test class | Escenarios | Gherkin cubiertos | Estado auditoría |
|---|---|---|---|
| `EnrollmentFlowE2ETest` | 5 | US-001: Scenarios 1-4 + edge | ⏳ Verificar |
| `LoginFlowE2ETest` | 8 | US-002: Scenarios 1-5 + edge | ⏳ Verificar |
| `RecoveryCodesFlowE2ETest` | 6 | US-003: Scenarios 1-4 + edge | ⏳ Verificar |
| `DisableTwoFactorFlowE2ETest` | 6 | US-004: Scenarios 1-4 + edge | ⏳ Verificar |
| `AuditLogE2ETest` | 7 | US-005: todos los event_types | ⏳ Verificar |

**Checklist de auditoría:**
```
□ AbstractIntegrationTest usa @ServiceConnection (no DynamicPropertySource)
□ @BeforeEach cleanDatabase() aísla cada test
□ OtpTestHelper genera OTP compatible con tolerancia=1
□ Todos los tests ejecutan con perfil "integration"
□ Tiempo total de ejecución < 3 minutos (criterio US-007)
□ Instrucción: mvn verify -Pintegration → BUILD SUCCESS
```

---

## NIVEL 6 — E2E Playwright (⏳ BLOQUEADO — pendiente frontend)

> Se ejecutan una vez el Dev Frontend implemente los componentes Angular.

---

#### TC-E2E-001 — Flujo completo de activación 2FA (Angular)
- **Prioridad:** Alta
- **Flujo:** Login → perfil → activar 2FA → escanear QR → ingresar OTP → ver recovery codes
- **Estado:** ⏳ Bloqueado

---

#### TC-E2E-002 — Login con 2FA activo hasta dashboard (Angular)
- **Prioridad:** Alta
- **Flujo:** Login con credenciales → pantalla OTP → ingresar código → redirección a dashboard
- **Estado:** ⏳ Bloqueado

---

#### TC-E2E-003 — Login con código de recuperación como alternativa (Angular)
- **Prioridad:** Alta
- **Estado:** ⏳ Bloqueado

---

#### TC-E2E-004 — Regenerar recovery codes desde perfil (Angular)
- **Prioridad:** Media
- **Estado:** ⏳ Bloqueado

---

#### TC-E2E-005 — Desactivar 2FA desde perfil (Angular)
- **Prioridad:** Media
- **Estado:** ⏳ Bloqueado

---

## Defectos detectados

> _Sin defectos registrados — pruebas pendientes de ejecución_

---

## Métricas de calidad (proyectadas)

| Métrica | Valor actual | Umbral | Estado |
|---|---|---|---|
| TCs alta prioridad diseñados | 48/48 backend | 100% diseñados | ✅ |
| TCs alta prioridad ejecutados | 0/48 | 100% | ⏳ Pendiente |
| Defectos Críticos abiertos | — | 0 | — |
| Defectos Altos abiertos | — | 0 | — |
| Cobertura funcional Gherkin | 28/28 mapeados | ≥ 95% | ✅ (diseño) |
| Seguridad: checks diseñados | 15/15 | 100% | ✅ |
| Accesibilidad WCAG 2.1 AA | Bloqueado | 100% | ⏳ Frontend |
| E2E Playwright | Bloqueado | 3 flujos crit. | ⏳ Frontend |
| Tests Testcontainers (auditoría) | Por auditar | BUILD SUCCESS | ⏳ |

---

## Matriz de Trazabilidad actualizada (RTM)

| US | Gherkin Scenarios | TC Funcional | TC Seguridad | TC Acc. | TC E2E | Cobertura |
|---|---|---|---|---|---|---|
| US-001 | 4 | TC-F-001..006 | TC-SEC-005, SEC-009 | TC-ACC-001, 004 | TC-E2E-001 | ✅ Diseñado |
| US-002 | 5 | TC-F-007..013 | TC-SEC-007..008, 011..015 | TC-ACC-002, 003 | TC-E2E-002, 003 | ✅ Diseñado |
| US-003 | 4 | TC-F-014..018 | TC-SEC-006 | TC-ACC-005 | TC-E2E-004 | ✅ Diseñado |
| US-004 | 4 | TC-F-019..023 | TC-SEC-013 | TC-ACC-006 | TC-E2E-005 | ✅ Diseñado |
| US-005 | 5 | TC-F-024..030 | TC-SEC-010 | — | — | ✅ Diseñado |
| US-006 | 3 | TC-F-031..033 | TC-SEC-001..002 | — | — | ✅ Diseñado |
| RNF-D01..D06 | — | — | TC-SEC-003..015 | TC-ACC-004, 007 | — | ✅ Diseñado |

---

## Exit Criteria — New Feature

```
□ 100% de test cases de alta prioridad ejecutados
□ 0 defectos CRÍTICOS abiertos
□ 0 defectos ALTOS abiertos
□ Cobertura funcional (Gherkin) ≥ 95%
□ Todos los RNF delta verificados
□ Pruebas de seguridad backend pasando (100%)
□ Cobertura JaCoCo backend ≥ 80%
□ Tests Testcontainers: BUILD SUCCESS < 3 min
□ Accesibilidad WCAG 2.1 AA verificada — BLOQUEADO hasta frontend
□ E2E Playwright flujos críticos pasando — BLOQUEADO hasta frontend
□ RTM actualizada con resultados de ejecución
□ Aprobación QA Lead + Product Owner
```

---

## Veredicto QA

### Backend
**⚠️ CONDICIONADO — Test Plan diseñado, ejecución pendiente**

El Test Plan está completo y todos los Gherkin tienen su TC correspondiente.  
Los 48 TCs de backend (funcionales + seguridad) están listos para ejecución.  
**Acción requerida:** ejecutar TCs contra el backend, registrar resultados y defectos.

### Sprint 01 completo
**⏳ NO EJECUTABLE COMPLETAMENTE — frontend pendiente**

Niveles 4 (Accesibilidad) y 6 (E2E Playwright) están bloqueados hasta que  
Dev Frontend entregue los componentes Angular.

---

## Gate: aprobación del Test Plan

> 🔒 **Handoff a Workflow Manager**  
> Artefacto: `docs/qa/FEAT-001-test-plan.md` v1.0  
> Gate requerido: aprobación QA Lead  
> Acción post-aprobación: iniciar ejecución de TCs funcionales y de seguridad (backend)

---

*Generado por SOFIA QA Tester Agent · BankPortal · Sprint 01 · 2026-03-12*
