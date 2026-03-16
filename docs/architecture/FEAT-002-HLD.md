# HLD — FEAT-002: Gestión Avanzada de Sesiones

## Metadata

| Campo | Valor |
|---|---|
| **Feature** | FEAT-002 |
| **Proyecto** | BankPortal — Banco Meridian |
| **Cliente** | Banco Meridian |
| **Stack** | Java/Spring Boot (backend) + Angular (frontend) |
| **Tipo** | new-feature |
| **Sprint** | 3 · Período 2026-04-14 → 2026-04-25 |
| **Versión** | 1.0 |
| **Estado** | DRAFT — 🔒 Pendiente aprobación Tech Lead |

---

## Análisis de impacto en servicios existentes

| Servicio / Módulo | Tipo de impacto | Acción requerida |
|---|---|---|
| `AuthService` (login flow) | Modificación — añadir registro de sesión y check de concurrencia | Extender sin cambiar contrato externo |
| `JwtService` | Modificación — añadir `jti` (JWT ID) a claims para hashing en blacklist | ADR-006 |
| `TwoFactorService` | Sin impacto | — |
| Tabla `users` | Extensión — nueva columna `session_timeout_minutes` | Migración compatible (default=30) |
| OpenAPI v1.1.0 | Extensión — nuevos endpoints bajo `/api/v1/sessions` | Versionar a v1.2.0 |
| Redis (rate limiter) | Extensión — nuevos namespaces para blacklist y concurrencia | Sin impacto en rate limiter existente |

**Decisión:** impacto acotado y compatible hacia atrás. Se procede con el diseño.

---

## Contexto del sistema — C4 Nivel 1

```mermaid
C4Context
  title BankPortal — Gestión de Sesiones (FEAT-002)

  Person(user, "Usuario portal", "Cliente de Banco Meridian")
  Person(admin, "Administrador", "Configura políticas de sesión")

  System(bankportal, "BankPortal", "Portal bancario digital con 2FA y gestión de sesiones")
  System_Ext(email, "Proveedor email", "SendGrid / SES — notificaciones de seguridad")
  System_Ext(redis, "Redis Cluster", "Blacklist de tokens + control de concurrencia")
  System_Ext(db, "PostgreSQL", "Sesiones activas + dispositivos conocidos")

  Rel(user, bankportal, "Gestiona sesiones", "HTTPS")
  Rel(admin, bankportal, "Configura políticas", "HTTPS")
  Rel(bankportal, email, "Envía alertas de login inusual", "HTTPS/SMTP")
  Rel(bankportal, redis, "Blacklist tokens + concurrencia LRU", "TCP")
  Rel(bankportal, db, "Persiste sesiones + dispositivos", "JDBC")
```

---

## Componentes involucrados — C4 Nivel 2

```mermaid
C4Container
  title BankPortal — Contenedores FEAT-002

  Person(user, "Usuario", "Navegador web")

  Container(ng, "Angular SPA", "Angular 17", "Panel de seguridad: sesiones activas, cierre remoto, timeout")
  Container(api, "backend-2fa", "Spring Boot 3.2", "API REST — módulo de sesiones extendido")
  Container(redis, "Redis Cluster", "Redis 7", "Token blacklist · Concurrencia LRU · Rate limiter")
  Container(pg, "PostgreSQL 15", "RDBMS", "user_sessions · known_devices · users")
  Container(mail, "Email Service", "SendGrid / SES", "Notificaciones de login inusual")

  Rel(user, ng, "Usa", "HTTPS")
  Rel(ng, api, "Llama API", "REST / JSON · Bearer JWT RS256")
  Rel(api, redis, "Blacklist · LRU check", "TCP 6379")
  Rel(api, pg, "Lee/escribe sesiones", "JDBC 5432")
  Rel(api, mail, "Envía alerta", "HTTPS API")
```

---

## Servicios nuevos o modificados

| Servicio | Acción | Responsabilidad | Puerto |
|---|---|---|---|
| `backend-2fa` | MODIFICADO | Añade módulo `session` (US-101/102/103/104/105) y `DEBT-003` | 8081 |
| Redis | MODIFICADO | Nuevo namespace `sessions:blacklist:{userId}` y `sessions:active:{userId}` | 6379 |
| PostgreSQL | MODIFICADO | Nuevas tablas `user_sessions` + `known_devices`, columna en `users` | 5432 |
| Email provider | NUEVO (integración) | Envío de alertas transaccionales de seguridad | HTTPS |

---

## Flujos principales

### Flujo 1 — Login con registro de sesión y check de concurrencia

```mermaid
sequenceDiagram
  participant C as Angular
  participant A as AuthController
  participant SS as SessionService
  participant R as Redis
  participant DB as PostgreSQL

  C->>A: POST /auth/login (credenciales + OTP)
  A->>SS: createSession(userId, deviceInfo, ip)
  SS->>DB: count active sessions for userId
  alt sessions >= MAX_CONCURRENT (3)
    SS->>DB: get oldest session (LRU)
    SS->>R: SET blacklist:jti → 1 (TTL session_lifetime)
    SS->>DB: mark oldest session revoked (SESSION_EVICTED)
  end
  SS->>DB: INSERT user_sessions
  SS->>R: SET sessions:active:{userId}:{jti} → metadata
  SS-->>A: sessionId + JWT (jti claim)
  A-->>C: JWT RS256 + sessionId
```

### Flujo 2 — Cierre remoto de sesión con OTP

```mermaid
sequenceDiagram
  participant C as Angular
  participant SC as SessionController
  participant SS as SessionService
  participant TS as TwoFactorService
  participant R as Redis
  participant DB as PostgreSQL

  C->>SC: DELETE /sessions/{sessionId} + OTP header
  SC->>TS: verifyOtp(userId, otpCode)
  TS-->>SC: valid
  SC->>SS: revokeSession(sessionId, userId)
  SS->>DB: get session → jti
  SS->>R: SET blacklist:jti → 1 (TTL remaining)
  SS->>DB: UPDATE revoked_at, revoke_reason=MANUAL
  SS->>DB: INSERT audit_log (SESSION_REVOKED)
  SS-->>SC: OK
  SC-->>C: 204 No Content
```

### Flujo 3 — Login desde dispositivo nuevo → notificación

```mermaid
sequenceDiagram
  participant A as AuthController
  participant AD as LoginAnomalyDetector
  participant DB as PostgreSQL
  participant NS as NotificationService
  participant E as Email provider

  A->>AD: checkDevice(userId, userAgent, ipHash)
  AD->>DB: SELECT known_devices WHERE user_id AND fingerprint_hash
  alt fingerprint NOT found
    AD->>DB: INSERT known_devices
    AD->>NS: sendLoginAlert(userId, deviceInfo, ip, denyToken)
    NS->>E: POST /mail — alerta HTML con enlace "No fui yo"
  else fingerprint known
    AD->>DB: UPDATE known_devices.last_seen
  end
  AD-->>A: isKnown (bool)
```

---

## Contrato de integración backend ↔ frontend

**Base URL:** `https://api.bankportal.meridian.com/v1`
**Auth:** `Authorization: Bearer <JWT RS256>`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/v1/sessions` | Lista sesiones activas del usuario |
| `DELETE` | `/api/v1/sessions/{sessionId}` | Revoca sesión individual (requiere OTP) |
| `DELETE` | `/api/v1/sessions` | Revoca todas excepto la actual (requiere OTP) |
| `PUT` | `/api/v1/sessions/timeout` | Actualiza preferencia de timeout |
| `GET` | `/api/v1/sessions/deny/{token}` | Deniega sesión desde enlace email (sin auth) |

---

## Decisiones técnicas — ADRs

- **ADR-006:** Redis como token blacklist + estructura de concurrencia LRU
- **ADR-007:** HMAC firmado para enlace "No fui yo" en email de alerta

---

## Checklist de completitud

```
COMPLETITUD
✅ HLD con diagramas C4 Nivel 1 y Nivel 2 en Mermaid
✅ Flujos críticos documentados con diagramas de secuencia
✅ Impacto en servicios existentes analizado
✅ Contrato de integración backend ↔ frontend definido
✅ ADRs identificados (ADR-006, ADR-007)

TRAZABILIDAD CMMI
✅ Metadata completa (feature, sprint, stack, tipo)
✅ Servicios existentes analizados en tabla de impacto
```

---

*Generado por SOFIA Architect Agent · BankPortal · FEAT-002 · Sprint 3 · 2026-04-14*
*🔒 GATE: aprobación Tech Lead requerida antes de iniciar desarrollo*
