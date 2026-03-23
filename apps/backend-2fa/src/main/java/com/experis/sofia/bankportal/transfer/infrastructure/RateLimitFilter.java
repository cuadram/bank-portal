package com.experis.sofia.bankportal.transfer.infrastructure;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

/**
 * Filtro de rate limiting para endpoints financieros.
 * ADR-018 — DEBT-016 FEAT-009 Sprint 11
 *
 * Límites:
 *   POST /api/v1/transfers/*       → 10 req/min por userId
 *   POST /api/v1/beneficiaries     → 5 req/min por IP
 *
 * Implementación: contadores INCR en Redis con TTL de 60s.
 * Degradación graceful: si Redis falla → fail-open (permite la operación).
 *
 * @author SOFIA Developer Agent
 */
@Slf4j
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final StringRedisTemplate redis;

    @Value("${rate-limit.transfer.per-minute:10}")
    private int transferLimit;

    @Value("${rate-limit.beneficiary.per-minute:5}")
    private int beneficiaryLimit;

    public RateLimitFilter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest req,
                                    @NonNull HttpServletResponse res,
                                    @NonNull FilterChain chain)
            throws ServletException, IOException {

        String uri    = req.getRequestURI();
        String method = req.getMethod();

        // Solo aplica a endpoints POST financieros
        if ("POST".equals(method) && uri.startsWith("/api/v1/transfers/")) {
            String userId = extractUserId();
            if (userId != null && isRateLimited("rl:transfer:" + userId, transferLimit, res)) {
                logRateLimitExceeded("TRANSFER_RATE_LIMIT_EXCEEDED", userId);
                return;
            }
        } else if ("POST".equals(method) && uri.equals("/api/v1/beneficiaries")) {
            String ip = req.getRemoteAddr();
            if (isRateLimited("rl:beneficiary:" + ip, beneficiaryLimit, res)) {
                logRateLimitExceeded("BENEFICIARY_RATE_LIMIT_EXCEEDED", ip);
                return;
            }
        }

        chain.doFilter(req, res);
    }

    /**
     * Verifica y consume un token del bucket de rate limiting.
     * @return true si el límite fue superado (bloquear), false si puede continuar
     */
    private boolean isRateLimited(String key, int limit, HttpServletResponse res)
            throws IOException {
        try {
            Long count = redis.opsForValue().increment(key);
            if (count == null) return false; // Fail-open

            if (count == 1) {
                // Primera petición en esta ventana: establecer TTL de 60s
                redis.expire(key, Duration.ofSeconds(60));
            }

            if (count > limit) {
                Long ttl = redis.getExpire(key);
                long retryAfter = (ttl != null && ttl > 0) ? ttl : 60;
                res.setStatus(429);
                res.setContentType("application/json");
                res.setHeader("Retry-After", String.valueOf(retryAfter));
                res.getWriter().write(
                        "{\"errorCode\":\"RATE_LIMIT_EXCEEDED\",\"retryAfter\":" + retryAfter + "}"
                );
                return true;
            }
            return false;

        } catch (Exception e) {
            // Fail-open: Redis no disponible → permitir la operación
            log.warn("[DEBT-016] Rate limiter Redis no disponible — fail-open para key={}: {}",
                    key, e.getMessage());
            return false;
        }
    }

    private String extractUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : null;
    }

    private void logRateLimitExceeded(String event, String subject) {
        log.warn("[DEBT-016] {} subject={}", event, subject);
    }
}
