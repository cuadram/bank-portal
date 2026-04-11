# HLD — High Level Design
## FEAT-019: Centro de Privacidad y Perfil de Usuario
**Proyecto:** BankPortal — Banco Meridian  
**Sprint:** 21 | **Release:** v1.21.0 | **Fecha:** 2026-03-31  
**SOFIA Step:** 3 — Architect | **Estado:** DRAFT — Pendiente Gate G-3 (Tech Lead)

---

## 1. Análisis de Impacto en Monorepo

| Servicio / Módulo | Tipo de impacto | Acción requerida |
|---|---|---|
| `backend-2fa` — ProfileController | Nuevo endpoint real (reemplaza stub) | Implementar ProfileController completo |
| `backend-2fa` — TokenService (S20) | Reutilización — cierre remoto de sesiones | Sin cambios, integración directa |
| `backend-2fa` — ExportService (S20) | DEBT-036: AccountRepository en ExportAuditService | Modificación mínima de ExportAuditService |
| `backend-2fa` — NotificationService (S16) | Reutilización — push cuando data-export listo | Sin cambios, llamada existente |
| `backend-2fa` — KycService (S15) | Read-only: verificar kycStatus antes de PATCH /profile | Sin cambios en KYC |
| `frontend-portal` — features/profile/ | Reemplazar placeholder por componente real | Reimplementar módulo completo |
| `frontend-portal` — features/privacy/ | Módulo nuevo | Crear desde cero + registrar en router |
| `frontend-portal` — shell.component.ts | Nuevos nav items | Añadir Mi Perfil + Centro de Privacidad |
| DB PostgreSQL | 2 tablas nuevas + 1 modificación | V22__profile_gdpr.sql |
| Redis | Sin cambios | TokenService.blacklist ya operativo |

**Decisión:** Impacto bajo-medio. Sin cambios en contratos API existentes. Continuar con diseño.

---

## 2. Diagrama C4 — Nivel 1: Contexto del Sistema

```mermaid
C4Context
  title BankPortal — Contexto FEAT-019: Centro de Privacidad y Perfil

  Person(user, "Cliente Banco Meridian", "Accede a BankPortal para gestionar su identidad digital y derechos GDPR")
  Person(admin, "Administrador", "Supervisa solicitudes GDPR y controla SLA de cumplimiento")

  System(bankportal, "BankPortal", "Plataforma bancaria digital — Spring Boot 3.3.4 + Angular 17")
  System_Ext(corebanking, "CoreBanking Meridian", "Sistema core del banco — notificación de bajas de cuenta")
  System_Ext(sms, "SMS Gateway", "Envío de OTP para verificación de teléfono y 2FA eliminación")
  System_Ext(email, "Email Service", "Confirmación de cambios sensibles y flujo de eliminación")

  Rel(user, bankportal, "Gestiona perfil, consentimientos y derechos GDPR", "HTTPS/JWT")
  Rel(admin, bankportal, "Consulta log GDPR y controla SLA", "HTTPS/JWT+ADMIN")
  Rel(bankportal, corebanking, "Notifica baja de cuenta vía webhook", "HTTPS/POST")
  Rel(bankportal, sms, "Envía OTP para cambio teléfono / eliminación", "HTTPS")
  Rel(bankportal, email, "Envía confirmación y enlaces de acción", "SMTP/HTTPS")
```

---

## 3. Diagrama C4 — Nivel 2: Contenedores

```mermaid
C4Container
  title BankPortal — Contenedores FEAT-019

  Person(user, "Cliente")
  Person(admin, "Admin")

  Container(angular, "frontend-portal", "Angular 17 SPA", "Módulos profile y privacy — nuevo Centro de Privacidad")
  Container(backend, "backend-2fa", "Spring Boot 3.3.4 / Java 21", "API REST — nuevos módulos profile y privacy")
  ContainerDb(postgres, "PostgreSQL 16", "Base de datos relacional", "Tablas: users, consent_history, gdpr_requests, export_audit_log")
  ContainerDb(redis, "Redis 7", "Cache + Blacklist JWT", "Token invalidation — cierre remoto de sesiones")

  System_Ext(corebanking, "CoreBanking")
  System_Ext(notifications, "NotificationService", "Push VAPID + Email + SMS")

  Rel(user, angular, "Navega y opera", "HTTPS")
  Rel(admin, angular, "Panel GDPR admin", "HTTPS")
  Rel(angular, backend, "API calls", "HTTPS/JWT — /api/v1/profile, /api/v1/privacy")
  Rel(backend, postgres, "Lee/escribe datos", "JDBC/JdbcClient")
  Rel(backend, redis, "Invalida JWT en blacklist", "Redis SET TTL")
  Rel(backend, corebanking, "Webhook baja de cuenta", "HTTPS POST /corebankng/api/account-deletion")
  Rel(backend, notifications, "Push + Email + SMS", "Reutiliza NotificationService S16")
```

---

## 4. Diagrama de Componentes Backend — Módulos nuevos

```mermaid
C4Component
  title backend-2fa — Componentes FEAT-019

  Container_Boundary(profile_module, "Módulo profile") {
    Component(profile_ctrl, "ProfileController", "REST @RestController", "GET/PATCH /api/v1/profile, GET/DELETE /api/v1/profile/sessions")
    Component(profile_svc, "ProfileService", "Spring @Service", "Lógica de negocio perfil + validación KYC")
    Component(session_svc, "SessionManagementService", "Spring @Service", "Lista sesiones activas, revoca JWT via TokenService")
    Component(profile_repo, "JpaProfileRepository", "@Repository @Primary", "Acceso a tabla users — sin @Profile")
  }

  Container_Boundary(privacy_module, "Módulo privacy") {
    Component(privacy_ctrl, "PrivacyController", "REST @RestController", "GET/PATCH /api/v1/privacy/consents, POST /api/v1/privacy/data-export, POST /api/v1/privacy/deletion-request")
    Component(consent_svc, "ConsentManagementService", "Spring @Service", "CRUD consentimientos + consent_history inmutable")
    Component(export_svc, "DataExportService", "@Async @Service", "Genera JSON firmado SHA-256 con datos del usuario")
    Component(deletion_svc, "DeletionRequestService", "Spring @Service", "Flujo borrado lógico + webhook CoreBanking")
    Component(gdpr_svc, "GdprRequestService", "Spring @Service", "Log gdpr_requests + control SLA 30 días")
  }

  Container_Boundary(admin_module, "Módulo admin") {
    Component(admin_ctrl, "AdminGdprController", "REST @RestController", "GET /api/v1/admin/gdpr-requests — solo ADMIN")
  }

  Container_Boundary(shared, "Servicios reutilizados S16-S20") {
    Component(token_svc, "TokenService", "DEBT-033 S20", "JWT blacklist en Redis")
    Component(notif_svc, "NotificationService", "FEAT-014 S16", "Push VAPID + email")
    Component(kyc_svc, "KycService", "FEAT-013 S15", "Verificación estado KYC")
    Component(audit_svc, "ExportAuditService", "FEAT-018 S20 (DEBT-036)", "Audit log exports — con IBAN real")
  }
```

---

## 5. Diagramas de Secuencia — Flujos críticos

### 5.1 Actualización de teléfono con OTP

```mermaid
sequenceDiagram
  actor U as Usuario
  participant FE as Angular (features/profile)
  participant PC as ProfileController
  participant PS as ProfileService
  participant KYC as KycService
  participant SMS as SMS Gateway
  participant DB as PostgreSQL

  U->>FE: Introduce nuevo teléfono → [Guardar]
  FE->>PC: PATCH /api/v1/profile {telefono: "nuevo"}
  PC->>PS: updateProfile(userId, dto)
  PS->>KYC: getKycStatus(userId)
  KYC-->>PS: APPROVED
  PS->>PS: detecta cambio de teléfono
  PS->>SMS: sendOtp(userId, telefonoActual)
  SMS-->>PS: OTP enviado
  PS-->>PC: 202 OTP_REQUIRED {otpToken: "xxx"}
  PC-->>FE: 202 + otpToken
  FE->>U: Modal: "Introduce el código OTP"
  U->>FE: Introduce OTP
  FE->>PC: PATCH /profile {otpCode, otpToken}
  PC->>PS: confirmPhoneUpdate(userId, otpCode, otpToken)
  PS->>PS: valida OTP
  PS->>DB: UPDATE users SET telefono = nuevo
  PS->>DB: INSERT audit_log (campo, anterior, nuevo, IP)
  PS-->>PC: ProfileResponse actualizado
  PC-->>FE: 200 OK ProfileResponse
  FE->>U: Confirmación: "Teléfono actualizado"
```

### 5.2 Cierre remoto de sesión

```mermaid
sequenceDiagram
  actor U as Usuario
  participant FE as Angular (features/profile)
  participant PC as ProfileController
  participant SS as SessionManagementService
  participant TS as TokenService (S20)
  participant Redis as Redis 7

  U->>FE: [Cerrar] sesión iPhone 14
  FE->>PC: DELETE /api/v1/profile/sessions/{sessionId}
  PC->>SS: closeRemoteSession(userId, sessionId)
  SS->>SS: verifica que sessionId != sesión actual
  SS->>TS: revokeToken(jwtId)
  TS->>Redis: SET blacklist:{jwtId} "revoked" EX {ttl}
  Redis-->>TS: OK
  TS-->>SS: revocado
  SS->>DB: INSERT audit_log (session_closed, sessionId, IP)
  SS-->>PC: SessionClosedResponse
  PC-->>FE: 204 No Content
  FE->>U: Sesión eliminada de la lista
```

### 5.3 Portabilidad de datos — flujo asíncrono

```mermaid
sequenceDiagram
  actor U as Usuario
  participant FE as Angular (features/privacy)
  participant PC as PrivacyController
  participant GS as GdprRequestService
  participant DE as DataExportService (Async)
  participant NS as NotificationService
  participant DB as PostgreSQL

  U->>FE: [Descargar mis datos]
  FE->>PC: POST /api/v1/privacy/data-export
  PC->>GS: createGdprRequest(userId, EXPORT)
  GS->>DB: INSERT gdpr_requests (PENDING, sla=+30d)
  GS-->>PC: requestId
  PC-->>FE: 202 Accepted {requestId}
  FE->>U: "Solicitud registrada. Recibirás una notificación."

  note over DE: Procesamiento asíncrono (@Async)
  DE->>DB: SELECT perfil, consentimientos, sesiones, audit_log
  DE->>DE: genera JSON + calcula SHA-256
  DE->>DE: almacena fichero temporal (48h TTL)
  DE->>GS: updateGdprRequest(requestId, COMPLETED)
  GS->>DB: UPDATE gdpr_requests SET estado=COMPLETED
  DE->>NS: sendPushNotification(userId, "Tus datos están listos")
  NS-->>U: 📱 Push: "Descarga disponible durante 48h"

  U->>FE: pulsa notificación
  FE->>PC: GET /api/v1/privacy/data-export/download
  PC-->>FE: 200 + JSON firmado (Content-Disposition: attachment)
  FE->>U: descarga del fichero JSON
```

---

## 6. Decisiones de diseño clave

| Decisión | Opción elegida | Alternativa descartada | Razón |
|---|---|---|---|
| Generación data-export | @Async Spring + almacenamiento temporal | Síncrono | Potencial timeout con datos voluminosos (RNF-019-03) |
| consent_history | Tabla append-only, inmutable | Sobreescribir campos en users | Trazabilidad GDPR Art.13 — historial obligatorio |
| Borrado de cuenta | Soft delete + anonimización | Hard delete inmediato | Obligación legal GDPR Art.17§3.b — retención audit 6 años |
| OTP para cambio teléfono | SMS al número actual | Email | Mayor seguridad — el número actual es el factor de confianza |
| Webhook CoreBanking fallo | Fire-and-forget + DEBT-040 | Bloquear operación | No podemos bloquear el derecho del usuario por fallo externo |
| SessionManagement | Reutilizar TokenService Redis (S20) | Tabla sesiones nueva | DRY — TokenService ya gestiona JWT blacklist |

> Ver ADR-032 (estrategia borrado lógico) y ADR-033 (async data export).

---

## 7. Modelo de datos — tablas nuevas y modificadas

```mermaid
erDiagram
  users {
    uuid id PK
    varchar nombre
    varchar apellidos
    varchar telefono
    varchar email
    varchar direccion_calle
    varchar direccion_ciudad
    varchar codigo_postal
    varchar pais
    varchar status "ACTIVE|SUSPENDED|DELETED"
    timestamp deleted_at
    timestamp deletion_requested_at
    timestamp created_at
    timestamp updated_at
  }

  consent_history {
    uuid id PK
    uuid user_id FK
    varchar tipo "MARKETING|ANALYTICS|COMMUNICATIONS|SECURITY"
    boolean valor_anterior
    boolean valor_nuevo
    varchar ip_origen
    timestamp created_at
  }

  gdpr_requests {
    uuid id PK
    uuid user_id FK
    varchar tipo "EXPORT|DELETION|CONSENT"
    varchar estado "PENDING|IN_PROGRESS|COMPLETED|REJECTED"
    text descripcion
    timestamp created_at
    timestamp updated_at
    timestamp completed_at
    timestamp sla_deadline
    boolean sla_alert_sent
  }

  export_audit_log {
    uuid id PK
    uuid user_id FK
    uuid account_id FK
    varchar iban_masked "DEBT-036 - nuevo campo"
    varchar formato "PDF|CSV"
    integer num_registros
    varchar filtros_aplicados
    varchar ip_origen
    timestamp created_at
  }

  users ||--o{ consent_history : "tiene historial"
  users ||--o{ gdpr_requests : "genera solicitudes"
  users ||--o{ export_audit_log : "genera exports"
```

---

## 8. Mapa de tipos BD → Java (LA-019-13)

### Tabla: consent_history

| Columna | Tipo PostgreSQL | Tipo Java | Notas |
|---|---|---|---|
| id | uuid | UUID | `rs.getObject("id", UUID.class)` |
| user_id | uuid | UUID | FK — UUID no String |
| tipo | varchar(20) | String | Validar contra enum ConsentType |
| valor_anterior | boolean | Boolean | nullable — null en primera inserción |
| valor_nuevo | boolean | boolean | primitivo — nunca null |
| ip_origen | varchar(45) | String | IPv4 o IPv6 |
| created_at | timestamp | LocalDateTime | WITHOUT TIME ZONE — NO Instant |

### Tabla: gdpr_requests

| Columna | Tipo PostgreSQL | Tipo Java | Notas |
|---|---|---|---|
| id | uuid | UUID | `rs.getObject("id", UUID.class)` |
| user_id | uuid | UUID | FK |
| tipo | varchar(20) | String | GdprRequestType.name() |
| estado | varchar(20) | String | GdprRequestStatus.name() |
| sla_deadline | timestamp | LocalDateTime | created_at + 30 días |
| sla_alert_sent | boolean | boolean | default false |
| created_at | timestamp | LocalDateTime | WITHOUT TIME ZONE |
| updated_at | timestamp | LocalDateTime | nullable — actualizar en cada transición |
| completed_at | timestamp | LocalDateTime | nullable — solo cuando COMPLETED |

---

*Generado por SOFIA v2.3 — Step 3 Architect — Sprint 21 — 2026-03-31*  
*Estado: DRAFT — Pendiente Gate G-3 (aprobación Tech Lead)*
