# SRS — Software Requirements Specification
## FEAT-019 — Centro de Privacidad y Perfil de Usuario
**Proyecto:** BankPortal — Banco Meridian  
**Versión:** 1.0 | **Sprint:** 21 | **Release:** v1.21.0  
**SOFIA:** v2.3 | **Step:** 2 — Requirements Analyst  
**Fecha:** 2026-03-31 | **Autor:** SOFIA Requirements Agent  
**Estado:** APROBADO — Gate G-2 pendiente

---

## 1. Propósito y alcance

Este documento especifica los requerimientos funcionales y no funcionales de FEAT-019, que introduce el **Centro de Privacidad y Perfil** en BankPortal. La feature cierra el gap regulatorio GDPR (Art.7, 12, 15, 16, 17, 20) pendiente desde FEAT-012 (S14) y resuelve DEBT-039 (ProfileController sin implementar).

### 1.1 Contexto regulatorio

| Regulación | Artículo | Obligación |
|---|---|---|
| GDPR | Art.7 | Gestión granular de consentimientos con registro de cambios |
| GDPR | Art.12 §3 | Respuesta a solicitudes de derechos en máx. 30 días |
| GDPR | Art.15 | Derecho de acceso — portabilidad de datos personales |
| GDPR | Art.16 | Derecho de rectificación de datos personales |
| GDPR | Art.17 | Derecho al olvido — supresión de datos |
| GDPR | Art.20 | Portabilidad — formato estructurado y legible por máquina |
| PSD2 | SCA | Operaciones sensibles requieren autenticación fuerte |
| PCI-DSS | Req.8 | Control de acceso e identidad |

### 1.2 Módulos afectados

- **Nuevos:** `profile`, `privacy` (frontend + backend)
- **Ampliados:** `audit` (gdpr_requests log), `export` (data-export GDPR)
- **Integración:** `session` (FEAT-002), `notification` (FEAT-014), `kyc` (FEAT-013), `auth` (FEAT-001)

---

## 2. Actores del sistema

| Actor | Descripción |
|---|---|
| **Cliente** | Usuario autenticado de BankPortal — titular de los datos |
| **Administrador** | Operador interno de Banco Meridian con rol ADMIN |
| **CoreBanking** | Sistema externo — receptor de webhook de baja lógica |
| **Sistema GDPR** | Proceso interno asíncrono de generación/supresión de datos |

---

## 3. Requerimientos Funcionales

### RF-019-01 — Consulta de perfil de usuario
**Prioridad:** Alta | **Story:** SCRUM-106 | **SP:** 4

**Descripción:** El sistema debe exponer el perfil completo del usuario autenticado.

**Precondición:** Usuario con sesión JWT válida. KYC aprobado (FEAT-013).

**Flujo principal:**
1. Cliente accede a sección "Mi Perfil"
2. Sistema llama GET /api/v1/profile con JWT del usuario
3. ProfileService recupera datos del cliente (nombre, email, teléfono, dirección)
4. Sistema retorna perfil con campos editables marcados
5. Email se muestra como solo lectura (no modificable desde app)

**Flujo alternativo — KYC pendiente:**
- Todos los campos se muestran en modo solo lectura
- Banner informativo: "Verifica tu identidad para editar tu perfil"

**Criterios de aceptación (Gherkin):**

```gherkin
Scenario: Consulta de perfil exitosa
  Given el usuario está autenticado con JWT válido
  And el usuario tiene KYC aprobado
  When accede a GET /api/v1/profile
  Then recibe 200 OK con nombre, teléfono, dirección, email (readonly)
  And el tiempo de respuesta es < 1s

Scenario: Consulta con KYC pendiente
  Given el usuario está autenticado
  And el usuario tiene KYC en estado PENDING o REJECTED
  When accede a GET /api/v1/profile
  Then recibe 200 OK con todos los campos en modo readonly
  And el response incluye campo "editable": false
```

---

### RF-019-02 — Actualización de datos personales
**Prioridad:** Alta | **Story:** SCRUM-106 | **SP:** incluido en RF-019-01

**Descripción:** El cliente puede actualizar nombre, teléfono y dirección postal.

**Reglas de negocio:**
- **RN-F019-01:** El email no puede modificarse desde BankPortal (hereda RN-F012-01)
- **RN-F019-02:** El cambio de teléfono requiere verificación OTP antes de persistir
- **RN-F019-03:** Si KYC está PENDING o REJECTED, solo lectura — no se acepta PATCH
- **RN-F019-04:** Los cambios se registran en audit_log con timestamp + IP

```gherkin
Scenario: Actualización de nombre exitosa
  Given el usuario tiene KYC aprobado
  When envía PATCH /api/v1/profile con {"nombre": "Juan García López"}
  Then recibe 200 OK con perfil actualizado
  And el cambio queda registrado en audit_log

Scenario: Intento de cambiar teléfono sin OTP
  When envía PATCH /api/v1/profile con {"telefono": "+34612345678"}
  Then recibe 422 con mensaje "Cambio de teléfono requiere verificación OTP"
  And se envía OTP al teléfono actual para confirmación

Scenario: Intento de modificar email
  When envía PATCH /api/v1/profile con {"email": "nuevo@email.com"}
  Then recibe 400 con mensaje "El email no puede modificarse desde la aplicación"
```

---

### RF-019-03 — Gestión de sesiones activas
**Prioridad:** Alta | **Story:** SCRUM-107 | **SP:** 3

**Descripción:** El cliente puede consultar sus sesiones activas y cerrarlas remotamente.

**Reglas de negocio:**
- **RN-F019-05:** Las IPs se muestran enmascaradas (hereda RN-F002-01)
- **RN-F019-06:** El cierre remoto es inmediato — JWT añadido a Redis blacklist
- **RN-F019-07:** No se puede cerrar la sesión actual (protección anti-lockout)
- **RN-F019-08:** Máximo 5 sesiones simultáneas (hereda RN-F003-04)

```gherkin
Scenario: Consulta de sesiones activas
  Given el usuario tiene 3 sesiones abiertas
  When accede a GET /api/v1/profile/sessions
  Then recibe lista con dispositivo, IP enmascarada, último acceso, flag "es_actual"

Scenario: Cierre remoto de sesión
  Given existe sesión S2 que no es la actual
  When envía DELETE /api/v1/profile/sessions/{s2-id}
  Then recibe 204 No Content
  And el JWT de S2 queda en Redis blacklist inmediatamente

Scenario: Intento de cerrar sesión actual
  When envía DELETE /api/v1/profile/sessions/{id-sesion-actual}
  Then recibe 409 con mensaje "No puedes cerrar tu sesión activa desde este endpoint"
```

---

### RF-019-04 — Gestión de consentimientos GDPR
**Prioridad:** Alta | **Story:** SCRUM-108 | **SP:** 4

**Descripción:** El cliente puede consultar y actualizar sus consentimientos GDPR con historial inmutable.

**Tipos de consentimiento:**
| Tipo | Desactivable | Descripción |
|---|---|---|
| `MARKETING` | Sí | Comunicaciones comerciales y promocionales |
| `ANALYTICS` | Sí | Análisis de comportamiento de uso (anonimizado) |
| `COMMUNICATIONS` | Sí | Comunicaciones informativas no obligatorias |
| `SECURITY` | **No** | Alertas de seguridad críticas (RN-F004-06) |

**Reglas de negocio:**
- **RN-F019-09:** Cada cambio de consentimiento genera entrada en `consent_history` (inmutable)
- **RN-F019-10:** El consentimiento `SECURITY` no puede desactivarse bajo ninguna circunstancia
- **RN-F019-11:** Los cambios de consentimiento son compatibles con preferencias de notificación (FEAT-014)

```gherkin
Scenario: Desactivar consentimiento de marketing
  When envía PATCH /api/v1/privacy/consents con {"MARKETING": false}
  Then recibe 200 OK con estado actualizado
  And se crea entrada en consent_history con valor_anterior=true, valor_nuevo=false, timestamp, IP

Scenario: Intento de desactivar consentimiento de seguridad
  When envía PATCH /api/v1/privacy/consents con {"SECURITY": false}
  Then recibe 422 con mensaje "Las alertas de seguridad no pueden desactivarse"
  And el estado de SECURITY permanece true
```

---

### RF-019-05 — Portabilidad de datos personales (JSON)
**Prioridad:** Media | **Story:** SCRUM-109 | **SP:** 3

**Descripción:** El cliente puede solicitar la descarga de todos sus datos personales en formato JSON firmado.

**Contenido del JSON exportado:**
- Datos de perfil (nombre, email, teléfono, dirección, fecha de alta)
- Historial completo de consentimientos (consent_history)
- Lista de sesiones de los últimos 12 meses
- Audit log de exportaciones propias (export_audit_log — FEAT-018)
- Historial de solicitudes GDPR

**Reglas de negocio:**
- **RN-F019-12:** Solo puede haber un data-export activo (PENDING/IN_PROGRESS) por usuario
- **RN-F019-13:** Generación asíncrona — SLA máximo 24 horas
- **RN-F019-14:** Enlace de descarga firmado con TTL de 48 horas
- **RN-F019-15:** El JSON incluye hash SHA-256 del contenido (integridad)
- **RN-F019-16:** Notificación push al usuario cuando el fichero está listo (NotificationService)

```gherkin
Scenario: Solicitud de data-export exitosa
  Given no existe data-export activo para el usuario
  When envía POST /api/v1/privacy/data-export
  Then recibe 202 Accepted con request_id y estimated_completion
  And se crea registro en gdpr_requests con tipo=EXPORT, estado=PENDING
  And se envía notificación push cuando el fichero está listo (máx 24h)

Scenario: Intento de doble solicitud
  Given existe data-export con estado PENDING
  When envía POST /api/v1/privacy/data-export
  Then recibe 409 con mensaje "Ya tienes una solicitud de exportación activa"
```

---

### RF-019-06 — Derecho al olvido (supresión de cuenta)
**Prioridad:** Media | **Story:** SCRUM-110 | **SP:** 3

**Descripción:** El cliente puede solicitar la eliminación de su cuenta y datos personales.

**Flujo de supresión:**
1. Cliente inicia solicitud — requiere OTP 2FA obligatorio
2. Sistema envía email de confirmación con enlace único (TTL 24h)
3. Cliente confirma desde email
4. Cuenta suspendida inmediatamente (estado: DELETION_PENDING)
5. Datos anonimizados según política GDPR: nombre → "USUARIO ELIMINADO", email → SHA-256
6. Webhook a CoreBanking (best-effort — si falla → DEBT S22)
7. SLA 30 días para completar supresión total

**Reglas de negocio:**
- **RN-F019-17:** La supresión requiere OTP 2FA obligatorio (operación irreversible)
- **RN-F019-18:** El enlace de confirmación por email es de único uso con TTL 24h
- **RN-F019-19:** Una cuenta DELETION_PENDING no puede realizar ninguna operación
- **RN-F019-20:** Los registros de auditoría GDPR se conservan 6 años (Art.17§3.b) incluso tras supresión
- **RN-F019-21:** Las transferencias programadas activas (FEAT-015) deben cancelarse antes de completar supresión

```gherkin
Scenario: Solicitud de supresión con 2FA
  Given el usuario está autenticado
  When envía POST /api/v1/privacy/deletion-request con OTP válido
  Then recibe 202 Accepted
  And se envía email de confirmación con enlace único
  And se crea registro en gdpr_requests con tipo=DELETION, estado=PENDING

Scenario: Confirmación desde email
  Given existe solicitud DELETION con estado PENDING
  When el usuario accede al enlace de confirmación del email
  Then la cuenta cambia a estado DELETION_PENDING
  And el usuario recibe confirmación de que la cuenta está suspendida
  And se dispara webhook a CoreBanking
```

---

### RF-019-07 — Log de derechos GDPR (admin)
**Prioridad:** Media | **Story:** SCRUM-111 | **SP:** 3

**Descripción:** Panel administrativo para monitorizar todas las solicitudes GDPR y su SLA.

**Reglas de negocio:**
- **RN-F019-22:** Solo usuarios con rol ADMIN pueden acceder a GET /api/v1/admin/gdpr-requests
- **RN-F019-23:** Alerta automática si una solicitud supera 25 días sin resolución
- **RN-F019-24:** Retención del log: 6 años (GDPR Art.17§3.b)
- **RN-F019-25:** Los estados válidos son: PENDING → IN_PROGRESS → COMPLETED | REJECTED

```gherkin
Scenario: Consulta admin del log GDPR
  Given el usuario tiene rol ADMIN
  When accede a GET /api/v1/admin/gdpr-requests
  Then recibe lista paginada de solicitudes con tipo, estado, fecha, SLA restante

Scenario: Acceso no autorizado al log GDPR
  Given el usuario tiene rol USER
  When accede a GET /api/v1/admin/gdpr-requests
  Then recibe 403 Forbidden
```

---

## 4. Requerimientos No Funcionales

### RNF-019-01 — Rendimiento
- GET /api/v1/profile: P95 < 1s en condiciones normales
- PATCH /api/v1/profile: P95 < 2s (incluye validación KYC)
- Data-export asíncrono: generación completa < 24h SLA
- Redis blacklist (cierre sesión): < 100ms

### RNF-019-02 — Seguridad
- Todas las operaciones requieren JWT válido no revocado
- Cambio de teléfono y supresión de cuenta requieren OTP 2FA (PSD2-SCA)
- Datos personales en tránsito: TLS 1.2+ obligatorio
- JSON de portabilidad: firmado con SHA-256
- Enlace de confirmación supresión: token aleatorio 256 bits, uso único, TTL 24h

### RNF-019-03 — Disponibilidad
- Disponibilidad objetivo: 99.5% (mismo SLA que resto de BankPortal)
- DataExportService: tolerante a fallos — reintento x3 con backoff exponencial

### RNF-019-04 — Cumplimiento GDPR
- gdpr_requests: retención 6 años mínimo
- consent_history: retención indefinida (base legal para auditorías)
- Supresión de cuenta: completada en 30 días calendario (GDPR Art.12§3)
- Anonimización irreversible: nombre → "USUARIO ELIMINADO", email → SHA-256(email)

### RNF-019-05 — Trazabilidad
- Toda operación de perfil y privacidad genera entrada en audit_log
- audit_log incluye: userId, acción, timestamp UTC, IP, user-agent, resultado

---

## 5. Schema de base de datos (Flyway V22)

```sql
-- V22__profile_gdpr.sql

CREATE TABLE gdpr_requests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    type        VARCHAR(20) NOT NULL CHECK (type IN ('EXPORT','DELETION','CONSENT')),
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','IN_PROGRESS','COMPLETED','REJECTED')),
    metadata    JSONB,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP NOT NULL DEFAULT now(),
    completed_at TIMESTAMP
);

CREATE TABLE consent_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    consent_type    VARCHAR(30) NOT NULL,
    previous_value  BOOLEAN NOT NULL,
    new_value       BOOLEAN NOT NULL,
    changed_at      TIMESTAMP NOT NULL DEFAULT now(),
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(500)
);

CREATE INDEX idx_gdpr_requests_user_id  ON gdpr_requests(user_id);
CREATE INDEX idx_gdpr_requests_status   ON gdpr_requests(status);
CREATE INDEX idx_consent_history_user_id ON consent_history(user_id);
```

---

## 6. API Endpoints (resumen)

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| GET | /api/v1/profile | Consultar perfil | JWT |
| PATCH | /api/v1/profile | Actualizar datos personales | JWT + OTP (teléfono) |
| GET | /api/v1/profile/sessions | Listar sesiones activas | JWT |
| DELETE | /api/v1/profile/sessions/{id} | Cerrar sesión remota | JWT |
| GET | /api/v1/privacy/consents | Consultar consentimientos | JWT |
| PATCH | /api/v1/privacy/consents | Actualizar consentimientos | JWT |
| POST | /api/v1/privacy/data-export | Solicitar portabilidad | JWT |
| GET | /api/v1/privacy/data-export/{id} | Estado de la solicitud | JWT |
| POST | /api/v1/privacy/deletion-request | Solicitar supresión | JWT + OTP |
| GET | /api/v1/admin/gdpr-requests | Log GDPR admin | JWT + ADMIN |

---

## 7. RTM — Requirements Traceability Matrix

| RF | Historia Jira | Módulo Backend | Módulo Frontend | Regulación |
|---|---|---|---|---|
| RF-019-01 | SCRUM-106 | ProfileController | features/profile | GDPR Art.16 |
| RF-019-02 | SCRUM-106 | ProfileService | profile-edit.component | GDPR Art.16 |
| RF-019-03 | SCRUM-107 | ProfileController | sessions-list.component | PSD2-SCA |
| RF-019-04 | SCRUM-108 | PrivacyController, ConsentMgmtSvc | consent-manager.component | GDPR Art.7 |
| RF-019-05 | SCRUM-109 | DataExportService | data-export.component | GDPR Art.15, 20 |
| RF-019-06 | SCRUM-110 | DeletionRequestService | deletion-request.component | GDPR Art.17 |
| RF-019-07 | SCRUM-111 | GdprRequestService | (admin panel) | GDPR Art.12 |
| DEBT-036 | SCRUM-112 | ExportAuditService | — | GDPR trazabilidad |
| MB-020-03 | SCRUM-113 | PdfDocumentGenerator | — | — |

---

## 8. Dependencias con features anteriores

| Feature | Sprint | Dependencia |
|---|---|---|
| FEAT-001 | S1-2 | OTP 2FA para cambio de teléfono y supresión |
| FEAT-002 | S3 | Gestión de sesiones — Redis blacklist JWT |
| FEAT-013 | S15 | KYC check antes de PATCH /profile |
| FEAT-014 | S16 | NotificationService para push de data-export listo |
| FEAT-018 | S20 | ExportService reutilizado para data-export GDPR |
| DEBT-033 | S20 | TokenService para revocación JWT en cierre de sesión remoto |

---

*Generado por SOFIA v2.3 — Requirements Analyst — Step 2 — Sprint 21 — 2026-03-31*  
*Revisión: Gate G-2 pendiente de aprobación PO*
