package com.experis.sofia.bankportal.notification.application;

import com.experis.sofia.bankportal.notification.domain.NotificationCategory;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Registro SSE multicanal con filtro por categoría y replay Redis — FEAT-014.
 *
 * <p>Fixes aplicados:
 * <ul>
 *   <li>RV-F014-03: si {@code lastEventId} no está en el buffer Redis (expiró),
 *       se emiten todos los eventos disponibles (replay total degradado gracioso).</li>
 *   <li>RV-F014-10: {@code @PreDestroy} cierra todos los emitters activos en shutdown
 *       para evitar connection leaks en rolling deploys.</li>
 * </ul>
 *
 * <p>Nota arquitectura (RV-F014-04 — pendiente refactoring):
 * Esta clase debería residir en {@code infrastructure/sse/} por importar
 * {@code StringRedisTemplate}. Se migra en el sprint de deuda técnica como DEBT-027.
 *
 * @author SOFIA Developer Agent — FEAT-014 Sprint 16 (CR fix)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationHubSseRegistry {

    private static final long     SSE_TIMEOUT_MS    = 5 * 60 * 1000L;
    private static final String   REPLAY_KEY_PREFIX = "sse:replay:";
    private static final Duration REPLAY_TTL        = Duration.ofMinutes(5);
    private static final int      REPLAY_MAX_EVENTS = 50;

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper        objectMapper;

    private final Map<String, List<FilteredEmitter>> emitters = new ConcurrentHashMap<>();
    private final AtomicLong eventIdSequence = new AtomicLong(System.currentTimeMillis());

    // ── Suscripción ──────────────────────────────────────────────────────────

    public SseEmitter subscribe(UUID userId, Set<NotificationCategory> categories,
                                String lastEventId) {
        var emitter = new SseEmitter(SSE_TIMEOUT_MS);
        var filtered = new FilteredEmitter(emitter, categories);
        String key = userId.toString();

        emitters.computeIfAbsent(key, k -> new CopyOnWriteArrayList<>()).add(filtered);

        Runnable cleanup = () -> {
            var list = emitters.get(key);
            if (list != null) list.remove(filtered);
            log.debug("[Hub-SSE] emitter removed userId={}", userId);
        };
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(ex -> {
            cleanup.run();
            log.debug("[Hub-SSE] error userId={}: {}", userId, ex.getMessage());
        });

        if (lastEventId != null) {
            replayMissed(userId, categories, lastEventId, emitter);
        }

        log.debug("[Hub-SSE] subscribed userId={} categories={} lastEventId={}",
                userId, categories, lastEventId);
        return emitter;
    }

    // ── Broadcast ────────────────────────────────────────────────────────────

    public void broadcastToUser(UUID userId, NotificationCategory category,
                                Map<String, Object> payload) {
        String eventId = "evt-" + eventIdSequence.incrementAndGet();
        storeInReplayBuffer(userId, eventId, category, payload);

        var list = emitters.get(userId.toString());
        if (list == null || list.isEmpty()) {
            log.debug("[Hub-SSE] no active emitters userId={} — stored in replay buffer", userId);
            return;
        }

        String eventName = category.name();
        String data;
        try {
            data = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            log.error("[Hub-SSE] serialize error: {}", e.getMessage());
            return;
        }

        List<FilteredEmitter> toRemove = new ArrayList<>();
        for (FilteredEmitter fe : list) {
            if (fe.accepts(category)) {
                try {
                    fe.emitter().send(SseEmitter.event()
                            .id(eventId).name(eventName).data(data));
                } catch (IOException e) {
                    toRemove.add(fe);
                    log.debug("[Hub-SSE] broken emitter removed userId={}", userId);
                }
            }
        }
        list.removeAll(toRemove);
    }

    public void sendHeartbeat(UUID userId) {
        var list = emitters.get(userId.toString());
        if (list == null) return;
        List<FilteredEmitter> toRemove = new ArrayList<>();
        for (FilteredEmitter fe : list) {
            try {
                fe.emitter().send(SseEmitter.event().comment("heartbeat"));
            } catch (IOException e) {
                toRemove.add(fe);
            }
        }
        list.removeAll(toRemove);
    }

    public int activeConnections() {
        return emitters.values().stream().mapToInt(List::size).sum();
    }

    // ── Shutdown — RV-F014-10 fix ────────────────────────────────────────────

    @PreDestroy
    public void shutdown() {
        log.info("[Hub-SSE] shutdown: completing {} active emitters", activeConnections());
        emitters.values().forEach(list ->
                list.forEach(fe -> {
                    try { fe.emitter().complete(); } catch (Exception ignored) {}
                })
        );
        emitters.clear();
    }

    // ── Replay — RV-F014-03 fix ──────────────────────────────────────────────

    private void replayMissed(UUID userId, Set<NotificationCategory> categories,
                              String lastEventId, SseEmitter emitter) {
        String replayKey = REPLAY_KEY_PREFIX + userId;
        List<String> stored = redisTemplate.opsForList().range(replayKey, 0, REPLAY_MAX_EVENTS);
        if (stored == null || stored.isEmpty()) return;

        // Si lastEventId no está en el buffer (TTL expiró), emitir todos (degradado gracioso)
        boolean anchorFound = stored.stream().anyMatch(raw -> {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> e = objectMapper.readValue(raw, Map.class);
                return lastEventId.equals(e.get("id"));
            } catch (Exception ex) { return false; }
        });

        boolean pastAnchor = !anchorFound; // si no hay anchor, emitir todo

        for (String raw : stored) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> entry = objectMapper.readValue(raw, Map.class);
                String id  = (String) entry.get("id");
                String cat = (String) entry.get("category");

                if (!pastAnchor) {
                    if (lastEventId.equals(id)) pastAnchor = true;
                    continue;
                }

                if (categories.isEmpty() || categories.stream()
                        .anyMatch(c -> c.name().equals(cat))) {
                    emitter.send(SseEmitter.event()
                            .id(id)
                            .name(cat)
                            .data(objectMapper.writeValueAsString(entry.get("payload"))));
                }
            } catch (Exception e) {
                log.debug("[Hub-SSE] replay parse error: {}", e.getMessage());
            }
        }
    }

    private void storeInReplayBuffer(UUID userId, String eventId,
                                     NotificationCategory category, Map<String, Object> payload) {
        try {
            String replayKey = REPLAY_KEY_PREFIX + userId;
            String entry = objectMapper.writeValueAsString(
                    Map.of("id", eventId, "category", category.name(), "payload", payload));
            redisTemplate.opsForList().rightPush(replayKey, entry);
            redisTemplate.opsForList().trim(replayKey, -REPLAY_MAX_EVENTS, -1);
            redisTemplate.expire(replayKey, REPLAY_TTL);
        } catch (JsonProcessingException e) {
            log.warn("[Hub-SSE] failed to store replay entry: {}", e.getMessage());
        }
    }

    private record FilteredEmitter(SseEmitter emitter, Set<NotificationCategory> categories) {
        boolean accepts(NotificationCategory category) {
            return categories.isEmpty() || categories.contains(category);
        }
    }
}
