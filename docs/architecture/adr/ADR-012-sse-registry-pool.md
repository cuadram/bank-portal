# ADR-012 — SseEmitter Pool con 1 conexión por usuario y reconexión automática

## Metadata

| Campo | Valor |
|---|---|
| **ADR** | ADR-012 |
| **Sprint** | 8 · 2026-03-17 |
| **Estado** | Propuesto → Pendiente aprobación Tech Lead |
| **Relacionado** | ADR-010 (SSE CDN/proxy), ADR-006 (Redis blacklist), FEAT-004 US-303/305 |
| **Sustituye** | — (complementa ADR-010, no lo sustituye) |

---

## Contexto

ADR-010 resuelve el problema de SSE en producción con CDN/proxy (buffering, timeouts).
Sprint 8 introduce el uso real del endpoint SSE para FEAT-004 y requiere decisiones
adicionales no cubiertas por ADR-010:

1. **Pool de conexiones**: `SseEmitter` por defecto no limita el número de conexiones
   abiertas simultáneas. Un usuario malicioso puede abrir miles de conexiones agotando
   los threads del pool de Tomcat.

2. **1 conexión por usuario**: el badge (US-303) y los toasts (US-305) son idénticos
   en todas las pestañas del mismo usuario. Mantener múltiples conexiones SSE por usuario
   duplica la carga sin valor añadido.

3. **Reconexión automática**: el navegador reconecta automáticamente con SSE nativo
   (EventSource API), pero el servidor debe gestionar el `Last-Event-ID` para no
   perder eventos ocurridos durante la desconexión.

4. **DEBT-009 (JWT blacklist)**: tras `confirmContext` (US-603) el JWT scope=context-pending
   debe invalidarse inmediatamente. La blacklist debe ser consultada también por el
   endpoint SSE para evitar que un JWT robado mantenga una conexión activa.

---

## Decisión

### 1. SseRegistry — pool centralizado con límite por usuario

```java
/**
 * Registro centralizado de conexiones SSE activas.
 * Garantiza máximo 1 conexión por usuario (ADR-012).
 * Thread-safe: ConcurrentHashMap + SseEmitter timeout de 5 minutos.
 */
@Component
public class SseRegistry {

    private static final long EMITTER_TIMEOUT_MS = 300_000L; // 5 min
    private static final int  MAX_TOTAL_CONNECTIONS = 200;   // límite global

    // userId → emitter activo
    private final ConcurrentHashMap<UUID, SseEmitter> registry = new ConcurrentHashMap<>();

    /**
     * Registra o reemplaza el emitter del usuario.
     * Si ya existe uno activo, lo cierra (la nueva pestaña gana — last-write-wins).
     */
    public SseEmitter register(UUID userId) {
        if (registry.size() >= MAX_TOTAL_CONNECTIONS
                && !registry.containsKey(userId)) {
            throw new SseCapacityExceededException("SSE pool at capacity");
        }

        // Cierra el emitter anterior si existe (nueva pestaña reemplaza)
        SseEmitter existing = registry.get(userId);
        if (existing != null) {
            existing.complete();
        }

        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        registry.put(userId, emitter);

        // Limpiar al completar o timeout
        Runnable cleanup = () -> registry.remove(userId, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(ex -> cleanup.run());

        return emitter;
    }

    /**
     * Envía un evento a un usuario si tiene conexión activa.
     * No lanza excepción si el usuario no está conectado (offline es válido).
     */
    public void send(UUID userId, SseEvent event) {
        SseEmitter emitter = registry.get(userId);
        if (emitter == null) return;
        try {
            emitter.send(SseEmitter.event()
                    .id(event.id())
                    .name(event.type())
                    .data(event.payload()));
        } catch (IOException e) {
            registry.remove(userId, emitter);
        }
    }

    public boolean isConnected(UUID userId) {
        return registry.containsKey(userId);
    }

    public int activeConnections() {
        return registry.size();
    }
}
```

### 2. Last-Event-ID — recuperación de eventos perdidos

El cliente envía `Last-Event-ID` en la cabecera de reconexión (comportamiento nativo
de EventSource). El servidor reenvía eventos pendientes desde ese ID:

```java
@GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter stream(
        @AuthenticationPrincipal Jwt jwt,
        @RequestHeader(value = "Last-Event-ID", required = false) String lastEventId,
        HttpServletResponse response) {

    UUID userId = UUID.fromString(jwt.getSubject());

    // Señales a proxies/CDN (ADR-010)
    response.setHeader("X-Accel-Buffering", "no");
    response.setHeader("Cache-Control", "no-cache, no-store");

    SseEmitter emitter = sseRegistry.register(userId);

    // Reenviar eventos perdidos si se reconecta
    if (lastEventId != null) {
        notificationService.getPendingEvents(userId, lastEventId)
                .forEach(event -> sseRegistry.send(userId, event));
    }

    // Heartbeat cada 30s para mantener la conexión viva a través de proxies
    scheduleHeartbeat(userId);

    return emitter;
}
```

### 3. Heartbeat cada 30 segundos

Mantiene la conexión activa a través de proxies con timeout corto. El cliente Angular
ignora eventos de tipo `heartbeat`:

```java
// En SseRegistry o NotificationScheduler
@Scheduled(fixedDelay = 30_000)
public void sendHeartbeats() {
    registry.forEach((userId, emitter) -> {
        try {
            emitter.send(SseEmitter.event().name("heartbeat").data(""));
        } catch (IOException e) {
            registry.remove(userId, emitter);
        }
    });
}
```

### 4. Integración con JWT Blacklist (DEBT-009)

El filtro SSE verifica la blacklist en cada nueva conexión. Las conexiones ya activas
se invalidan cuando el token se añade a la blacklist (el SseRegistry expone `invalidate(userId)`):

```java
// En JwtBlacklistService.blacklist(jwtId, userId)
public void blacklist(String jwtId, UUID userId) {
    redisTemplate.opsForValue().set(
        "jwt:blacklist:" + jwtId,
        userId.toString(),
        Duration.ofMinutes(30));                // TTL = TTL natural del JWT
    sseRegistry.invalidate(userId);             // cierra conexión SSE activa
}
```

---

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **SseRegistry + 1 conn/usuario (elegida)** ✅ | Simple, Spring MVC, sin librería externa, 1 conn/usuario enforced | Requiere gestión manual del pool; no escala a múltiples instancias sin pub/sub |
| Spring WebFlux Flux\<ServerSentEvent\> | Reactive, mejor escalabilidad | Cambio a WebFlux es mayor — incompatible con filtros Spring MVC existentes |
| WebSocket + STOMP | Bidireccional, rich protocol | Complejidad mayor, CDN support variable, cambio mayor de arquitectura |
| Redis Pub/Sub + múltiples instancias | Escala horizontal | DEBT-009 ya usa Redis — añadir pub/sub en Sprint 8 es scope creep; posponer a Sprint 9 |

---

## Consecuencias

### Positivas
- Pool de 200 conexiones cubre la carga de STG y producción inicial.
- 1 conexión/usuario simplifica la lógica de broadcast y elimina duplicados.
- Heartbeat 30s garantiza funcionamiento a través de Nginx (timeout configurado 600s en ADR-010).
- La integración con JWT blacklist cierra la brecha de seguridad de DEBT-009.

### Trade-offs
- `last-write-wins` en múltiples pestañas: la pestaña más nueva recibe eventos en tiempo real; las anteriores caen a polling fallback (60s, ya implementado en US-303).
- No escala horizontalmente sin Redis pub/sub. Aceptable en Sprint 8; ADR-013 cubrirá el escalado en Sprint 9 si se despliega en múltiples pods.

### Parámetros configurables (application.yml)
```yaml
bankportal:
  sse:
    emitter-timeout-ms: 300000    # 5 min
    max-connections: 200
    heartbeat-interval-ms: 30000  # 30s
    pending-events-window-ms: 300000 # 5 min de eventos a reenviar
```

---

## Runbook verificación Sprint 8

```bash
# Verificar límite 1 conn/usuario (abrir 2 conexiones con mismo JWT)
curl -N -H "Authorization: Bearer <token>" .../stream &
curl -N -H "Authorization: Bearer <token>" .../stream
# Primera conexión debe cerrarse (complete) al abrirse la segunda

# Verificar heartbeat
curl -N -H "Authorization: Bearer <token>" .../stream | grep "heartbeat"
# Debe aparecer cada ~30s: event: heartbeat \n data: \n

# Verificar Last-Event-ID recupera eventos perdidos
curl -N -H "Last-Event-ID: <id>" -H "Authorization: Bearer <token>" .../stream
```

---

*SOFIA Architect Agent · BankPortal · ADR-012 · Sprint 8 · 2026-03-17*
*🔒 GATE: aprobación Tech Lead requerida antes de implementar US-303/US-305*
