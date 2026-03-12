# Test Plan — Autenticación de Doble Factor (2FA)

> **Artefacto:** Test Plan (TP)
> **Proceso CMMI:** VER — Verification · VAL — Validation
> **Generado por:** SOFIA — QA Tester Agent
> **Fecha:** 2026-03-12
> **Versión:** 1.0 | **Estado:** DRAFT
> **Referencia SRS:** FEAT-001-srs.md v1.0 (APROBADO)
> **Referencia HLD:** FEAT-001-hld.md v1.0
> **Referencia LLD:** FEAT-001-lld-backend.md v1.0

---

## 1. Metadata

| Campo                | Valor                                                        |
|----------------------|--------------------------------------------------------------|
| Feature ID           | FEAT-001                                                     |
| Proyecto             | BankPortal                                                   |
| Cliente              | Banco Meridian                                               |
| Sprint               | Sprint 01 (2026-03-11 → 2026-03-25)                         |
| QA Lead              | SOFIA QA Tester Agent                                        |
| Stack bajo prueba    | Java 21 / Spring Boot 3.x · Angular 17+ · PostgreSQL 17     |
| Rama git             | `feature/FEAT-001-autenticacion-2fa`                         |
| Normativa aplicable  | PCI-DSS 4.0 req. 8.4 · ISO 27001 A.9.4                      |
| Versión Test Plan    | 1.0                                                          |
| Estado               | DRAFT — pendiente revisión QA Lead + aprobación Tech Lead    |

---

## 2. Alcance de las pruebas

### 2.1 En scope

| Área                            | Descripción                                                     |
|---------------------------------|-----------------------------------------------------------------|
| Enrolamiento 2FA (US-001)       | Generación QR, validación primer OTP, activación en BD          |
| Login con 2FA activo (US-002)   | Pre-auth token, verificación OTP, bloqueo por intentos          |
| Recovery codes (US-003)         | Generación, uso único, regeneración, invalidación previa        |
| Desactivación 2FA (US-004)      | Doble confirmación password+OTP, limpieza de BD                 |
| Auditoría de eventos (US-005)   | Los 7 event_types, inmutabilidad, REQUIRES_NEW                  |
| Infraestructura TOTP (US-006)   | Smoke tests contexto Spring, cifrado AES-256, variables de entorno |
| Tests E2E automatizados (US-007)| Validar suite Testcontainers, cobertura JaCoCo                  |
| RNF de seguridad                | RNF-D01 (AES-256), RNF-D02 (bcrypt), RNF-D03 (rate limit), RNF-D04 (ventana TOTP) |
| RNF de rendimiento              | RNF-D05 (p95 < 300 ms en /2fa/verify), RNF-001 (p95 < 200 ms resto) |
| Gestión de errores              | GlobalExceptionHandler RFC 9457, códigos HTTP correctos         |

### 2.2 Fuera de scope (excluido explícitamente por SRS)

- 2FA por SMS o biometría (FIDO2/WebAuthn)
- Panel de administración para consulta de audit_log
- Gestión de dispositivos de confianza
- Notificaciones push/email al activar/desactivar 2FA
- Tests Cypress E2E Angular (no disponibles hasta Dev Frontend)

---

## 3. Estrategia de prueba

```
PIRÁMIDE DE TESTING — FEAT-001
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         ▲  Exploratorio / Seguridad  ◄── QA manual + OWASP
        ▲▲  Funcional API (Postman)   ◄── QA colección REST
       ▲▲▲  E2E Testcontainers        ◄── US-007 (32 escenarios ✅)
      ▲▲▲▲  Integración SpringBoot    ◄── smoke + slices
    ▲▲▲▲▲▲  Unitarios (Mockito)       ◄── 50+ casos existentes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Niveles de prueba en FEAT-001

| Nivel                | Herramienta                   | Responsable      | Cobertura objetivo |
|----------------------|-------------------------------|------------------|--------------------|
| Unitario             | JUnit 5 + Mockito             | Dev Backend ✅   | ≥ 80% (JaCoCo)     |
| Integración E2E      | Testcontainers + PostgreSQL   | Dev Backend ✅   | 32 escenarios      |
| Funcional API        | Postman Collection            | QA Tester        | 100% endpoints     |
| No Funcional         | k6 / JMeter                   | QA Tester        | RNF-D05, RNF-001   |
| Seguridad            | Manual + OWASP checklist      | QA Tester        | OWASP Top 10 API   |
| Exploratorio         | Manual sesiones estructuradas | QA Tester        | Flujos críticos    |

### Tipos de prueba

| Tipo                     | Incluido | Notas                                         |
|--------------------------|----------|-----------------------------------------------|
| Funcional positivo       | ✅       | Happy path de todos los CA Gherkin            |
| Funcional negativo       | ✅       | Todos los escenarios de error del SRS         |
| Límites (boundary)       | ✅       | Ventana TOTP ±30s, rate limit 5/10min         |
| Seguridad                | ✅       | Inyección, bypass, exposición de secretos     |
| Rendimiento              | ✅       | p95 en /2fa/verify y /auth/login              |
| Regresión                | ✅       | Login sin 2FA no debe verse afectado          |
| Inmutabilidad audit_log  | ✅       | Intento de UPDATE/DELETE directo              |

---

## 4. Entorno de prueba

### 4.1 Entorno backend (disponible)

| Componente       | Versión / Configuración                                   |
|------------------|-----------------------------------------------------------|
| JDK              | Java 21 (OpenJDK Temurin)                                 |
| Spring Boot      | 3.3.4                                                     |
| PostgreSQL       | 17-alpine (via Testcontainers en tests automáticos)       |
| Flyway           | Migraciones V1-V4 aplicadas al arrancar                   |
| Perfil activo    | `integration` (application-integration.yml)              |
| Puerto           | Aleatorio (`server.port=0`) — sin conflictos paralelos    |
| Auth             | JWT HS256, Pre-auth JWT HS256, TTL configurables          |

### 4.2 Variables de entorno — valores de test

| Variable               | Valor de test                                     |
|------------------------|---------------------------------------------------|
| `TOTP_AES_KEY`         | `MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=`  |
| `JWT_SECRET`           | Cadena ≥ 256 bits — definida en `application-integration.yml` |
| `PRE_AUTH_TOKEN_SECRET`| Cadena ≥ 256 bits — definida en `application-integration.yml` |
| `RATE_LIMIT_CAPACITY`  | `5`                                               |
| `RATE_LIMIT_WINDOW_MINUTES` | `10`                                        |
| `RATE_LIMIT_BLOCK_MINUTES`  | `15`                                        |

### 4.3 Usuario de test estándar

| Campo      | Valor               |
|------------|---------------------|
| `username` | `test_user`         |
| `email`    | `test@bankmeridian.test` |
| `password` | `Test1234!`         |
| `2FA`      | Controlado por fixture |

---

## 5. Criterios de entrada y salida

### 5.1 Criterios de entrada (MUST antes de ejecutar QA)

- [x] US-001 a US-007 commiteadas en `feature/FEAT-001-autenticacion-2fa`
- [x] Suite unitaria (50+ tests) en verde
- [x] Suite E2E Testcontainers (32 tests) compilada y en verde
- [x] SecurityConfig bugfix aplicado (`/auth/login`, `/2fa/verify` sin prefijo `/api/v1`)
- [ ] Colección Postman importada y variables de entorno configuradas
- [ ] Entorno de test levantado (docker available para Testcontainers)

### 5.2 Criterios de salida (MUST antes de Sprint Review)

- [ ] 100% de casos de prueba funcionales ejecutados
- [ ] 0 defectos críticos (P1) abiertos
- [ ] 0 defectos altos (P2) abiertos (o con acuerdo explícito del PO para defer)
- [ ] Cobertura JaCoCo ≥ 80% en backend (líneas y ramas)
- [ ] RNF-D05 verificado: p95 < 300 ms en `/2fa/verify`
- [ ] Los 7 event_types de audit_log verificados manualmente
- [ ] Inmutabilidad de `audit_log` verificada
- [ ] Informe de defectos actualizado en `docs/qa/defect-report-FEAT-001.md`

---

## 6. Casos de prueba funcionales

> **Convención de IDs:**
> `TC-[US]-[ÁREA]-[NÚMERO]`
> Resultado esperado: `PASS` | `FAIL` | `BLOCKED`
> Prioridad: `P1-Crítico` | `P2-Alto` | `P3-Medio` | `P4-Bajo`

---

### 6.1 US-001 — Enrolamiento 2FA

#### TC-001-ENROLL-001
**Título:** Enrolamiento exitoso — generación de QR y secreto TOTP
**Prioridad:** P1
**Precondiciones:** Usuario autenticado con JWT completo. 2FA desactivado.
**Pasos:**
1. `POST /2fa/enroll` con `Authorization: Bearer <jwt_completo>`
**Resultado esperado:**
- HTTP 200
- Body contiene `secret` (string Base32 no vacío)
- Body contiene `qrDataUri` que comienza con `data:image/png;base64,`
- El QR decodificado contiene `issuer=BankMeridian` y el email del usuario
- El secreto NO se almacena en texto plano en BD (verificar `totp_secret_enc` cifrado ≠ secreto)
**Trazabilidad:** RF-001, CA US-001 Scenario 1

#### TC-001-ENROLL-002
**Título:** Confirmación de enrolamiento con OTP válido
**Prioridad:** P1
**Precondiciones:** TC-001-ENROLL-001 ejecutado. Secreto TOTP obtenido.
**Pasos:**
1. Generar OTP válido desde el secreto (librería TOTP)
2. `POST /2fa/enroll/confirm` con `{"otpCode": "<otp_valido>"}`
**Resultado esperado:**
- HTTP 200
- Body contiene `recoveryCodes` (lista de exactamente 10 elementos)
- Cada código tiene formato `XXXX-XXXX` (sin caracteres ambiguos: sin 0,1,O,I,L)
- BD: `two_factor_enabled = true` para el usuario
- BD: `two_factor_enrolled_at` NOT NULL con timestamp reciente
- BD: 10 filas en `recovery_codes` para el usuario, `used = false`
- BD: registro en `audit_log` con `event_type = 'TWO_FACTOR_ENROLLED'`, `result = 'SUCCESS'`
**Trazabilidad:** RF-001, RF-002, CA US-001 Scenario 2

#### TC-001-ENROLL-003
**Título:** Rechazo de OTP inválido en confirmación de enrolamiento
**Prioridad:** P1
**Precondiciones:** TC-001-ENROLL-001 ejecutado.
**Pasos:**
1. `POST /2fa/enroll/confirm` con `{"otpCode": "000000"}` (OTP deliberadamente incorrecto)
**Resultado esperado:**
- HTTP 422 (Unprocessable Entity)
- Body RFC 9457: campo `type` o `title` indicando error OTP inválido
- BD: `two_factor_enabled` permanece `false`
- BD: `totp_secret_enc` no modificado (secreto temporal puede existir)
- NO se generan recovery codes
**Trazabilidad:** RF-002, CA US-001 Scenario 3

#### TC-001-ENROLL-004
**Título:** Rechazo de enrolamiento cuando 2FA ya está activo
**Prioridad:** P2
**Precondiciones:** Usuario con 2FA ya activo (TC-001-ENROLL-002 ejecutado previamente).
**Pasos:**
1. `POST /2fa/enroll` con JWT válido
**Resultado esperado:**
- HTTP 409 (Conflict)
- Body RFC 9457 indicando `TwoFactorAlreadyEnabledException`
- NO se genera nuevo secreto TOTP
- Estado en BD no se modifica
**Trazabilidad:** RF-001, CA US-001 Scenario 4

#### TC-001-ENROLL-005
**Título:** Enrolamiento rechazado sin autenticación JWT
**Prioridad:** P1
**Precondiciones:** Ninguna.
**Pasos:**
1. `POST /2fa/enroll` SIN cabecera `Authorization`
**Resultado esperado:**
- HTTP 401 (Unauthorized)
- Sin acceso al recurso
**Trazabilidad:** RNF-003, RR-001

#### TC-001-ENROLL-006
**Título:** Secreto TOTP cifrado — verificación de no exposición
**Prioridad:** P1 (seguridad)
**Precondiciones:** TC-001-ENROLL-001 ejecutado.
**Pasos:**
1. Consultar directamente BD: `SELECT totp_secret_enc FROM users WHERE username = 'test_user'`
2. Verificar que el valor en BD es diferente al `secret` retornado por la API
3. Verificar que el valor tiene formato de ciphertext AES (contiene `:` como separador iv:ciphertext en Base64)
**Resultado esperado:**
- `totp_secret_enc` en BD ≠ `secret` en respuesta API
- `totp_secret_enc` tiene formato `<base64_iv>:<base64_ciphertext>`
- El secreto nunca aparece en ningún log del servidor
**Trazabilidad:** RNF-D01, RR-005

---

### 6.2 US-002 — Verificación OTP en flujo de login

#### TC-002-LOGIN-001
**Título:** Login sin 2FA — retorna JWT completo directamente
**Prioridad:** P1 (regresión)
**Precondiciones:** Usuario existente con 2FA desactivado.
**Pasos:**
1. `POST /auth/login` con `{"username": "test_user", "password": "Test1234!"}`
**Resultado esperado:**
- HTTP 200
- `requiresTwoFactor: false`
- `accessToken` presente y no vacío (JWT válido)
- `preAuthToken: null`
**Trazabilidad:** RF-003, CA US-002 — flujo sin 2FA (regresión)

#### TC-002-LOGIN-002
**Título:** Login con 2FA activo — retorna pre-auth token, sin JWT completo
**Prioridad:** P1
**Precondiciones:** Usuario con 2FA activo.
**Pasos:**
1. `POST /auth/login` con credenciales correctas
**Resultado esperado:**
- HTTP 200
- `requiresTwoFactor: true`
- `preAuthToken` presente y no vacío (JWT de vida corta)
- `accessToken: null`
**Trazabilidad:** RF-003, CA US-002 Scenario 1

#### TC-002-LOGIN-003
**Título:** Login con contraseña incorrecta
**Prioridad:** P1
**Precondiciones:** Usuario existente.
**Pasos:**
1. `POST /auth/login` con `{"username": "test_user", "password": "Incorrecta999"}`
**Resultado esperado:**
- HTTP 422
- Sin tokens en la respuesta
**Trazabilidad:** RF-003

#### TC-002-LOGIN-004
**Título:** Login con usuario inexistente
**Prioridad:** P2
**Precondiciones:** Ninguna.
**Pasos:**
1. `POST /auth/login` con `{"username": "nadie", "password": "cualquiera"}`
**Resultado esperado:**
- HTTP 404
**Trazabilidad:** RF-003

#### TC-002-VERIFY-001
**Título:** Verificación OTP válido — emisión de JWT completo
**Prioridad:** P1
**Precondiciones:** Usuario con 2FA activo. Pre-auth token obtenido via login.
**Pasos:**
1. Generar OTP válido desde secreto TOTP
2. `POST /2fa/verify` con `Authorization: Bearer <pre_auth_token>` y `{"otpCode": "<otp_valido>"}`
**Resultado esperado:**
- HTTP 200
- `accessToken` presente y no vacío (JWT de sesión completa)
- BD: registro en `audit_log` con `event_type = 'OTP_VERIFICATION_SUCCESS'`, `result = 'SUCCESS'`
**Trazabilidad:** RF-004, CA US-002 Scenario 2

#### TC-002-VERIFY-002
**Título:** Verificación OTP inválido — incrementa contador de intentos
**Prioridad:** P1
**Precondiciones:** Pre-auth token válido.
**Pasos:**
1. `POST /2fa/verify` con OTP `"000000"` (incorrecto)
**Resultado esperado:**
- HTTP 422
- Sin `accessToken` en respuesta
- BD: registro en `audit_log` con `event_type = 'OTP_VERIFICATION_FAILED'`, `result = 'FAILURE'`
**Trazabilidad:** RF-004, RF-005, CA US-002 Scenario fallo

#### TC-002-VERIFY-003
**Título:** Bloqueo de cuenta tras 5 intentos OTP fallidos en < 10 minutos
**Prioridad:** P1
**Precondiciones:** Pre-auth token válido. Bucket limpio (usuario sin intentos previos).
**Pasos:**
1. Realizar 5 llamadas consecutivas a `POST /2fa/verify` con OTP `"000000"`
**Resultado esperado:**
- Intentos 1-4: HTTP 422
- Intento 5: HTTP 429 (Too Many Requests) — bucket agotado
- BD: registro en `audit_log` con `event_type = 'ACCOUNT_BLOCKED'` o el 5º `OTP_VERIFICATION_FAILED`
- En los 15 minutos siguientes, nuevos intentos también retornan 429
**Trazabilidad:** RF-005, RNF-D03, CA US-002 Scenario 4

#### TC-002-VERIFY-004
**Título:** Pre-auth token expirado (TTL = 5 min)
**Prioridad:** P2
**Precondiciones:** Pre-auth token emitido hace más de 5 minutos (o forjado con exp pasado).
**Pasos:**
1. `POST /2fa/verify` con pre-auth token expirado y OTP correcto
**Resultado esperado:**
- HTTP 401 (Unauthorized)
- Mensaje indicando token expirado
**Trazabilidad:** RF-003, ADR-001

#### TC-002-VERIFY-005
**Título:** Uso de recovery code como alternativa al OTP en login
**Prioridad:** P1
**Precondiciones:** Pre-auth token válido. Recovery codes generados y disponibles.
**Pasos:**
1. `POST /2fa/verify` con `Authorization: Bearer <pre_auth_token>` y `{"recoveryCode": "<codigo_valido>"}`
**Resultado esperado:**
- HTTP 200
- `accessToken` presente y no vacío
- BD: recovery code marcado como `used = true`
- BD: `audit_log` con `event_type = 'LOGIN_RECOVERY_CODE'`, `result = 'SUCCESS'`
**Trazabilidad:** RF-007, CA US-002 Scenario 5

#### TC-002-VERIFY-006
**Título:** Recovery code ya usado — rechazo de reutilización
**Prioridad:** P1
**Precondiciones:** Recovery code ya usado en TC-002-VERIFY-005.
**Pasos:**
1. `POST /2fa/verify` con el mismo recovery code ya consumido
**Resultado esperado:**
- HTTP 422
- Sin acceso
- BD: el código permanece `used = true`, sin cambios
**Trazabilidad:** RF-007, CA US-003 Scenario 2

---

### 6.3 US-003 — Gestión de Recovery Codes

#### TC-003-REC-001
**Título:** Status de recovery codes tras enrolamiento — 10 disponibles
**Prioridad:** P2
**Precondiciones:** Usuario con 2FA activo (10 recovery codes generados).
**Pasos:**
1. `GET /2fa/recovery-codes/status` con JWT completo
**Resultado esperado:**
- HTTP 200
- `available: 10`
- `total: 10`
- `lowWarning: false`
**Trazabilidad:** RF-006, CA US-003 Scenario 1

#### TC-003-REC-002
**Título:** Status con códigos disponibles en alerta baja (< 3)
**Prioridad:** P2
**Precondiciones:** Usuario con exactamente 2 recovery codes disponibles (8 usados).
**Pasos:**
1. Consumir 8 recovery codes via logins alternos (o modificar directamente BD en test)
2. `GET /2fa/recovery-codes/status`
**Resultado esperado:**
- HTTP 200
- `available: 2`
- `lowWarning: true`
**Trazabilidad:** RF-006

#### TC-003-REC-003
**Título:** Status sin 2FA activo — retorna 400
**Prioridad:** P2
**Precondiciones:** Usuario sin 2FA activo.
**Pasos:**
1. `GET /2fa/recovery-codes/status` con JWT del usuario sin 2FA
**Resultado esperado:**
- HTTP 400 (Bad Request)
**Trazabilidad:** RF-006

#### TC-003-REC-004
**Título:** Regeneración de recovery codes con OTP válido
**Prioridad:** P1
**Precondiciones:** Usuario con 2FA activo. Secreto TOTP conocido.
**Pasos:**
1. Registrar los 10 códigos actuales
2. `POST /2fa/recovery-codes/generate` con `{"otpCode": "<otp_valido>"}`
**Resultado esperado:**
- HTTP 200
- Retorna 10 nuevos códigos en `recoveryCodes`
- `codesRemaining: 10`
- Los nuevos códigos son **distintos** a los anteriores (entropía SecureRandom)
- BD: los 10 códigos anteriores ya no existen (eliminados, no marcados como used)
- BD: 10 nuevos códigos con `used = false`
- BD: `audit_log` con `event_type = 'RECOVERY_CODES_REGENERATED'`, `result = 'SUCCESS'`
**Trazabilidad:** RF-008, CA US-003 Scenario 3

#### TC-003-REC-005
**Título:** Regeneración rechazada con OTP incorrecto
**Prioridad:** P1
**Precondiciones:** Usuario con 2FA activo.
**Pasos:**
1. `POST /2fa/recovery-codes/generate` con `{"otpCode": "000000"}`
**Resultado esperado:**
- HTTP 422
- Los códigos anteriores permanecen sin cambios en BD
**Trazabilidad:** RF-008, CA US-003 Scenario 4

#### TC-003-REC-006
**Título:** Formato de recovery codes — XXXX-XXXX sin caracteres ambiguos
**Prioridad:** P1 (seguridad / usabilidad)
**Precondiciones:** TC-001-ENROLL-002 ejecutado. 10 códigos en mano.
**Pasos:**
1. Inspeccionar los 10 códigos retornados por `/2fa/enroll/confirm`
**Resultado esperado:**
- Todos los códigos cumplen regex `[A-Z2-9]{4}-[A-Z2-9]{4}`
- Ningún código contiene los caracteres `0`, `1`, `O`, `I`, `L` (ambiguos visualmente)
- Ningún código se repite dentro del set de 10
**Trazabilidad:** RF-006, RNF-D02

---

### 6.4 US-004 — Desactivación de 2FA

#### TC-004-DISABLE-001
**Título:** Desactivación exitosa con password y OTP válidos
**Prioridad:** P1
**Precondiciones:** Usuario con 2FA activo.
**Pasos:**
1. `DELETE /2fa/disable` con body `{"password": "Test1234!", "otpCode": "<otp_valido>"}` y JWT
**Resultado esperado:**
- HTTP 200
- `twoFactorEnabled: false` en respuesta
- BD: `two_factor_enabled = false`
- BD: `totp_secret_enc = null`
- BD: `two_factor_enrolled_at = null`
- BD: tabla `recovery_codes` sin filas para este usuario
- BD: `audit_log` con `event_type = 'TWO_FACTOR_DISABLED'`, `result = 'SUCCESS'`
**Trazabilidad:** RF-009, CA US-004 Scenario 1

#### TC-004-DISABLE-002
**Título:** Login tras desactivación retorna JWT directo (sin paso 2FA)
**Prioridad:** P1 (regresión crítica)
**Precondiciones:** TC-004-DISABLE-001 ejecutado.
**Pasos:**
1. `POST /auth/login` con credenciales correctas del usuario que desactivó 2FA
**Resultado esperado:**
- HTTP 200
- `requiresTwoFactor: false`
- `accessToken` presente (JWT completo directo)
- `preAuthToken: null`
**Trazabilidad:** RF-003, RF-009, CA US-004 Scenario 1

#### TC-004-DISABLE-003
**Título:** Desactivación rechazada con contraseña incorrecta
**Prioridad:** P1
**Precondiciones:** Usuario con 2FA activo.
**Pasos:**
1. `DELETE /2fa/disable` con `{"password": "Incorrecta", "otpCode": "<otp_valido>"}`
**Resultado esperado:**
- HTTP 422
- 2FA permanece activo en BD
- Secreto TOTP y recovery codes sin cambios
**Trazabilidad:** RF-009, CA US-004 Scenario 2

#### TC-004-DISABLE-004
**Título:** Desactivación rechazada con OTP incorrecto
**Prioridad:** P1
**Precondiciones:** Usuario con 2FA activo.
**Pasos:**
1. `DELETE /2fa/disable` con `{"password": "Test1234!", "otpCode": "000000"}`
**Resultado esperado:**
- HTTP 422
- 2FA permanece activo en BD
**Trazabilidad:** RF-009, CA US-004 Scenario 3

#### TC-004-DISABLE-005
**Título:** Desactivación rechazada — el usuario no tiene 2FA activo
**Prioridad:** P2
**Precondiciones:** Usuario sin 2FA.
**Pasos:**
1. `DELETE /2fa/disable` con credenciales válidas
**Resultado esperado:**
- HTTP 400 (Bad Request) — `TwoFactorNotEnabledException`
**Trazabilidad:** RF-009, CA US-004 Scenario 4

#### TC-004-DISABLE-006
**Título:** Orden de validación — password se valida ANTES que OTP
**Prioridad:** P2 (seguridad)
**Precondiciones:** Usuario con 2FA activo.
**Pasos:**
1. `DELETE /2fa/disable` con password incorrecta + OTP correcto
**Resultado esperado:**
- HTTP 422 (InvalidPasswordException — sin revelar qué campo falló)
- El OTP NO es evaluado si el password falla primero
- Mensaje de error genérico (no revela si fue password u OTP)
**Trazabilidad:** RF-009, ADR diseño defensivo

---

### 6.5 US-005 — Auditoría de eventos

#### TC-005-AUDIT-001
**Título:** Registro TWO_FACTOR_ENROLLED tras enrolamiento completo
**Prioridad:** P1
**Pasos:** Ejecutar TC-001-ENROLL-002, luego consultar `audit_log`
**Resultado esperado:**
- Existe 1 fila con `event_type = 'TWO_FACTOR_ENROLLED'`, `result = 'SUCCESS'`, `user_id` correcto, `ip_address` no null
**Trazabilidad:** RF-010, CA US-005 Scenario 1

#### TC-005-AUDIT-002
**Título:** Registro OTP_VERIFICATION_SUCCESS tras verificación exitosa
**Prioridad:** P1
**Pasos:** Ejecutar TC-002-VERIFY-001, consultar `audit_log`
**Resultado esperado:**
- Existe fila con `event_type = 'OTP_VERIFICATION_SUCCESS'`, `result = 'SUCCESS'`
**Trazabilidad:** RF-010

#### TC-005-AUDIT-003
**Título:** Registro OTP_VERIFICATION_FAILED tras OTP incorrecto
**Prioridad:** P1
**Pasos:** Ejecutar TC-002-VERIFY-002, consultar `audit_log`
**Resultado esperado:**
- Existe fila con `event_type = 'OTP_VERIFICATION_FAILED'`, `result = 'FAILURE'`
**Trazabilidad:** RF-010, CA US-005 Scenario 2

#### TC-005-AUDIT-004
**Título:** Registro ACCOUNT_BLOCKED tras 5 fallos consecutivos
**Prioridad:** P1
**Pasos:** Ejecutar TC-002-VERIFY-003, consultar `audit_log`
**Resultado esperado:**
- Existe fila con `event_type = 'ACCOUNT_BLOCKED'` o el 5º `OTP_VERIFICATION_FAILED`
**Trazabilidad:** RF-010, CA US-005 Scenario 3

#### TC-005-AUDIT-005
**Título:** Registro TWO_FACTOR_DISABLED tras desactivar 2FA
**Prioridad:** P1
**Pasos:** Ejecutar TC-004-DISABLE-001, consultar `audit_log`
**Resultado esperado:**
- Existe fila con `event_type = 'TWO_FACTOR_DISABLED'`, `result = 'SUCCESS'`
**Trazabilidad:** RF-010

#### TC-005-AUDIT-006
**Título:** Registro RECOVERY_CODES_REGENERATED tras regenerar códigos
**Prioridad:** P1
**Pasos:** Ejecutar TC-003-REC-004, consultar `audit_log`
**Resultado esperado:**
- Existe fila con `event_type = 'RECOVERY_CODES_REGENERATED'`, `result = 'SUCCESS'`
**Trazabilidad:** RF-010

#### TC-005-AUDIT-007
**Título:** Registro LOGIN_RECOVERY_CODE al usar recovery code
**Prioridad:** P1
**Pasos:** Ejecutar TC-002-VERIFY-005, consultar `audit_log`
**Resultado esperado:**
- Existe fila con `event_type = 'LOGIN_RECOVERY_CODE'`, `result = 'SUCCESS'`
**Trazabilidad:** RF-010, CA US-005

#### TC-005-AUDIT-008
**Título:** Inmutabilidad — audit_log no puede actualizarse via API
**Prioridad:** P1 (PCI-DSS req. 10.7)
**Precondiciones:** Al menos 1 registro en `audit_log`.
**Pasos:**
1. Intentar actualizar un registro via cualquier endpoint expuesto
2. Verificar que no existe ningún endpoint `PUT /audit-log/*` ni `DELETE /audit-log/*`
**Resultado esperado:**
- No existe endpoint de modificación ni borrado de audit_log
- Intentar UPDATE directo en BD: la entidad `@Immutable` de Hibernate rechaza o ignora la operación
**Trazabilidad:** RF-010, CA US-005 Scenario 4, RR-008

#### TC-005-AUDIT-009
**Título:** Audit log persiste aunque la transacción principal haga rollback
**Prioridad:** P1 (REQUIRES_NEW — ADR-003)
**Precondiciones:** Usuario con 2FA activo.
**Pasos:**
1. Intentar verificación OTP con código incorrecto (fuerza rollback de la tx principal)
2. Consultar `audit_log`
**Resultado esperado:**
- El registro `OTP_VERIFICATION_FAILED` existe en `audit_log`
- El registro fue persistido con `Propagation.REQUIRES_NEW` — independiente del rollback principal
**Trazabilidad:** RF-010, ADR-003

---

### 6.6 US-006 — Infraestructura TOTP

#### TC-006-INFRA-001
**Título:** Contexto Spring arranca correctamente (smoke test)
**Prioridad:** P1
**Pasos:** Ejecutar `ApplicationContextSmokeTest`
**Resultado esperado:**
- Contexto Spring carga sin errores
- Todos los beans requeridos son inyectados correctamente
**Trazabilidad:** CA US-006 Scenario 1

#### TC-006-INFRA-002
**Título:** Clave AES no hardcodeada en código fuente ni en git history
**Prioridad:** P1 (seguridad)
**Pasos:**
1. `git log --all -p | grep -i "aes\|totp_aes\|MDEy"` — buscar en historial git
2. Revisar `application.yml` y `application-integration.yml` — la clave debe estar como `${TOTP_AES_KEY}` o valor de test no productivo
**Resultado esperado:**
- La clave AES de producción NO aparece en ningún commit del historial
- Solo aparece el valor de test en `application-integration.yml` (aceptable)
**Trazabilidad:** RNF-D01, RR-005, CA US-006 Scenario 3

---

### 6.7 Pruebas de error HTTP y contratos de respuesta

#### TC-GLOBAL-001
**Título:** Formato de error RFC 9457 (ProblemDetail) en todos los errores
**Prioridad:** P2
**Pasos:** Provocar cada tipo de error (422, 400, 401, 404, 409, 429) y verificar body
**Resultado esperado:**
- Body tiene campos `type`, `title`, `status`, `detail` (RFC 9457 ProblemDetail)
- `status` coincide con HTTP status code
- Sin stack trace expuesto en ningún mensaje de error
**Trazabilidad:** RNF, SRS §8 RR-001 (OWASP)

#### TC-GLOBAL-002
**Título:** Endpoint /2fa/verify sin pre-auth token en Authorization
**Prioridad:** P1
**Pasos:** `POST /2fa/verify` sin cabecera `Authorization` ni cuerpo vacío
**Resultado esperado:** HTTP 401
**Trazabilidad:** ADR-001, RNF-003

---

## 7. Pruebas no funcionales

### 7.1 Pruebas de rendimiento

#### TC-PERF-001
**Título:** p95 < 300 ms en `POST /2fa/verify` bajo carga
**Herramienta:** k6 o JMeter
**Configuración:**
- VUs (usuarios virtuales): 50 concurrentes
- Duración: 2 minutos
- Endpoint: `POST /2fa/verify` con OTP válido
**Resultado esperado:**
- p95 < 300 ms (RNF-D05)
- p99 < 500 ms
- 0 errores HTTP 5xx
**Trazabilidad:** RNF-D05

#### TC-PERF-002
**Título:** p95 < 200 ms en `POST /auth/login` bajo carga
**Herramienta:** k6 o JMeter
**Configuración:**
- VUs: 100 concurrentes
- Duración: 2 minutos
**Resultado esperado:**
- p95 < 200 ms (RNF-001)
**Trazabilidad:** RNF-001

### 7.2 Pruebas de seguridad

#### TC-SEC-001
**Título:** Secreto TOTP nunca aparece en texto plano en logs del servidor
**Pasos:**
1. Ejecutar flujo de enrolamiento completo
2. Revisar logs del servidor: `grep -i "secret\|totp" server.log`
**Resultado esperado:**
- El secreto TOTP Base32 nunca aparece en ningún archivo de log
**Trazabilidad:** RNF-D01, OWASP A02 Cryptographic Failures

#### TC-SEC-002
**Título:** Hash bcrypt en recovery_codes — verificación directa en BD
**Pasos:**
1. Obtener un recovery code de texto plano (post-enrolamiento)
2. Consultar BD: `SELECT code_hash FROM recovery_codes WHERE user_id = ?`
3. Verificar que `code_hash` empieza con `$2a$` o `$2b$` (formato bcrypt)
4. Verificar que el código de texto plano ≠ `code_hash`
**Resultado esperado:**
- `code_hash` es un hash bcrypt (prefijo `$2a$` o `$2b$`)
- El código en texto plano no está almacenado en ninguna columna
**Trazabilidad:** RNF-D02, RR-006

#### TC-SEC-003
**Título:** Rate limiting — sin bypass con pre-auth tokens diferentes para el mismo userId
**Prioridad:** P1
**Pasos:**
1. Obtener un pre-auth token vía login
2. Consumir 4 intentos con OTP inválido
3. Obtener un NUEVO pre-auth token vía login (mismo usuario)
4. Intentar el 5º intento con el nuevo pre-auth token
**Resultado esperado:**
- El 5º intento retorna 429 (el rate limit es por `userId` extraído del token, no por token)
- No es posible reiniciar el contador obteniendo un nuevo pre-auth token
**Trazabilidad:** RNF-D03, ADR-002

#### TC-SEC-004
**Título:** JWT de sesión completa con claim `two_factor_verified` correcto
**Prioridad:** P2
**Pasos:**
1. Completar flujo de verificación OTP exitoso
2. Decodificar el JWT retornado (sin verificar firma)
3. Inspeccionar claims
**Resultado esperado:**
- El JWT contiene el claim `sub` (userId)
- El JWT no contiene el secreto TOTP ni datos sensibles
**Trazabilidad:** RNF-003, ADR-001

#### TC-SEC-005
**Título:** Pre-auth token no es aceptado como JWT de sesión completa
**Prioridad:** P1 (seguridad crítica)
**Pasos:**
1. Obtener un `preAuthToken` vía `POST /auth/login`
2. Usar ese `preAuthToken` como `Authorization: Bearer` en `GET /2fa/recovery-codes/status`
**Resultado esperado:**
- HTTP 401 (Unauthorized)
- El pre-auth token no otorga acceso a endpoints protegidos que requieren JWT completo
**Trazabilidad:** ADR-001, RNF-003

---

## 8. Pruebas de regresión — login sin 2FA

> Esta sección es crítica: el HLD documenta que los cambios en `POST /auth/login`
> son retrocompatibles. Los usuarios sin 2FA deben continuar funcionando exactamente igual.

| ID               | Descripción                                     | Resultado esperado                      |
|------------------|-------------------------------------------------|-----------------------------------------|
| TC-REG-001       | Login sin 2FA retorna JWT completo              | HTTP 200, `accessToken` presente        |
| TC-REG-002       | JWT completo es aceptado en endpoints protegidos | HTTP 200 en `GET /2fa/recovery-codes/status` |
| TC-REG-003       | La respuesta de login NO tiene `preAuthToken`   | `preAuthToken: null` cuando sin 2FA     |
| TC-REG-004       | La respuesta de login tiene `requiresTwoFactor: false` | Campo presente y en `false`        |

---

## 9. Matriz de trazabilidad RTM

| Caso de prueba       | RF vinculados  | RNF/RR vinculados     | US     | Prioridad | Estado    |
|----------------------|----------------|-----------------------|--------|-----------|-----------|
| TC-001-ENROLL-001    | RF-001         | RNF-D01               | US-001 | P1        | PENDIENTE |
| TC-001-ENROLL-002    | RF-001, RF-002 | RNF-D01, RNF-D02      | US-001 | P1        | PENDIENTE |
| TC-001-ENROLL-003    | RF-002         | —                     | US-001 | P1        | PENDIENTE |
| TC-001-ENROLL-004    | RF-001         | —                     | US-001 | P2        | PENDIENTE |
| TC-001-ENROLL-005    | —              | RNF-003, RR-001       | US-001 | P1        | PENDIENTE |
| TC-001-ENROLL-006    | —              | RNF-D01, RR-005       | US-001 | P1        | PENDIENTE |
| TC-002-LOGIN-001     | RF-003         | —                     | US-002 | P1        | PENDIENTE |
| TC-002-LOGIN-002     | RF-003         | —                     | US-002 | P1        | PENDIENTE |
| TC-002-LOGIN-003     | RF-003         | —                     | US-002 | P1        | PENDIENTE |
| TC-002-LOGIN-004     | RF-003         | —                     | US-002 | P2        | PENDIENTE |
| TC-002-VERIFY-001    | RF-004         | RNF-D05               | US-002 | P1        | PENDIENTE |
| TC-002-VERIFY-002    | RF-004, RF-005 | RNF-D03               | US-002 | P1        | PENDIENTE |
| TC-002-VERIFY-003    | RF-005         | RNF-D03, RR-001       | US-002 | P1        | PENDIENTE |
| TC-002-VERIFY-004    | RF-003         | —                     | US-002 | P2        | PENDIENTE |
| TC-002-VERIFY-005    | RF-007         | —                     | US-002 | P1        | PENDIENTE |
| TC-002-VERIFY-006    | RF-007         | —                     | US-002 | P1        | PENDIENTE |
| TC-003-REC-001       | RF-006         | —                     | US-003 | P2        | PENDIENTE |
| TC-003-REC-002       | RF-006         | —                     | US-003 | P2        | PENDIENTE |
| TC-003-REC-003       | RF-006         | —                     | US-003 | P2        | PENDIENTE |
| TC-003-REC-004       | RF-008         | —                     | US-003 | P1        | PENDIENTE |
| TC-003-REC-005       | RF-008         | —                     | US-003 | P1        | PENDIENTE |
| TC-003-REC-006       | RF-006         | RNF-D02               | US-003 | P1        | PENDIENTE |
| TC-004-DISABLE-001   | RF-009         | RNF-D01, RNF-D02      | US-004 | P1        | PENDIENTE |
| TC-004-DISABLE-002   | RF-003, RF-009 | —                     | US-004 | P1        | PENDIENTE |
| TC-004-DISABLE-003   | RF-009         | —                     | US-004 | P1        | PENDIENTE |
| TC-004-DISABLE-004   | RF-009         | —                     | US-004 | P1        | PENDIENTE |
| TC-004-DISABLE-005   | RF-009         | —                     | US-004 | P2        | PENDIENTE |
| TC-004-DISABLE-006   | RF-009         | —                     | US-004 | P2        | PENDIENTE |
| TC-005-AUDIT-001     | RF-010         | RR-008                | US-005 | P1        | PENDIENTE |
| TC-005-AUDIT-002     | RF-010         | RR-008                | US-005 | P1        | PENDIENTE |
| TC-005-AUDIT-003     | RF-010         | RR-008                | US-005 | P1        | PENDIENTE |
| TC-005-AUDIT-004     | RF-010         | RR-008                | US-005 | P1        | PENDIENTE |
| TC-005-AUDIT-005     | RF-010         | RR-008                | US-005 | P1        | PENDIENTE |
| TC-005-AUDIT-006     | RF-010         | RR-008                | US-005 | P1        | PENDIENTE |
| TC-005-AUDIT-007     | RF-010         | RR-008                | US-005 | P1        | PENDIENTE |
| TC-005-AUDIT-008     | RF-010         | RR-008, RR-001        | US-005 | P1        | PENDIENTE |
| TC-005-AUDIT-009     | RF-010         | ADR-003               | US-005 | P1        | PENDIENTE |
| TC-006-INFRA-001     | RF-001         | —                     | US-006 | P1        | PENDIENTE |
| TC-006-INFRA-002     | —              | RNF-D01, RR-005       | US-006 | P1        | PENDIENTE |
| TC-GLOBAL-001        | —              | RNF (OWASP)           | Todos  | P2        | PENDIENTE |
| TC-GLOBAL-002        | —              | RNF-003, ADR-001      | US-002 | P1        | PENDIENTE |
| TC-PERF-001          | —              | RNF-D05               | US-007 | P2        | PENDIENTE |
| TC-PERF-002          | —              | RNF-001               | US-007 | P2        | PENDIENTE |
| TC-SEC-001           | —              | RNF-D01, OWASP A02    | US-001 | P1        | PENDIENTE |
| TC-SEC-002           | —              | RNF-D02, RR-006       | US-003 | P1        | PENDIENTE |
| TC-SEC-003           | —              | RNF-D03, ADR-002      | US-002 | P1        | PENDIENTE |
| TC-SEC-004           | —              | RNF-003, ADR-001      | US-002 | P2        | PENDIENTE |
| TC-SEC-005           | —              | RNF-003, ADR-001      | US-002 | P1        | PENDIENTE |
| TC-REG-001 a 004     | RF-003         | —                     | US-002 | P1        | PENDIENTE |

**Total casos de prueba: 52**
**P1 (Crítico): 37 | P2 (Alto): 15**

---

## 10. Resumen de cobertura por RF

| RF      | Descripción                           | TCs que lo cubren                                   | Cubierto |
|---------|---------------------------------------|-----------------------------------------------------|----------|
| RF-001  | Generación secreto TOTP + QR          | TC-001-ENROLL-001, TC-001-ENROLL-006                | ✅       |
| RF-002  | Activación 2FA con OTP                | TC-001-ENROLL-002, TC-001-ENROLL-003                | ✅       |
| RF-003  | Pre-auth token en login con 2FA       | TC-002-LOGIN-001..004, TC-002-VERIFY-004, TC-REG-*  | ✅       |
| RF-004  | Verificación OTP — emisión JWT        | TC-002-VERIFY-001, TC-002-VERIFY-002                | ✅       |
| RF-005  | Bloqueo por 5 intentos fallidos       | TC-002-VERIFY-003, TC-005-AUDIT-004                 | ✅       |
| RF-006  | Generación 10 recovery codes          | TC-003-REC-001..003, TC-003-REC-006                 | ✅       |
| RF-007  | Uso de recovery code en login         | TC-002-VERIFY-005, TC-002-VERIFY-006                | ✅       |
| RF-008  | Regeneración recovery codes           | TC-003-REC-004, TC-003-REC-005                      | ✅       |
| RF-009  | Desactivación 2FA                     | TC-004-DISABLE-001..006                             | ✅       |
| RF-010  | Audit log inmutable — 7 event_types   | TC-005-AUDIT-001..009                               | ✅       |

---

## 11. Riesgos de calidad identificados

| ID     | Riesgo                                                          | Probabilidad | Impacto | Mitigación                                               |
|--------|-----------------------------------------------------------------|-------------|---------|----------------------------------------------------------|
| RQ-001 | Drift de reloj entre servidor y app autenticadora              | Media        | Alto    | Verificar `tolerance=1` configurado; TC-001-ENROLL-002 con OTP real |
| RQ-002 | Rate limiter in-process pierde estado al reiniciar el servidor  | Alta         | Medio   | Documentado en ADR-002 como trade-off conocido (DEBT-001) |
| RQ-003 | BCrypt cost=12 puede causar latencia alta en `/2fa/verify`     | Baja         | Medio   | TC-PERF-001 mide p95; BCrypt solo en disable/generate (no en verify) |
| RQ-004 | OTP válido puede ser reutilizado dentro de la misma ventana    | Media        | Alto    | Verificar que el backend invalida OTPs ya usados (tolerancia TOTP) |
| RQ-005 | Recovery codes expuestos en respuesta HTTP en tráfico no TLS   | Baja         | Crítico | Verificar TLS 1.3 obligatorio (RNF-004); TC-SEC-001 revisa logs |
| RQ-006 | SecurityConfig con paths incorrectos bloquea endpoints públicos | Baja (ya corregido) | Crítico | Bugfix aplicado en `874c206`; verificar en TC-002-LOGIN-001 |
| RQ-007 | Audit log no persiste en escenario de rollback de tx principal | Baja         | Alto    | TC-005-AUDIT-009 lo cubre; ADR-003 REQUIRES_NEW |

---

## 12. Defectos conocidos y deuda técnica

| ID       | Descripción                                            | Severidad | Estado     | Referencia |
|----------|--------------------------------------------------------|-----------|------------|------------|
| DEBT-001 | RateLimiterService in-process → debe migrar a Bucket4j+Redis para multi-réplica | Medio | ABIERTO (deferred) | ADR-002 |
| BUG-001  | SecurityConfig tenía paths `/api/v1/auth/login` y `/api/v1/2fa/verify` incorrectos | Crítico | CERRADO | commit `874c206` |

---

## 13. Trazabilidad CMMI Nivel 3

| Área de proceso CMMI | Evidencia en este artefacto                                          |
|----------------------|----------------------------------------------------------------------|
| VER — Verification   | 52 TCs con pasos, resultados esperados y trazabilidad a RF/RNF       |
| VAL — Validation     | TCs derivados 1:1 de criterios de aceptación Gherkin del SRS         |
| REQM — Req. Mgmt     | RTM completa: RF → TC, RNF → TC, US → TC                            |
| RSKM — Risk Mgmt     | 7 riesgos de calidad con probabilidad, impacto y mitigación          |
| CM — Config. Mgmt    | Artefacto versionado v1.0, en git rama feature, con fecha y estado   |
| MA — Measurement     | Métricas definidas: 52 TCs, 37 P1, 15 P2, cobertura JaCoCo ≥ 80%   |

---

## 14. Próximos pasos

1. **[QA]** Revisar y aprobar este Test Plan con Tech Lead
2. **[QA]** Crear colección Postman con todos los TCs de este plan
3. **[QA]** Ejecutar TCs P1 contra el backend (rama `feature/FEAT-001-autenticacion-2fa`)
4. **[QA]** Registrar resultados en `docs/qa/test-execution-report-FEAT-001.md`
5. **[QA]** Abrir defectos en `docs/qa/defect-report-FEAT-001.md` por cada FAIL
6. **[Dev]** Corregir defectos P1 antes del Sprint Review
7. **[QA]** Ejecutar TCs Cypress E2E Angular cuando Dev Frontend complete US-001

---

*Generado por SOFIA QA Tester Agent · BankPortal · Sprint 01 · 2026-03-12*
*Basado en: FEAT-001-srs.md v1.0 (APROBADO) · FEAT-001-hld.md v1.0 · FEAT-001-lld-backend.md v1.0*
