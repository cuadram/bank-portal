# ADR-014 — Redis Pub/Sub como broker de eventos SSE para escalado horizontal

## Metadata

| Campo | Valor |
|---|---|
| **ADR** | ADR-014 |
| **Sprint** | 9 · 2026-03-17 |
| **Estado** | Propuesto → Pendiente aprobación Tech Lead (Gate 2) |
| **Relacionado** | ADR-012 (SseRegistry pool), ADR-006 (Redis session blacklist), FEAT-007 DEBT-011 |
| **Sustituye** | Parcialmente ADR-012 — extiende `SseRegistry` con cross-pod broadcast |

---

## Contexto

ADR-012 resuelve la gestión del pool SSE en una instancia única (máx. 200 conexiones,
1 conn/usuario, heartbeat 30s, Last-Event-ID). Sin embargo, el despliegue multi-pod
en producción (Kubernetes, múltiples réplicas del backend) introduce un problema nuevo:

**Escenario problemático:**
```
Pod A (conexión SSE del usuario)   Pod B (procesa el login del mismo usuario)
         │                                    │
         │                        AuditLogCreatedEvent
         │                        NotificationDomainEventPublisher
         │                        sseRegistry.send(userId, event)
         │                              │
         │                      SseRegistry local (Pod B)
         │                      → usuario NO conectado a Pod B
         │                      → evento DESCARTADO silenciosamente
         │
   ← evento nunca llega
```

El usuario no recibe la notificación en tiempo real aunque tenga conexión SSE activa.
Esto afecta a todas las US que dependen de SSE (US-303, US-305) y a las nuevas
US-701 (saldo en tiempo real) de FEAT-007.

---

## Decisión

### Broker: Redis Pub/Sub

Usar Redis como bus de mensajes entre pods. Cada pod suscribe un listener al canal
correspondiente; cuando cualquier pod publica un evento, todos los pods lo reciben y
cada uno reenvía al cliente SSE local si está conectado.

```
Cualquier pod (Publisher)
    │
    │  redisTemplate.convertAndSend("sse:user:{userId}", eventJson)
    ▼
  Redis Pub/Sub
    ├── Pod A: RedisMessageListenerContainer → deserializa → SseRegistry.send(userId, event)
    ├── Pod B: RedisMessageListenerContainer → deserializa → SseRegistry.send(userId, event)
    └── Pod N: RedisMessageListenerContainer → deserializa → SseRegistry.send(userId, event)
```

Solo el pod donde el usuario tiene conexión SSE activa enviará el evento.
Los otros pods llaman a `SseRegistry.send()` y lo descartan silenciosamente (usuario no conectado).

### Channel naming

| Canal | Propósito |
|---|---|
| `sse:user:{userId}` | Eventos dirigidos a un usuario específico |
| `sse:broadcast` | Eventos globales (mantenimiento, alertas del sistema) |

### Fallback graceful si Redis no está disponible

Si Redis no está disponible, el sistema NO debe fallar: las notificaciones siguen
funcionando en modo instancia única (comportamiento de ADR-012). El fallback es
automático y transparente al usuario final.

```java
// En SseEventPublisher.publish() — envuelto en try-catch
try {
    redisTemplate.convertAndSend(channel, serialize(event));
} catch (RedisConnectionException ex) {
    log.warn("[ADR-014] Redis Pub/Sub no disponible, fallback local. error={}", ex.getMessage());
    meterRegistry.counter("sse.redis.fallback.count").increment();
    sseRegistry.send(userId, event); // envío local directo
}
```

### Reconexión de cliente con Last-Event-ID

El cliente EventSource incluye automáticamente el header `Last-Event-ID` al reconectar.
El servidor recupera eventos de los últimos 5 minutos desde ese ID (comportamiento
existente de ADR-012, no cambia).

---

## Implementación

### RedisPubSubConfig

```java
@Configuration
@RequiredArgsConstructor
public class RedisPubSubConfig {

    private final RedisConnectionFactory connectionFactory;

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            SseRedisSubscriber subscriber) {

        RedisMessageListenerContainer container =
                new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);

        // Suscribir a canal de usuario (patrón)
        container.addMessageListener(subscriber,
                new PatternTopic("sse:user:*"));

        // Suscribir a canal broadcast
        container.addMessageListener(subscriber,
                new ChannelTopic("sse:broadcast"));

        return container;
    }
}
```

### SseRedisSubscriber — listener cross-pod

```java
/**
 * ADR-014 — Recibe eventos SSE de Redis y los reenvía al SseRegistry local.
 * Se ejecuta en cada pod; solo el pod con la conexión SSE activa entrega el evento.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SseRedisSubscriber implements MessageListener {

    private final SseRegistry    sseRegistry;
    private final ObjectMapper   objectMapper;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String channel = new String(message.getChannel());
            SseEvent event  = objectMapper.readValue(message.getBody(), SseEvent.class);

            if (channel.startsWith("sse:user:")) {
                UUID userId = UUID.fromString(channel.replace("sse:user:", ""));
                sseRegistry.send(userId, event);  // no-op si no conectado aquí
            } else if ("sse:broadcast".equals(channel)) {
                sseRegistry.sendToAll(event);
            }
        } catch (Exception ex) {
            log.error("[ADR-014] Error procesando mensaje Redis SSE: {}", ex.getMessage());
        }
    }
}
```

### SseEventPublisher — punto único de publicación

```java
/**
 * ADR-014 — Publisher unificado de eventos SSE.
 * Publica en Redis (cross-pod) con fallback local si Redis no disponible.
 * Todo el código que antes llamaba a sseRegistry.send() directamente
 * debe usar este publisher.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SseEventPublisher {

    private final StringRedisTemplate redisTemplate;
    private final SseRegistry         sseRegistry;
    private final ObjectMapper        objectMapper;
    private final MeterRegistry       meterRegistry;

    /**
     * Publica un evento dirigido a un usuario específico.
     * Cross-pod vía Redis; fallback a send local si Redis no disponible.
     */
    public void publishToUser(UUID userId, SseEvent event) {
        String channel = "sse:user:" + userId;
        try {
            String payload = objectMapper.writeValueAsString(event);
            redisTemplate.convertAndSend(channel, payload);
        } catch (RedisConnectionException | JsonProcessingException ex) {
            log.warn("[ADR-014] Redis no disponible, fallback local userId={}", userId);
            meterRegistry.counter("sse.redis.fallback.count").increment();
            sseRegistry.send(userId, event);
        }
    }

    /**
     * Publica un evento a todos los usuarios conectados (broadcast global).
     */
    public void publishBroadcast(SseEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            redisTemplate.convertAndSend("sse:broadcast", payload);
        } catch (RedisConnectionException | JsonProcessingException ex) {
            log.warn("[ADR-014] Redis broadcast fallback local");
            sseRegistry.sendToAll(event);
        }
    }
}
```

### Cambios en NotificationDomainEventPublisher

```java
// ANTES (ADR-012, instancia única):
// sseRegistry.send(userId, event);

// DESPUÉS (ADR-014, multi-pod):
sseEventPublisher.publishToUser(userId, event);

// Aplica a:
// - NotificationDomainEventPublisher.onAuditLogCreated()
// - MarkNotificationsUseCase (broadcast unread-count al marcar leídas)
// - AccountBalanceChangedEventPublisher (FEAT-007 US-701 — saldo en tiempo real)
```

---

## Opciones consideradas

| Opción | Pros | Contras | Decisión |
|---|---|---|---|
| **Redis Pub/Sub (elegida)** ✅ | Simple, Redis ya instalado (ADR-006), fallback graceful, sin nueva infra | Pub/Sub no persiste mensajes (at-most-once) — aceptable para SSE notificaciones | ✅ |
| Redis Streams | Persistencia, grupos de consumidores, replay | Mayor complejidad operativa, no necesaria para notificaciones UI | ❌ |
| Kafka / RabbitMQ | Alta durabilidad, exactly-once | Nueva infra, overhead operativo desproporcionado para este caso | ❌ |
| Spring WebFlux Reactive | Escala nativa sin broker | Requiere reescribir toda la capa HTTP — incompatible con filtros Spring MVC | ❌ |
| Sticky sessions (LB) | Sin cambios en código | Dependencia de infra, punto de fallo, anti-pattern en cloud | ❌ |

---

## Consecuencias

### Positivas
- Escala horizontal transparente: N pods sin configuración adicional por pod.
- Reutiliza la infraestructura Redis existente (ADR-006 ya requiere Redis).
- Fallback graceful garantiza que modo instancia única sigue funcionando en dev/test.
- `SseEventPublisher` centraliza toda la publicación SSE — un solo lugar para auditar,
  monitorizar y controlar el flujo.
- Métrica `sse.redis.fallback.count` alerta si Redis no está disponible en producción.

### Trade-offs
- Pub/Sub es at-most-once: si un pod no está suscrito cuando se publica, el evento
  se pierde. Aceptable porque SSE es best-effort y el cliente tiene polling fallback 60s.
- Un evento se procesa en TODOS los pods aunque solo uno lo entregue. El overhead
  es insignificante (SseRegistry.send() es un HashMap lookup + posible IOException).

### Parámetros configurables (application.yml)
```yaml
bankportal:
  sse:
    redis-pubsub:
      enabled: true                  # false → modo local ADR-012 puro
      user-channel-prefix: "sse:user:"
      broadcast-channel: "sse:broadcast"
    emitter-timeout-ms: 300000
    max-connections: 200
    heartbeat-interval-ms: 30000
    pending-events-window-minutes: 5
```

---

## Runbook verificación DEBT-011

```bash
# 1. Levantar 2 instancias en puertos distintos (STG multi-pod simulado)
# Instancia A — puerto 8080, Instancia B — puerto 8081

# 2. Conectar cliente SSE a Instancia A
curl -N -H "Authorization: Bearer <token>" http://localhost:8080/api/v1/notifications/stream &

# 3. Disparar evento desde Instancia B (simula login desde otro pod)
curl -X POST http://localhost:8081/api/v1/test/trigger-login-event \
     -H "Authorization: Bearer <admin-token>"

# Resultado esperado: el evento aparece en el stream SSE de Instancia A

# 4. Verificar fallback: bajar Redis
docker stop redis
# Disparar evento → debe llegar (fallback local) + log WARN sse.redis.fallback.count

# 5. Métrica
curl http://localhost:8080/actuator/metrics/sse.redis.fallback.count
```

---

*SOFIA Architect Agent · BankPortal · ADR-014 · Sprint 9 · 2026-03-17*
*🔒 GATE 2: aprobación Tech Lead requerida antes de implementar DEBT-011*
