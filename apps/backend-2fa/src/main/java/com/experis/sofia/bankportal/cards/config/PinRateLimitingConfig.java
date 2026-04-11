package com.experis.sofia.bankportal.cards.config;

import io.github.bucket4j.*;
import org.springframework.context.annotation.Configuration;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * DEBT-031: Rate limiting for POST /api/v1/cards/{id}/pin
 * Bucket4j: max 3 attempts/hour per cardId+userId.
 * On limit exceeded: 429 + 24h block + push + audit PIN_RATE_LIMIT_EXCEEDED
 * CVSS 4.2 · PCI-DSS 4.0 req.8 · Sprint 19
 */
@Configuration
public class PinRateLimitingConfig {

    private static final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    /**
     * Returns or creates a rate-limit bucket for the given cardId+userId pair.
     * Limit: 3 requests per hour.
     */
    public Bucket resolveBucket(UUID cardId, UUID userId) {
        String key = "pin:" + cardId + ":" + userId;
        return buckets.computeIfAbsent(key, k ->
            Bucket.builder()
                .addLimit(Bandwidth.classic(3,
                    Refill.intervally(3, Duration.ofHours(1))))
                .build()
        );
    }
}
