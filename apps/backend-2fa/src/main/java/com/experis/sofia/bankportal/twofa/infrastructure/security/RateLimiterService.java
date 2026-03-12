package com.experis.sofia.bankportal.twofa.infrastructure.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import com.experis.sofia.bankportal.twofa.infrastructure.config.RateLimitProperties;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servicio de rate limiting para verificaciones OTP — ADR-002.
 *
 * <p>Implementa el patrón Token Bucket con Bucket4j in-process.
 * Cada usuario tiene un bucket independiente. Al agotarse los tokens,
 * {@link #tryConsume(UUID)} retorna {@code false} y {@link #isBlocked(UUID)}
 * retorna {@code true} hasta que se llame a {@link #reset(UUID)}.</p>
 *
 * <p><strong>NC-BANKPORTAL-004 fix (RV-004):</strong> Los imports se corrigieron
 * a {@code io.github.bucket4j.*} — el package correcto para Bucket4j 8.x.</p>
 *
 * <p><strong>RV-009 fix:</strong> {@link #isBlocked(UUID)} usa una sola operación
 * atómica para evitar la race condition del check-then-get.</p>
 *
 * <p><strong>Deuda técnica DEBT-001:</strong> Esta implementación es in-process
 * (ConcurrentHashMap por JVM). En despliegue multi-instancia los buckets no se
 * comparten entre réplicas. Solución: Bucket4j + Redis (Redisson).</p>
 *
 * <p>FEAT-001 | US-006 | ADR-002</p>
 *
 * @since 1.0.0
 */
@Service
public class RateLimiterService {

    // TODO(DEBT-001): reemplazar por Bucket4j + Redis para soporte multi-instancia.
    // Impacto: Alto — en k8s con múltiples pods, cada pod tiene su propio estado.
    private final Map<UUID, Bucket> buckets = new ConcurrentHashMap<>();

    private final long capacity;
    private final long windowMinutes;
    private final long blockMinutes;

    /**
     * Construye el servicio con los parámetros de configuración del rate limiter.
     *
     * @param props propiedades de configuración (capacity, windowMinutes, blockMinutes)
     */
    public RateLimiterService(RateLimitProperties props) {
        this.capacity      = props.capacity();
        this.windowMinutes = props.windowMinutes();
        this.blockMinutes  = props.blockMinutes();
    }

    /**
     * Intenta consumir un token del bucket del usuario.
     *
     * @param userId UUID del usuario que intenta verificar OTP
     * @return {@code true} si el intento está permitido; {@code false} si está bloqueado
     */
    public boolean tryConsume(UUID userId) {
        return getBucket(userId).tryConsume(1);
    }

    /**
     * Verifica si el bucket del usuario está agotado (usuario bloqueado).
     *
     * <p><strong>RV-009 fix:</strong> Usa una sola operación atómica {@code get()}
     * para evitar la race condition del patrón containsKey + get.</p>
     *
     * @param userId UUID del usuario
     * @return {@code true} si no quedan tokens disponibles
     */
    public boolean isBlocked(UUID userId) {
        Bucket bucket = buckets.get(userId);
        return bucket != null && bucket.getAvailableTokens() == 0;
    }

    /**
     * Resetea el bucket del usuario (tras verificación exitosa o bloqueo expirado).
     *
     * @param userId UUID del usuario a desbloquear
     */
    public void reset(UUID userId) {
        buckets.remove(userId);
    }

    /**
     * Retorna los minutos de bloqueo configurados.
     *
     * <p>El caso de uso puede incluir este valor en la respuesta HTTP 429
     * para que el frontend muestre un countdown al usuario.</p>
     *
     * @return duración de bloqueo en minutos
     */
    public long getBlockMinutes() {
        return blockMinutes;
    }

    /**
     * Obtiene o crea el bucket para un usuario.
     *
     * @param userId UUID del usuario
     * @return bucket con capacidad configurada y recarga por ventana de tiempo
     */
    private Bucket getBucket(UUID userId) {
        return buckets.computeIfAbsent(userId, id -> {
            Bandwidth limit = Bandwidth.builder()
                .capacity(capacity)
                .refillIntervally(capacity, Duration.ofMinutes(windowMinutes))
                .build();
            return Bucket.builder().addLimit(limit).build();
        });
    }
}
