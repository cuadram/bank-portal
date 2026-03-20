package com.experis.sofia.bankportal.transfer.infrastructure.redis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Adaptador Redis para contadores diarios de límite de transferencia (US-804).
 *
 * Estrategia: clave transfer:daily:{userId}:{date}, valor en céntimos (long),
 * TTL hasta medianoche UTC. INCRBY atómico evita race conditions.
 *
 * @author SOFIA Developer Agent — FEAT-008 Sprint 10
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TransferLimitRedisAdapter {

    private static final String KEY_PREFIX = "transfer:daily:";
    private final StringRedisTemplate redisTemplate;

    /** Incrementa el acumulado diario de forma atómica. Retorna el nuevo total en EUR. */
    public BigDecimal incrementDaily(UUID userId, BigDecimal amount) {
        String key      = buildKey(userId);
        long   cents    = toCents(amount);
        Long   newTotal = redisTemplate.opsForValue().increment(key, cents);
        redisTemplate.expire(key, computeMidnightTtlSeconds(), TimeUnit.SECONDS);
        log.debug("[US-804] Contador diario: userId={} +{}€ total={}€",
                userId, amount, fromCents(newTotal));
        return fromCents(newTotal);
    }

    /** Consulta el acumulado sin modificarlo. Retorna ZERO si no existe. */
    public BigDecimal getDailyAccumulated(UUID userId) {
        String val = redisTemplate.opsForValue().get(buildKey(userId));
        return val == null ? BigDecimal.ZERO : fromCents(Long.parseLong(val));
    }

    private String buildKey(UUID userId) {
        return KEY_PREFIX + userId + ":" + LocalDate.now(ZoneOffset.UTC);
    }

    private long toCents(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100)).longValue();
    }

    private BigDecimal fromCents(Long cents) {
        return cents == null ? BigDecimal.ZERO
                : BigDecimal.valueOf(cents).divide(BigDecimal.valueOf(100));
    }

    private long computeMidnightTtlSeconds() {
        LocalDateTime now      = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime midnight = now.toLocalDate().plusDays(1).atStartOfDay();
        return Duration.between(now, midnight).getSeconds();
    }
}
