# LLD-009 — SSE Notification Stream + JWT Blacklist
## US-305 (SSE tiempo real) + DEBT-009 (JWT blacklist post confirmContext)
*SOFIA Architect Agent · Sprint 8 · 2026-03-17*

---

## 1. DEBT-009 — JWT Blacklist tras confirmContext

### Problema

Al completar `confirmContext` (US-603), el JWT scope=`context-pending` queda técnicamente
válido hasta su expiración natural (30 min). Un atacante que capture ese JWT puede reutilizarlo
para llamar de nuevo a `/auth/confirm-context`. La solución es invalidarlo inmediatamente
tras el primer uso satisfactorio.

ADR-006 ya introduce Redis para blacklist de sesiones (FEAT-002). DEBT-009 extiende ese patrón
al JWT context-pending.

### Diseño JwtBlacklistService

```java
/**
 * DEBT-009 — Blacklist de JWTs invalidados antes de su expiración natural.
 * Extiende ADR-006 (Redis session blacklist) al scope JWT context-pending.
 *
 * Clave Redis: "jwt:blacklist:{jwtId}"
 * TTL: igual al tiempo restante del JWT (no más de 30 min para context-pending)
 *
 * El filtro JwtAuthenticationFilter consulta la blacklist en CADA request.
 * Cost: 1 Redis GET por request (~0.2ms) — aceptable.
 */
@Service @RequiredArgsConstructor @Slf4j
public class JwtBlacklistService {

    private final StringRedisTemplate redisTemplate;
    private final SseRegistry         sseRegistry;

    private static final String PREFIX = "jwt:blacklist:";

    /**
     * Añade el JWT a la blacklist.
     * TTL = tiempo restante hasta expiración (evita acumulación en Redis).
     *
     * @param jwtId   claim "jti" del JWT (UUID único por token)
     * @param userId  claim "sub" — para invalidar conexión SSE asociada
     * @param expiresAt expiración original del JWT
     */
    public void blacklist(String jwtId, UUID userId, Instant expiresAt) {
        Duration ttl = Duration.between(Instant.now(), expiresAt);
        if (ttl.isNegative() || ttl.isZero()) return; // ya expirado

        redisTemplate.opsForValue().set(
                PREFIX + jwtId,
                userId.toString(),
                ttl);

        // Cierra conexión SSE activa con ese userId (ADR-012)
        sseRegistry.invalidate(userId);

        log.info("[DEBT-009] JWT blacklisted jti={} userId={} ttl={}s",
                jwtId, userId, ttl.getSeconds());
    }

    /** true si el JWT está en la blacklist. */
    public boolean isBlacklisted(String jwtId) {
        return redisTemplate.hasKey(PREFIX + jwtId);
    }
}
```

### Integración en LoginContextUseCase.confirmContext()

```java
// En LoginContextUseCase.confirmContext() — tras persistir la subnet:
jwtBlacklistService.blacklist(
    jwt.getId(),               // claim "jti" — debe añadirse al JWT context-pending
    userId,
    jwt.getExpiresAt().toInstant());
```

### Integración en JwtAuthenticationFilter

```java
// Añadir check DESPUÉS de validar firma y expiración:
if (jwtBlacklistService.isBlacklisted(jwt.getId())) {
    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token revoked");
    return;
}
```

### Requisito: claim "jti" en JWT context-pending

El JWT context-pending debe incluir el claim `jti` (JWT ID) para poder referenciarlo en
la blacklist. Actualizar `JwtIssuerService`:
```java
.claim("jti", UUID.randomUUID().toString())  // añadir al builder de context-pending
```

---

## 2. US-305 — SseNotificationController

### 2.1 Controller

```java
/**
 * US-305 — Endpoint SSE para notificaciones en tiempo real.
 *
 * GET /api/v1/notifications/stream
 *
 * Seguridad: scope=full-session requerido.
 * Límite: 1 conexión activa por usuario (ADR-012 SseRegistry).
 * Heartbeat: cada 30s para mantener conexión viva (ADR-010/ADR-012).
 * Reconexión: Last-Event-ID soportado para recuperar eventos perdidos.
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class SseNotificationController {

    private final SseRegistry            sseRegistry;
    private final NotificationRepository notificationRepo;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "Last-Event-ID", required = false) String lastEventId,
            HttpServletResponse response) {

        UUID userId = UUID.fromString(jwt.getSubject());

        // Cabeceras ADR-010
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Cache-Control", "no-cache, no-store");
        response.setHeader("Connection", "keep-alive");

        SseEmitter emitter = sseRegistry.register(userId);
        log.debug("[US-305] SSE conectado userId={}", userId);

        // Reenviar eventos pendidos desde Last-Event-ID (reconexión)
        if (lastEventId != null) {
            replayPendingEvents(userId, lastEventId);
        }

        // Enviar estado inicial: unread-count
        long unread = notificationRepo.countUnreadByUserId(userId);
        sseRegistry.send(userId, SseEvent.unreadCount(unread));

        return emitter;
    }

    private void replayPendingEvents(UUID userId, String lastEventId) {
        // Busca notificaciones creadas después del Last-Event-ID en los últimos 5 min
        notificationRepo.findCreatedAfterEventId(userId, lastEventId,
                Instant.now().minus(5, ChronoUnit.MINUTES))
                .forEach(n -> sseRegistry.send(userId,
                        SseEvent.notification(n.getId().toString(), n)));
    }
}
```

### 2.2 SseEvent — value object

```java
/**
 * Value object inmutable para eventos SSE.
 * Tipos: "notification", "unread-count-updated", "heartbeat"
 */
public record SseEvent(String id, String type, Object payload) {

    public static SseEvent notification(String id, UserNotification n) {
        return new SseEvent(id, "notification", NotificationDto.from(n));
    }

    public static SseEvent unreadCount(long count) {
        return new SseEvent(
                UUID.randomUUID().toString(),
                "unread-count-updated",
                Map.of("count", count));
    }

    public static SseEvent heartbeat() {
        return new SseEvent("", "heartbeat", "");
    }
}
```

### 2.3 NotificationDomainEventPublisher

Cuando se crea una notificación nueva (p.ej. desde un `@EventListener` de `AuditLogCreatedEvent`),
se publica en el SseRegistry:

```java
@Component @RequiredArgsConstructor
public class NotificationDomainEventPublisher {

    private final SseRegistry sseRegistry;

    @EventListener
    @Async
    public void onAuditLogCreated(AuditLogCreatedEvent event) {
        UserNotification notification = buildNotification(event);
        sseRegistry.send(event.userId(),
                SseEvent.notification(notification.getId().toString(), notification));
    }
}
```

---

## 3. Angular — SseNotificationService (US-303/305)

```typescript
/**
 * US-303/305 — Servicio SSE Angular.
 * Gestiona la conexión EventSource, reconexión automática y dispatch
 * de eventos al badge y al notification center.
 *
 * Fallback: si SSE no disponible → polling cada 60s (R-F4-003).
 */
@Injectable({ providedIn: 'root' })
export class SseNotificationService implements OnDestroy {

  private eventSource: EventSource | null = null;
  private readonly subjects = new Map<string, Subject<MessageEvent>>();
  private pollingSubscription?: Subscription;
  private readonly http = inject(HttpClient);

  connect(token: string): void {
    if (this.eventSource) return; // ya conectado

    const url = `/api/v1/notifications/stream`;
    this.eventSource = new EventSource(url); // JWT via cookie HttpOnly (ADR-008)

    this.eventSource.onerror = () => {
      this.eventSource?.close();
      this.eventSource = null;
      this.startPollingFallback();   // R-F4-003
    };

    // Dispatch de eventos por tipo
    ['notification', 'unread-count-updated', 'heartbeat'].forEach(type => {
      this.eventSource!.addEventListener(type, (e: MessageEvent) => {
        this.getSubject(type).next(e);
      });
    });
  }

  /** Observable para un tipo de evento específico */
  on(eventType: string): Observable<{ data: any }> {
    return this.getSubject(eventType).asObservable().pipe(
      map(e => ({ data: JSON.parse(e.data) }))
    );
  }

  private startPollingFallback(): void {
    if (this.pollingSubscription) return;
    this.pollingSubscription = interval(60_000).pipe(
      switchMap(() => this.http.get<{ count: number }>(
          '/api/v1/notifications/unread-count'))
    ).subscribe(r => {
      this.getSubject('unread-count-updated').next(
          { data: JSON.stringify({ count: r.count }) } as any);
    });
  }

  private getSubject(type: string): Subject<MessageEvent> {
    if (!this.subjects.has(type)) {
      this.subjects.set(type, new Subject<MessageEvent>());
    }
    return this.subjects.get(type)!;
  }

  ngOnDestroy(): void {
    this.eventSource?.close();
    this.pollingSubscription?.unsubscribe();
  }
}
```

---

## 4. Diagrama de flujo — confirmContext → JWT Blacklist → SSE invalidado

```
Angular                  Backend                           Redis        SseRegistry
  │                         │                                │               │
  │──POST /confirm-context──►│                               │               │
  │                         │──blacklist(jti, userId, exp)──►│               │
  │                         │                               │◄──SET jwt:bl:*─│
  │                         │──sseRegistry.invalidate(uid)───────────────────►│
  │                         │                               │         emitter.complete()
  │◄──SSE conexión cerrada──────────────────────────────────────────────────  │
  │  (EventSource reconecta │                               │               │
  │   con full-session JWT) │                               │               │
  │──nueva conexión SSE─────►│                               │               │
  │                         │──isBlacklisted(jti_old)───────►│               │
  │                         │◄──false (nuevo JWT)────────────│               │
  │◄──SSE stream activo─────│                               │               │
```

---

## 5. Tests requeridos (DoD Sprint 8 — DEBT-009 + US-305)

| Test | Tipo | Escenarios |
|---|---|---|
| `JwtBlacklistServiceTest` | Unit | blacklist con TTL correcto, isBlacklisted true/false, JWT expirado no se añade |
| `JwtBlacklistFilterIT` | IT | request con JWT blacklisted → 401, request normal → pasa |
| `SseRegistryTest` | Unit | register reemplaza anterior, send a desconectado no lanza, cleanup on timeout |
| `SseNotificationControllerIT` | IT | /stream sin JWT → 401, /stream scope=full-session → 200 text/event-stream |
| `SseNotificationService.spec` | Angular | connect, on(), fallback polling si SSE error, reconexión |
| `us305.spec.ts` | E2E | toast aparece en tiempo real, badge incrementa, reconexión automática |

---

## 6. Configuración application.yml

```yaml
bankportal:
  jwt:
    blacklist:
      enabled: true
      key-prefix: "jwt:blacklist:"
  sse:
    emitter-timeout-ms: 300000
    max-connections: 200
    heartbeat-interval-ms: 30000
    pending-events-window-minutes: 5
```

---

*SOFIA Architect Agent · BankPortal · LLD-009 · Sprint 8 · 2026-03-17*
