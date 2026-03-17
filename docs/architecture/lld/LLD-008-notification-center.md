# LLD-008 — Centro de Notificaciones de Seguridad
## Backend + Frontend · US-301 / US-302 / US-303 / US-304
*SOFIA Architect Agent · Sprint 8 · 2026-03-17*

---

## 1. Visión general

FEAT-004 añade un Centro de Notificaciones de Seguridad: historial paginado, mark-as-read,
badge de no leídas en el header y acciones directas desde notificación. US-305 (SSE) se
cubre en LLD-009.

**Flujo principal:**
```
audit_log (inmutable)
    │
    ▼
NotificationService.createFromAuditEvent()  ← escucha @EventListener
    │
    ▼
user_notifications (tabla nueva — Flyway V9)
    │
    ├─► GET /api/v1/notifications  (US-301 historial paginado)
    ├─► PUT /api/v1/notifications/{id}/read  (US-302 marcar individual)
    ├─► PUT /api/v1/notifications/read-all   (US-302 marcar todas)
    └─► GET /api/v1/notifications/unread-count  (US-303 badge)
```

---

## 2. Flyway V9 — user_notifications + notification_preferences

```sql
-- V9__notification_center.sql

-- Tabla principal de notificaciones del usuario
CREATE TABLE user_notifications (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type      VARCHAR(64) NOT NULL,
    title           VARCHAR(128) NOT NULL,
    body            TEXT,
    action_url      VARCHAR(256),           -- deep-link para US-304
    read_at         TIMESTAMP,              -- NULL = no leída
    created_at      TIMESTAMP   NOT NULL DEFAULT now(),
    source_audit_id UUID        REFERENCES audit_log(id) ON DELETE SET NULL
);

-- Índices para queries de US-301/302/303
CREATE INDEX idx_user_notifications_user_created
    ON user_notifications(user_id, created_at DESC);
CREATE INDEX idx_user_notifications_unread
    ON user_notifications(user_id, read_at)
    WHERE read_at IS NULL;

-- Retención: job @Scheduled purga registros > 90 días (patrón US-204)
-- Preferencias de notificación por tipo de evento
CREATE TABLE notification_preferences (
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    enabled    BOOLEAN     NOT NULL DEFAULT true,
    PRIMARY KEY (user_id, event_type)
);

-- Valores por defecto para tipos críticos (siempre habilitados)
COMMENT ON TABLE notification_preferences IS
    'ACCOUNT_LOCKED, LOGIN_NEW_CONTEXT_DETECTED no se pueden deshabilitar (PCI-DSS)';
```

---

## 3. Backend — clases principales

### 3.1 NotificationHistoryUseCase (US-301)

```java
/**
 * US-301 — Historial paginado de notificaciones de seguridad.
 * Ventana máxima: 90 días. Página por defecto: 20 elementos.
 * Filtro opcional por eventType y estado (read/unread).
 */
@Service @RequiredArgsConstructor @Slf4j
public class NotificationHistoryUseCase {

    private final UserNotificationRepository notificationRepo;
    private final AuditLogService            auditLogService;

    static final int DEFAULT_PAGE_SIZE = 20;
    static final int HISTORY_WINDOW_DAYS = 90;

    @Transactional(readOnly = true)
    public Page<UserNotification> getHistory(
            UUID userId, NotificationFilter filter, Pageable pageable) {

        Instant windowStart = Instant.now()
                .minus(HISTORY_WINDOW_DAYS, ChronoUnit.DAYS);

        Page<UserNotification> page = notificationRepo
                .findByUserIdWithFilter(userId, filter, windowStart, pageable);

        auditLogService.log("NOTIFICATIONS_VIEWED", userId,
                "page=" + pageable.getPageNumber() + " size=" + page.getNumberOfElements());
        return page;
    }

    public record NotificationFilter(
        String  eventType,   // null = todos
        Boolean unreadOnly   // null = todos
    ) {}
}
```

### 3.2 MarkNotificationsUseCase (US-302)

```java
/**
 * US-302 — Marcar notificaciones como leídas (individual + bulk).
 * Operación idempotente: marcar una ya-leída no produce error.
 */
@Service @RequiredArgsConstructor
public class MarkNotificationsUseCase {

    private final UserNotificationRepository notificationRepo;
    private final SseRegistry                sseRegistry;

    @Transactional
    public void markAsRead(UUID userId, UUID notificationId) {
        notificationRepo.findByIdAndUserId(notificationId, userId)
                .filter(n -> n.getReadAt() == null)
                .ifPresent(n -> {
                    n.setReadAt(Instant.now());
                    notificationRepo.save(n);
                    broadcastUnreadCount(userId);
                });
    }

    @Transactional
    public int markAllAsRead(UUID userId) {
        int updated = notificationRepo.markAllReadByUserId(userId, Instant.now());
        if (updated > 0) broadcastUnreadCount(userId);
        return updated;
    }

    private void broadcastUnreadCount(UUID userId) {
        long count = notificationRepo.countUnreadByUserId(userId);
        sseRegistry.send(userId, SseEvent.unreadCount(count));
    }
}
```

### 3.3 UnreadCountService (US-303)

```java
/**
 * US-303 — Contador de notificaciones no leídas.
 * Cacheable por 30s (evita queries en cada petición de polling fallback).
 */
@Service @RequiredArgsConstructor
public class UnreadCountService {

    private final UserNotificationRepository notificationRepo;

    @Cacheable(value = "unread-count", key = "#userId")
    public long getUnreadCount(UUID userId) {
        return notificationRepo.countUnreadByUserId(userId);
    }

    @CacheEvict(value = "unread-count", key = "#userId")
    public void invalidate(UUID userId) {}
}
```

### 3.4 NotificationController

```java
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationHistoryUseCase historyUseCase;
    private final MarkNotificationsUseCase   markUseCase;
    private final UnreadCountService         unreadCountService;

    // US-301 — Historial paginado
    @GetMapping
    public ResponseEntity<Page<NotificationDto>> getHistory(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) Boolean unreadOnly,
            @PageableDefault(size = 20, sort = "createdAt", direction = DESC) Pageable pageable) {

        UUID userId = UUID.fromString(jwt.getSubject());
        var filter = new NotificationHistoryUseCase.NotificationFilter(eventType, unreadOnly);
        return ResponseEntity.ok(historyUseCase.getHistory(userId, filter, pageable)
                .map(NotificationDto::from));
    }

    // US-302 — Marcar individual
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID id) {
        markUseCase.markAsRead(UUID.fromString(jwt.getSubject()), id);
        return ResponseEntity.noContent().build();
    }

    // US-302 — Marcar todas
    @PutMapping("/read-all")
    public ResponseEntity<MarkAllResponse> markAllRead(
            @AuthenticationPrincipal Jwt jwt) {
        int updated = markUseCase.markAllAsRead(UUID.fromString(jwt.getSubject()));
        return ResponseEntity.ok(new MarkAllResponse(updated));
    }

    // US-303 — Badge count
    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(
            @AuthenticationPrincipal Jwt jwt) {
        long count = unreadCountService.getUnreadCount(UUID.fromString(jwt.getSubject()));
        return ResponseEntity.ok(new UnreadCountResponse(count));
    }

    record MarkAllResponse(int updated) {}
    record UnreadCountResponse(long count) {}
}
```

### 3.5 NotificationActionService (US-304)

```java
/**
 * US-304 — Acciones directas desde notificación.
 * Genera URLs de deep-link + ejecuta acciones directas (ej. revocar sesión).
 */
@Service @RequiredArgsConstructor
public class NotificationActionService {

    private final SessionManagementUseCase sessionUseCase;  // FEAT-002

    /** Genera la URL de deep-link para una notificación según su tipo. */
    public String resolveActionUrl(String eventType, String contextId) {
        return switch (eventType) {
            case "LOGIN_SUSPICIOUS", "NEW_DEVICE_LOGIN" ->
                    "/security/sessions?highlight=" + contextId;
            case "TRUSTED_DEVICE_ADDED", "TRUSTED_DEVICE_REMOVED" ->
                    "/security/devices";
            case "ACCOUNT_LOCKED" ->
                    "/security/account-locked";
            case "LOGIN_NEW_CONTEXT_CONFIRMED" ->
                    "/security/config-history";
            default -> "/security/notifications";
        };
    }

    /** Revocar sesión directamente desde notificación (US-304 Escenario 2). */
    @Transactional
    public void revokeSessionFromNotification(UUID userId, UUID sessionId) {
        // Delega en el use case existente de FEAT-002
        sessionUseCase.revokeSession(userId, sessionId);
    }
}
```

---

## 4. Frontend — Angular components

### 4.1 NotificationCenterComponent (US-301/302)

**Ruta:** `/security/notifications`
**Selector:** `app-notification-center`

Estado interno:
```typescript
readonly notifications = signal<Notification[]>([]);
readonly loading       = signal(false);
readonly currentPage   = signal(0);
readonly hasMore       = signal(true);
readonly filter        = signal<NotificationFilter>({ unreadOnly: false });
```

Comportamientos clave:
- Scroll infinito: carga siguiente página al llegar al 80% del scroll
- Click en notificación: `PUT /{id}/read` + marca visualmente leída (optimistic UI)
- Botón "Marcar todas": `PUT /read-all` → limpia todos los puntos azules
- Filtro `unreadOnly`: recarga lista desde página 0

### 4.2 NotificationBadgeComponent (US-303)

**Selector:** `app-notification-badge` (integrado en `AppHeaderComponent`)

```typescript
@Component({ selector: 'app-notification-badge', ... })
export class NotificationBadgeComponent implements OnInit, OnDestroy {

  readonly count = signal(0);
  private sseService = inject(SseNotificationService);
  private http       = inject(HttpClient);

  ngOnInit(): void {
    // Carga inicial
    this.http.get<{ count: number }>('/api/v1/notifications/unread-count')
      .subscribe(r => this.count.set(r.count));

    // Actualización en tiempo real vía SSE
    this.sseService.on('unread-count-updated')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => this.count.set(event.data.count));
  }
}
```

Polling fallback: si SSE no disponible, `interval(60_000)` consulta `/unread-count`.

### 4.3 NotificationItemComponent (US-304)

Para cada notificación con `actionUrl`:
```html
<button class="nc__action-btn" (click)="navigateToAction(notification)">
  {{ actionLabel(notification.eventType) }}
</button>
```

Si `eventType === 'LOGIN_SUSPICIOUS'` y la sesión sigue activa:
```html
<button class="nc__revoke-btn" (click)="revokeSession(notification.contextId)">
  Cerrar esta sesión
</button>
```

---

## 5. Diagrama de secuencia — US-301 (historial) + US-302 (mark-as-read)

```
Usuario          Angular                  Backend                      BD
  │                │                         │                          │
  │──click notif──►│                         │                          │
  │                │──PUT /{id}/read─────────►│                         │
  │                │◄──204 (optimistic)───────│                         │
  │ (punto azul    │                         │──UPDATE read_at──────────►│
  │  desaparece    │                         │◄─────────────────────────│
  │  inmediato)    │                         │──SSE: unread-count-updated►─(SseRegistry)
  │                │◄──SSE event─────────────│                          │
  │◄──badge N-1────│                         │                          │
```

---

## 6. Tests requeridos (DoD Sprint 8)

| Test | Tipo | Escenarios |
|---|---|---|
| `NotificationHistoryUseCaseTest` | Unit | paginación, filtro eventType, filtro unreadOnly, ventana 90d, audita |
| `MarkNotificationsUseCaseTest` | Unit | mark individual, mark-all, idempotente, broadcast SSE count |
| `UnreadCountServiceTest` | Unit | cache hit, cache evict tras mark-all |
| `NotificationControllerIT` | IT Web | GET 200/401/403, PUT read 204/404, PUT read-all 200, GET count 200 |
| `NotificationCenterComponent.spec` | Angular | scroll infinito, optimistic read, filtro, estado vacío |
| `us301-304.spec.ts` | E2E | historial renderiza, mark-as-read, badge decrementa, deep-links |

---

*SOFIA Architect Agent · BankPortal · LLD-008 · Sprint 8 · 2026-03-17*
