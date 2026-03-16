# LLD — Backend: Centro de Notificaciones de Seguridad

## Metadata

| Campo | Valor |
|---|---|
| **Documento** | LLD-backend-notification |
| **Feature** | FEAT-004 — Centro de Notificaciones |
| **Sprint** | 5 (implementado) / 6 (LLD formalizado — ACT-22) |
| **Autor** | SOFIA Architect Agent |
| **Fecha** | 2026-05-26 |
| **Versión** | 1.0.0 |
| **ADRs** | ADR-010 (SSE + CDN) |
| **Relacionado** | LLD-frontend-notification.md |

---

## 1. Responsabilidad del módulo

El módulo `notification` gestiona el ciclo completo de notificaciones de seguridad:

- **Creación:** `NotificationService.createNotification()` — persiste en BD y envía SSE para eventos críticos
- **Consulta:** `ManageNotificationsUseCase` — US-301 listado paginado, US-303 count unread
- **Marcado:** `ManageNotificationsUseCase` — US-302 markOne (O(1) IDOR-safe) y markAll
- **Streaming:** `SseEmitterRegistry` + `NotificationController.streamNotifications()` — US-305
- **Integración:** `NotificationService` llamada desde FEAT-001/002/003 (Sprint 6)
- **Limpieza:** `@Scheduled` cleanup de notificaciones > 90 días (02:30 UTC)

---

## 2. Arquitectura de capas

```
API
  NotificationController           ← 5 endpoints REST + SSE stream
    GET  /api/v1/notifications
    GET  /api/v1/notifications/unread-count
    PUT  /api/v1/notifications/{id}/read
    PUT  /api/v1/notifications/read-all
    GET  /api/v1/notifications/stream (SSE — ADR-010)

Application
  NotificationService              ← createNotification() @Transactional + sendSseAsync() @Async
  ManageNotificationsUseCase       ← US-301/302/303
  SseEmitterRegistry               ← ConcurrentHashMap userId→SseEmitter (límite 1 por usuario)
  NotificationSseEvent             ← record payload SSE

Domain
  UserNotification                 ← Entidad — markAsRead idempotente · expiresAt 90 días
  UserNotificationRepository       ← Puerto — findByUserId, findByIdAndUserId, countUnread...
  SecurityEventType                ← Enum 13 tipos + isCritical() flag

Infrastructure (pendiente Sprint 6)
  UserNotificationJpaRepository    ← Spring Data JPA
  UserNotificationRepositoryAdapter← Adaptador puerto → JPA
```

---

## 3. Separación @Async / @Transactional (RV-S5-001)

**Patrón aplicado (crítico — no mezclar):**

```java
// ✅ CORRECTO — Sprint 5 tras corrección RV-S5-001
@Transactional
public void createNotification(...) {
    // persiste en BD — transaccional
    notificationRepository.save(notification);
    if (eventType.isCritical()) {
        sendSseAsync(userId, event);  // delegar @Async
    }
}

@Async
public void sendSseAsync(UUID userId, NotificationSseEvent event) {
    // solo opera en memoria — NO transaccional
    sseRegistry.sendToUser(userId, event);
}
```

**Razón:** `@Async` ejecuta en un thread del executor. Si `@Transactional` está en el mismo método,
el `EntityManager` puede cerrarse antes de que el executor thread acceda a la BD. Separar los
métodos garantiza que la transacción cierra correctamente antes del dispatch SSE.

---

## 4. Integración con FEAT-001/002/003 (Sprint 6)

10 puntos de integración — llamadas a `NotificationService.createNotification()`:

| Módulo | Clase | Evento |
|---|---|---|
| FEAT-001 | `AuthService.login()` | `LOGIN_NEW_DEVICE` cuando `DeviceFingerprintService` detecta dispositivo nuevo |
| FEAT-001 | `RateLimiterService` | `LOGIN_FAILED_ATTEMPTS` cuando intentos > umbral |
| FEAT-001 | `TwoFactorService.activate()` | `TWO_FA_ACTIVATED` |
| FEAT-001 | `TwoFactorService.deactivate()` | `TWO_FA_DEACTIVATED` |
| FEAT-002 | `RevokeSessionUseCase` | `SESSION_REVOKED` |
| FEAT-002 | `RevokeAllSessionsUseCase` | `SESSION_REVOKED_ALL` |
| FEAT-002 | `CreateSessionOnLoginUseCase` (evicción) | `SESSION_EVICTED` |
| FEAT-002 | `DenySessionByLinkUseCase` | `SESSION_DENIED_BY_USER` |
| FEAT-003 | `MarkDeviceAsTrustedUseCase` | `TRUSTED_DEVICE_CREATED` |
| FEAT-003 | `ManageTrustedDevicesUseCase.revokeOne()` | `TRUSTED_DEVICE_REVOKED` |

**Patrón de llamada:**
```java
// Inyectar NotificationService en cada use case afectado
// Llamar DESPUÉS de persistir el evento principal (audit_log ya guardado)
notificationService.createNotification(
    userId,
    SecurityEventType.SESSION_REVOKED,
    Map.of("browser", device.getBrowser(), "os", device.getOs()),
    "/security/sessions"  // actionUrl deep-link
);
```

---

## 5. SSE en producción (ADR-010)

**Cambio en `NotificationController.streamNotifications()` para Sprint 6:**

```java
@GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter streamNotifications(
        @AuthenticationPrincipal Jwt jwt,
        HttpServletResponse response) {
    // ADR-010: headers para CDN/proxy
    response.setHeader("X-Accel-Buffering", "no");
    response.setHeader("Cache-Control", "no-cache, no-store");
    response.setHeader("Connection", "keep-alive");

    UUID userId = UUID.fromString(jwt.getSubject());
    return sseRegistry.register(userId);
}
```

---

## 6. Esquema de BD (Flyway V7 — ya en PROD)

```sql
user_notifications (
    id           UUID PK,
    user_id      UUID FK → users,
    event_type   VARCHAR(64),
    title        VARCHAR(128),
    body         TEXT,
    metadata     JSONB,           -- device, browser, ip, sessionId...
    action_url   VARCHAR(256),    -- deep-link US-304
    is_read      BOOLEAN DEFAULT false,
    created_at   TIMESTAMP,
    expires_at   TIMESTAMP        -- created_at + 90 días
)
```

**Índices:**
- `(user_id, created_at DESC)` — paginación US-301
- `(user_id) WHERE is_read = false` — count badge US-303
- `(expires_at) WHERE expires_at < now()` — cleanup nocturno

---

## 7. buildBody() — 13 tipos (Sprint 6 completa los 10 restantes)

| EventType | Mensaje descriptivo (con metadata) |
|---|---|
| `LOGIN_NEW_DEVICE` | "Acceso desde Chrome · macOS (192.168.x.x)" ✅ Sprint 5 |
| `LOGIN_FAILED_ATTEMPTS` | "Se detectaron 5 intentos fallidos de acceso en los últimos 10 minutos" |
| `TRUSTED_DEVICE_LOGIN` | "Acceso sin OTP desde Safari · iOS (registrado hace 15 días)" |
| `SESSION_REVOKED` | "Sesión en Chrome · Windows cerrada remotamente" ✅ Sprint 5 |
| `SESSION_REVOKED_ALL` | "Todas las sesiones excepto la actual han sido cerradas (3 sesiones)" |
| `SESSION_EVICTED` | "Tu sesión más antigua fue cerrada automáticamente (límite alcanzado)" |
| `SESSION_DENIED_BY_USER` | "Acceso denegado mediante el enlace del email de alerta" |
| `TRUSTED_DEVICE_CREATED` | "Safari · macOS añadido como dispositivo de confianza" ✅ Sprint 5 |
| `TRUSTED_DEVICE_REVOKED` | "Chrome · Windows eliminado de tus dispositivos de confianza" |
| `TRUSTED_DEVICE_REVOKE_ALL` | "Todos tus dispositivos de confianza han sido eliminados (2 dispositivos)" |
| `TWO_FA_ACTIVATED` | "La verificación en dos pasos ha sido activada en tu cuenta" |
| `TWO_FA_DEACTIVATED` | "⚠️ La verificación en dos pasos ha sido desactivada en tu cuenta" |

---

## 8. Tests cubiertos y pendientes

| Test | Estado |
|---|---|
| `ManageNotificationsUseCaseTest` — US-301/302/303 | ✅ Sprint 5 |
| `NotificationControllerTest` — 6 endpoints | ✅ Sprint 5 |
| `NotificationServiceTest` — integración + @Async separado | ⏳ Sprint 6 |
| `NotificationRepositoryAdapterTest` — Testcontainers | ⏳ Sprint 6 (con infraestructura) |

---

*SOFIA Architect Agent · BankPortal · FEAT-004 · LLD Backend · 2026-05-26 (ACT-22)*
