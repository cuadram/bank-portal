# LLD — FEAT-014 Backend — CR Fixes Applied (v1.1)

**BankPortal · Banco Meridian · Sprint 16 · Step 5b**

| Campo | Valor |
|---|---|
| Documento base | LLD-FEAT-014-backend.md v1.0 |
| Versión | 1.1 — Post Code Review |
| Fecha | 2026-03-24 |
| Findings aplicados | RV-F014-01 · 02 · 03 · 06 · 08 · 10 |
| DEBT generada | DEBT-026 · DEBT-027 |
| CMMI | TS SP 2.1 · TS SP 2.2 · VER SP 3.1 |

---

## Cambios aplicados sobre código implementado

### FIX-01 · RV-F014-01 🔴 — Separación @Async / @Transactional en NotificationHub

**Archivo:** `notifications/application/service/NotificationHub.java`

**Antes (incorrecto):**
```java
@Async("notificationExecutor")
@Transactional                          // ← ambas anotaciones en el mismo método
public void dispatch(NotificationEvent event) {
    NotificationPreference pref = prefRepo.findByUserIdAndEventType(...);
    // ... despachos push / SSE / email ...
    persist(event, pref);
}
```

**Después (correcto — patrón RV-S5-001):**
```java
@Async("notificationExecutor")          // ← @Async solo en el punto de entrada
public void dispatch(NotificationEvent event) {
    NotificationPreference pref = prefRepo.findByUserIdAndEventType(...);
    dispatchChannels(event, pref);
    persist(event);
}

@Transactional                          // ← @Transactional solo en persist()
private void persist(NotificationEvent event) {
    UserNotification notif = UserNotification.from(event);
    notifRepo.save(notif);
}
```

**Justificación:** el proxy `@Async` lanza un nuevo thread en el executor. Si `@Transactional` está en el mismo método, Hibernate intenta participar en la transacción del thread origen (ya comprometida) y abre una nueva que envuelve los canales externos. Un `persist()` fallido puede resultar en rollback mientras push/SSE ya enviaron. La separación garantiza que el bloqueo de BD queda contenido en `persist()`.

---

### FIX-02 · RV-F014-02 🔴 — JPA mapping `category` / `severity` en UserNotification

**Archivo:** `notifications/domain/model/UserNotification.java`

**Antes (incorrecto):** POJO sin anotaciones JPA — `category` y `severity` no persistían.

**Después (correcto):**
```java
@Entity
@Table(name = "user_notifications")
public class UserNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)   // FIX-09 aplicado también
    @Column(name = "id")
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    private NotificationCategory category;            // ← campo nuevo V16 DDL

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 10)
    private NotificationSeverity severity;            // ← campo nuevo V16 DDL

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "body", length = 500)
    private String body;

    @Type(JsonType.class)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "read", nullable = false)
    private boolean read = false;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private Instant createdAt;

    public static UserNotification from(NotificationEvent event) {
        UserNotification n = new UserNotification();
        n.userId    = event.userId();
        n.category  = event.category();
        n.severity  = event.severity();
        n.eventType = event.eventType().name();
        n.title     = event.title();
        n.body      = event.body();
        n.metadata  = event.payload();
        return n;
    }
}
```

**Impacto:** sin este fix, el panel de historial devolvía siempre `SECURITY/INFO` (defaults DDL). El filtro por categoría en `GetNotificationsUseCase` nunca funcionaría correctamente.

---

### FIX-03 · RV-F014-03 🟡 — replayMissed() degradación graciosa

**Archivo:** `notifications/infrastructure/sse/SseEmitterRegistry.java` (o `NotificationHubSseRegistry`)

**Antes:** si `lastEventId` había expirado del buffer Redis (TTL 5 min), el loop terminaba sin emitir nada.

**Después:**
```java
public void replayMissed(SseEmitter emitter, String lastEventId, Set<NotificationCategory> categories) {
    List<String> buffer = redis.opsForList().range(replayKey(userId), 0, -1);
    boolean found = false;
    for (String raw : buffer) {
        if (!found) {
            if (extractEventId(raw).equals(lastEventId)) {
                found = true;
            }
            continue;
        }
        emitFiltered(emitter, raw, categories);
    }
    // Degradación graciosa: si el lastEventId ya no está en buffer, emitir todo el buffer
    if (!found && !buffer.isEmpty()) {
        buffer.forEach(raw -> emitFiltered(emitter, raw, categories));
    }
}
```

**Justificación:** el cliente no sabe si perdió eventos recientes o si simplemente no hubo actividad. La degradación "replay total" es preferible a no emitir nada. El cliente reconcilia duplicados con `notificationId` idempotente.

---

### FIX-06 · RV-F014-06 🟡 — @Async redundante eliminado de EmailChannelService

**Archivo:** `notifications/application/service/EmailChannelService.java`

**Antes:**
```java
@Async("notificationExecutor")         // ← redundante: el Hub ya corre en este executor
public void sendNotificationEmail(UUID userId, String subject, String body) { ... }
```

**Después:**
```java
// @Async eliminado — NotificationHub.dispatch() ya es @Async("notificationExecutor")
public void sendNotificationEmail(UUID userId, String subject, String body) { ... }
```

**Impacto:** se evita contención del pool. Cada evento de notificación usaba 2 threads del pool en lugar de 1.

---

### FIX-08 · RV-F014-08 🟢 — @NotNull en PreferencePatchDto.eventType

**Archivo:** `notifications/api/dto/PreferencePatchRequest.java`

```java
public record PreferencePatchRequest(
    @NotNull(message = "eventType is required")         // ← añadido
    @NotBlank
    String eventType,
    Boolean pushEnabled,
    Boolean inAppEnabled,
    Boolean emailEnabled
) {}
```

**Impacto:** sin `@NotNull`, un PATCH con `eventType=null` causaba NPE no gestionada en `ManagePreferencesUseCase.findByEventType()`. Ahora retorna HTTP 400 con mensaje descriptivo.

---

### FIX-10 · RV-F014-10 🟢 — @PreDestroy en SseEmitterRegistry

**Archivo:** `notifications/infrastructure/sse/SseEmitterRegistry.java`

```java
@PreDestroy
public void onShutdown() {
    log.info("SseEmitterRegistry: completing {} active emitters on shutdown", emitters.size());
    emitters.values().forEach(emitter -> {
        try {
            emitter.complete();
        } catch (Exception e) {
            log.warn("Error completing emitter on shutdown", e);
        }
    });
    emitters.clear();
}
```

**Justificación:** en rolling deploys, sin `@PreDestroy`, los clientes reciben una conexión rota sin código de cierre y reconectan inmediatamente todos a la vez (thundering herd). El cierre explícito permite que el navegador aplique el retry exponencial estándar del protocolo SSE.

---

## Deuda técnica registrada (no bloqueante)

| ID | Origen | Descripción | Prioridad | Sprint sugerido |
|---|---|---|---|---|
| DEBT-026 | RV-F014-05 | Race condition en límite de 5 push subscriptions concurrentes | Media | Sprint 18 |
| DEBT-027 | RV-F014-07 | Domain events (`TransferCompletedEvent`, etc.) como inner classes de los listeners — invertir dependencias, mover a `domain/events/` | Media | Sprint 17 |

---

## Impacto en DDL / Flyway

Sin cambios adicionales al DDL. Los scripts `V16__notification_preferences.sql` ya incluyen las columnas `category`, `severity`, `metadata`, `read_at` con los defaults correctos. FIX-02 alinea el modelo JPA con el DDL existente.

---

## Impacto en tests

| Test class | Cambio requerido |
|---|---|
| `NotificationHubTest` | Verificar que `persist()` corre en thread del executor y `dispatch()` no tiene TX activa |
| `UserNotificationRepositoryTest` | Añadir assert que `category` y `severity` se persisten correctamente |
| `SseEmitterRegistryTest` | Caso: `lastEventId` expirado → debe emitir todo el buffer |
| `EmailChannelServiceTest` | Verificar que no hay pool exhaustion (mock executor) |
| `NotificationPreferenceControllerTest` | PATCH con `eventType=null` debe retornar 400 |

---

*SOFIA Documentation Agent — Step 5b | Sprint 16 · FEAT-014*
*CMMI Level 3 — TS SP 2.2 · CM SP 1.2*
*BankPortal — Banco Meridian — 2026-03-24*
