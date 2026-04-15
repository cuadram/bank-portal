package com.experis.sofia.bankportal.bizum.infrastructure.redis;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * ADR-039: Redis rate limit key canonico: ratelimit:{userId}:bizum:{yyyy-MM-dd}
 * TTL hasta medianoche UTC — DEBT-046 CLOSED.
 */
@Component
public class BizumRateLimitAdapter {
    private static final String KEY_PATTERN = "ratelimit:%s:bizum:%s";
    private final StringRedisTemplate redis;

    public BizumRateLimitAdapter(StringRedisTemplate redis) { this.redis = redis; }

    private String key(UUID userId) {
        return String.format(KEY_PATTERN, userId, LocalDate.now(ZoneOffset.UTC));
    }

    public BigDecimal getDailyUsed(UUID userId) {
        String val = redis.opsForValue().get(key(userId));
        return val == null ? BigDecimal.ZERO : new BigDecimal(val);
    }

    public void increment(UUID userId, BigDecimal amount) {
        String k = key(userId);
        redis.opsForValue().increment(k, amount.longValue());
        // TTL: segundos hasta 00:00:00 UTC del dia siguiente
        long ttl = ChronoUnit.SECONDS.between(Instant.now(),
            LocalDate.now(ZoneOffset.UTC).plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant());
        redis.expire(k, Duration.ofSeconds(ttl));
    }
}
