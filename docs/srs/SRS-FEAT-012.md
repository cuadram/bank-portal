# SRS-FEAT-012 — Software Requirements Specification
# Gestión de Perfil de Usuario — BankPortal / Banco Meridian

## Metadata CMMI (RD SP 1.1 · RD SP 2.1 · RD SP 3.1)

| Campo | Valor |
|---|---|
| Documento | SRS-FEAT-012 |
| Versión | 1.0 |
| Feature | FEAT-012-A — Gestión de Perfil de Usuario |
| Proyecto | BankPortal — Banco Meridian |
| Sprint | 14 |
| Autor | SOFIA Requirements Analyst Agent |
| Fecha | 2026-03-23 |
| Estado | PENDING APPROVAL — Gate 2 |
| Jira Epic | SCRUM-35 |
| Dependencias | FEAT-001 (2FA/JWT), FEAT-008 (BearerToken), DEBT-022 (fix STG) |

---

## 1. Introducción

### 1.1 Propósito

Este documento especifica los requerimientos funcionales y no funcionales de
FEAT-012-A — Gestión de Perfil de Usuario. Define el comportamiento esperado
del sistema BankPortal para que un usuario autenticado pueda consultar y
actualizar sus datos personales, cambiar su contraseña, gestionar las
preferencias de notificaciones y revocar sesiones activas.

### 1.2 Alcance

FEAT-012-A cubre:
- Consulta del perfil personal (nombre, email, teléfono, dirección)
- Actualización de datos personales con validaciones
- Cambio de contraseña (requiere contraseña actual + confirmación)
- Gestión de preferencias de notificación (email, in-app)
- Listado y revocación de sesiones activas del usuario
- Auditoría de cambios en perfil (log inmutable, PCI-DSS)

Quedan fuera de alcance: cambio de email principal (requiere verificación OTP
separada — feature futura), subida de avatar/foto de perfil, cambio de 2FA,
datos financieros del usuario (cuentas, tarjetas).

### 1.3 Contexto de negocio

Banco Meridian exige que los usuarios tengan acceso self-service a sus datos
personales conforme al RGPD (Art. 15 y 16 — derecho de acceso y rectificación).
Adicionalmente, PCI-DSS v4.0 Req. 8.2 exige que cualquier modificación de
credenciales quede registrada en el audit log.

### 1.4 Usuarios afectados

| Actor | Descripción |
|---|---|
| **Usuario autenticado** | Titular de cuenta con sesión JWT activa |
| **Auditor / Compliance** | Consulta read-only del audit log (fuera de scope FEAT-012) |

---

## 2. Requerimientos Funcionales

### 2.1 RF-012-01 — Consulta de perfil

**Descripción:** El usuario autenticado puede consultar su información de perfil
en una vista dedicada `/perfil`.

**Datos mostrados:**
- Nombre completo (nombre + apellidos)
- Email principal (solo lectura — no editable en este scope)
- Número de teléfono
- Dirección (calle, ciudad, código postal, país)
- Fecha de alta en el sistema (solo lectura)
- Estado de 2FA (activo/inactivo, solo lectura — enlace a sección 2FA)

**Precondiciones:** JWT válido y no expirado en Authorization header.
**Postcondiciones:** Datos presentados corresponden al estado actual en BD.

---

### 2.2 RF-012-02 — Actualización de datos personales

**Descripción:** El usuario puede editar teléfono y dirección. El email no es
editable desde este formulario.

**Campos editables:**
- Teléfono (formato internacional E.164, ej. +34612345678)
- Dirección: calle, número, piso, ciudad, código postal, país (ISO 3166-1)

**Validaciones obligatorias:**
- Teléfono: regex E.164 `/^\+[1-9]\d{7,14}$/`
- Código postal: 5 dígitos si país = ES
- Ningún campo admite XSS — sanitización en backend (OWASP A03)
- Campos vacíos permitidos (el usuario puede dejar dirección sin rellenar)

**Auditoría:** Cada actualización genera un registro en `audit_log` con
`event_type=PROFILE_UPDATE`, `user_id`, `changed_fields[]`, `timestamp`, `ip`.

---

### 2.3 RF-012-03 — Cambio de contraseña

**Descripción:** El usuario puede cambiar su contraseña desde el perfil.

**Flujo:**
1. El usuario introduce: contraseña actual, nueva contraseña, confirmación.
2. Backend verifica que `currentPassword` coincide con el hash BCrypt almacenado.
3. Backend valida política de contraseña para `newPassword`.
4. Si válido: rehash BCrypt (strength 12) y persiste.
5. Invalida todas las sesiones activas excepto la actual (seguridad).
6. Devuelve `204 No Content`. Frontend muestra confirmación.

**Política de contraseña:**
- Mínimo 8 caracteres
- Al menos 1 mayúscula, 1 minúscula, 1 dígito, 1 carácter especial
- No puede ser igual a la contraseña actual
- No puede coincidir con ninguna de las 3 últimas contraseñas (historial en BD)

**Auditoría:** `event_type=PASSWORD_CHANGE` en `audit_log`.

---

### 2.4 RF-012-04 — Preferencias de notificación

**Descripción:** El usuario gestiona qué notificaciones desea recibir.

**Preferencias disponibles:**

| Código | Descripción | Canal | Default |
|---|---|---|---|
| `NOTIF_TRANSFER_EMAIL` | Email al realizar transferencia | email | true |
| `NOTIF_TRANSFER_INAPP` | In-app al realizar transferencia | in-app | true |
| `NOTIF_LOGIN_EMAIL` | Email al iniciar sesión desde nuevo dispositivo | email | true |
| `NOTIF_BUDGET_ALERT` | In-app cuando se supera umbral presupuesto | in-app | true |
| `NOTIF_EXPORT_EMAIL` | Email cuando el extracto PDF está listo | email | false |

**Persistencia:** tabla `user_notification_preferences (user_id, preference_code, enabled, updated_at)`.
**Comportamiento:** toggles independientes, PATCH parcial aceptado.

---

### 2.5 RF-012-05 — Sesiones activas y revocación

**Descripción:** El usuario puede ver las sesiones JWT activas y revocar las
que no reconoce.

**Datos por sesión mostrada:**
- Device / User-Agent simplificado (ej. "Chrome en macOS")
- IP de origen (ofuscada: últimos 2 octetos a `***`)
- Fecha/hora de creación de la sesión
- Indicador "sesión actual"

**Revocación:**
- El usuario puede revocar cualquier sesión excepto la actual.
- Backend añade el `jti` (JWT ID) a una tabla `revoked_tokens (jti, revoked_at, user_id)`.
- `JwtDecoder` verifica en cada request que el `jti` no está revocado.
- Las sesiones expiradas (> 24h) no se muestran.

**Nota de implementación:** Requiere que el JWT incluya `jti` (UUID) en el
payload. Si no está presente en los tokens actuales → DEBT-023 a registrar.

---

## 3. Requerimientos No Funcionales (RNF delta FEAT-012)

### RNF baseline (heredados — sin cambio)

| ID | Categoría | Requerimiento |
|---|---|---|
| RNF-001 | Rendimiento | API < 300ms p95 bajo carga nominal |
| RNF-002 | Seguridad | Todos los endpoints protegidos con JWT Bearer |
| RNF-003 | Trazabilidad | Audit log inmutable para todas las operaciones sensibles |
| RNF-006 | Disponibilidad | 99.5% mensual en STG/PROD |

### RNF delta FEAT-012

| ID | Categoría | Requerimiento |
|---|---|---|
| RNF-012-01 | Seguridad | Cambio de contraseña invalida sesiones en < 1s (Redis blacklist o tabla BD) |
| RNF-012-02 | Privacidad | IP en sesiones activas ofuscada — RGPD Art. 25 (privacy by design) |
| RNF-012-03 | Rendimiento | Endpoint `/profile` < 100ms p95 (datos simples, sin joins complejos) |
| RNF-012-04 | Seguridad | BCrypt strength mínimo 12 para nuevas contraseñas |
| RNF-012-05 | Seguridad | Historial últimas 3 contraseñas hasheado en tabla `password_history` |

---

## 4. User Stories

### US-1201 — Ver mi perfil personal

**Como** usuario autenticado,
**quiero** ver todos mis datos personales en una sección de perfil,
**para** verificar que la información que el banco tiene sobre mí es correcta.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Consulta de perfil de usuario

  Scenario: Usuario autenticado consulta su perfil
    Given el usuario "a.delacuadra@nemtec.es" está autenticado con JWT válido
    When realiza GET /api/v1/profile
    Then recibe 200 OK
    And el body contiene "fullName", "phone", "address", "twoFactorEnabled"
    And el campo "email" está presente pero no es editable en el response

  Scenario: Usuario con JWT expirado intenta consultar perfil
    Given el usuario tiene un JWT expirado
    When realiza GET /api/v1/profile
    Then recibe 401 Unauthorized
    And el body contiene "error": "TOKEN_EXPIRED"

  Scenario: Usuario no autenticado intenta acceder al perfil
    Given no hay Authorization header en la petición
    When realiza GET /api/v1/profile
    Then recibe 401 Unauthorized
```

**SP:** 2 | **Prioridad:** Must Have

---

### US-1202 — Actualizar mis datos personales

**Como** usuario autenticado,
**quiero** poder editar mi teléfono y dirección,
**para** mantener mis datos de contacto actualizados.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Actualización de datos personales

  Scenario: Usuario actualiza teléfono con formato válido
    Given el usuario está autenticado
    When realiza PATCH /api/v1/profile con body {"phone": "+34612345678"}
    Then recibe 200 OK
    And el perfil refleja el nuevo teléfono
    And se registra un evento PROFILE_UPDATE en audit_log

  Scenario: Usuario envía teléfono con formato inválido
    Given el usuario está autenticado
    When realiza PATCH /api/v1/profile con body {"phone": "612345678"}
    Then recibe 400 Bad Request
    And el body contiene "field": "phone", "error": "INVALID_FORMAT"
    And no se registra ningún evento en audit_log

  Scenario: Usuario actualiza dirección completa
    Given el usuario está autenticado
    When realiza PATCH /api/v1/profile con body de dirección válida (ES)
    Then recibe 200 OK
    And audit_log contiene "changed_fields": ["address"]

  Scenario: Usuario intenta actualizar campo email (no permitido)
    Given el usuario está autenticado
    When realiza PATCH /api/v1/profile con body {"email": "nuevo@test.es"}
    Then recibe 400 Bad Request
    And el body contiene "error": "FIELD_NOT_UPDATABLE"
```

**SP:** 3 | **Prioridad:** Must Have

---

### US-1203 — Cambiar mi contraseña

**Como** usuario autenticado,
**quiero** poder cambiar mi contraseña desde el perfil,
**para** mantener la seguridad de mi cuenta.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Cambio de contraseña

  Scenario: Usuario cambia contraseña con datos válidos
    Given el usuario está autenticado y conoce su contraseña actual
    When realiza POST /api/v1/profile/password con currentPassword, newPassword y confirmPassword válidos
    Then recibe 204 No Content
    And el hash BCrypt nuevo está almacenado en BD
    And todas las sesiones excepto la actual quedan invalidadas
    And se registra PASSWORD_CHANGE en audit_log

  Scenario: Usuario introduce contraseña actual incorrecta
    Given el usuario está autenticado
    When realiza POST /api/v1/profile/password con currentPassword incorrecta
    Then recibe 400 Bad Request
    And el body contiene "error": "CURRENT_PASSWORD_INCORRECT"
    And no se modifica nada en BD

  Scenario: Nueva contraseña no cumple política
    Given el usuario está autenticado
    When realiza POST /api/v1/profile/password con newPassword = "password1"
    Then recibe 400 Bad Request
    And el body contiene "error": "PASSWORD_POLICY_VIOLATION"
    And "violations" lista los criterios no cumplidos

  Scenario: Nueva contraseña igual a la actual
    Given el usuario está autenticado
    When realiza POST /api/v1/profile/password con newPassword igual a la actual
    Then recibe 400 Bad Request
    And el body contiene "error": "PASSWORD_SAME_AS_CURRENT"

  Scenario: Nueva contraseña coincide con una de las 3 anteriores
    Given el usuario tiene historial de contraseñas
    When realiza POST /api/v1/profile/password con una contraseña de los últimos 3 cambios
    Then recibe 400 Bad Request
    And el body contiene "error": "PASSWORD_IN_HISTORY"
```

**SP:** 3 | **Prioridad:** Must Have

---

### US-1204 — Gestionar preferencias de notificación

**Como** usuario autenticado,
**quiero** controlar qué notificaciones recibo y por qué canal,
**para** recibir solo los avisos que me interesan.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Preferencias de notificación

  Scenario: Usuario consulta sus preferencias actuales
    Given el usuario está autenticado
    When realiza GET /api/v1/profile/notifications
    Then recibe 200 OK con los 5 códigos de preferencia y su estado (enabled/disabled)

  Scenario: Usuario desactiva notificación de transferencia por email
    Given el usuario está autenticado
    When realiza PATCH /api/v1/profile/notifications con {"NOTIF_TRANSFER_EMAIL": false}
    Then recibe 200 OK
    And la preferencia queda almacenada como disabled

  Scenario: Usuario activa notificación de extracto por email
    Given la preferencia NOTIF_EXPORT_EMAIL está desactivada
    When realiza PATCH /api/v1/profile/notifications con {"NOTIF_EXPORT_EMAIL": true}
    Then recibe 200 OK
    And la preferencia queda almacenada como enabled

  Scenario: Usuario envía código de preferencia desconocido
    When realiza PATCH /api/v1/profile/notifications con {"NOTIF_UNKNOWN_CODE": true}
    Then recibe 400 Bad Request
    And el body contiene "error": "UNKNOWN_PREFERENCE_CODE"
```

**SP:** 2 | **Prioridad:** Should Have

---

### US-1205 — Ver y revocar sesiones activas

**Como** usuario autenticado,
**quiero** ver qué sesiones están activas en mi cuenta y poder cerrarlas,
**para** protegerme si detecto acceso no autorizado.

**Criterios de aceptación (Gherkin):**

```gherkin
Feature: Gestión de sesiones activas

  Scenario: Usuario consulta sus sesiones activas
    Given el usuario tiene 2 sesiones activas (actual + otra)
    When realiza GET /api/v1/profile/sessions
    Then recibe 200 OK con lista de 2 sesiones
    And una de ellas tiene "current": true
    And las IPs aparecen ofuscadas (últimos 2 octetos como ***)

  Scenario: Usuario revoca una sesión no actual
    Given el usuario tiene una sesión no-actual con jti "abc-123"
    When realiza DELETE /api/v1/profile/sessions/abc-123
    Then recibe 204 No Content
    And el jti "abc-123" está en la tabla revoked_tokens
    And cualquier request con ese token recibe 401

  Scenario: Usuario intenta revocar su propia sesión actual
    Given el usuario intenta revocar su sesión actual
    When realiza DELETE /api/v1/profile/sessions/{jti_actual}
    Then recibe 400 Bad Request
    And el body contiene "error": "CANNOT_REVOKE_CURRENT_SESSION"

  Scenario: Usuario intenta revocar sesión de otro usuario
    Given jti "xyz-456" pertenece a otro usuario
    When realiza DELETE /api/v1/profile/sessions/xyz-456
    Then recibe 404 Not Found
```

**SP:** 3 | **Prioridad:** Should Have

---

## 5. Resumen de Story Points

| US | Descripción | SP | Prioridad |
|---|---|---|---|
| US-1201 | Ver perfil personal | 2 | Must Have |
| US-1202 | Actualizar datos personales | 3 | Must Have |
| US-1203 | Cambiar contraseña | 3 | Must Have |
| US-1204 | Preferencias de notificación | 2 | Should Have |
| US-1205 | Sesiones activas y revocación | 3 | Should Have |
| | **TOTAL** | **13** | |

---

## 6. Nuevas entidades de BD (delta FEAT-012)

| Tabla | Propósito | Migración |
|---|---|---|
| `user_profiles` | Datos personales ampliados (phone, address) — puede ser extensión de `users` | Flyway V14 |
| `user_notification_preferences` | Preferencias por usuario y código | Flyway V14 |
| `password_history` | Últimas 3 contraseñas hasheadas por usuario | Flyway V14 |
| `revoked_tokens` | JTIs revocados antes de expiración | Flyway V14 |

---

## 7. Nuevos endpoints API (delta FEAT-012)

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| GET | `/api/v1/profile` | JWT | Obtener perfil completo |
| PATCH | `/api/v1/profile` | JWT | Actualizar teléfono/dirección |
| POST | `/api/v1/profile/password` | JWT | Cambiar contraseña |
| GET | `/api/v1/profile/notifications` | JWT | Listar preferencias |
| PATCH | `/api/v1/profile/notifications` | JWT | Actualizar preferencias |
| GET | `/api/v1/profile/sessions` | JWT | Listar sesiones activas |
| DELETE | `/api/v1/profile/sessions/{jti}` | JWT | Revocar sesión |

---

## 8. RTM — Requirements Traceability Matrix

| US | RF | RNF | Gherkin Scenarios | Jira |
|---|---|---|---|---|
| US-1201 | RF-012-01 | RNF-002, RNF-012-03 | 3 | pendiente Gate 2 |
| US-1202 | RF-012-02 | RNF-001, RNF-003, RNF-012-02 | 4 | pendiente Gate 2 |
| US-1203 | RF-012-03 | RNF-003, RNF-012-01, RNF-012-04, RNF-012-05 | 5 | pendiente Gate 2 |
| US-1204 | RF-012-04 | RNF-001 | 4 | pendiente Gate 2 |
| US-1205 | RF-012-05 | RNF-002, RNF-012-02 | 4 | pendiente Gate 2 |
| | | | **20 escenarios Gherkin total** | |

---

## 9. Riesgo técnico identificado — DEBT-023

**Durante el análisis de US-1205 se detecta una deuda técnica nueva:**

Los JWTs actuales generados por `JwtService` (HMAC HS256) **no incluyen `jti`**
(JWT ID) en el payload. Sin `jti`, la revocación de sesiones individuales no es
posible de forma precisa.

**Impacto:** US-1205 queda bloqueada sin `jti`.
**Resolución propuesta:** DEBT-023 — Añadir `jti` (UUID v4) al generar el JWT.
Tamaño estimado: 1 SP. Incluir en Semana 1 Sprint 14 junto con DEBT-022.

---

*SOFIA Requirements Analyst Agent — Step 2 Gate 2 pending*
*CMMI Level 3 — RD SP 1.1 · RD SP 2.1 · RD SP 3.1*
*BankPortal Sprint 14 — FEAT-012-A — 2026-03-23*
