package com.experis.sofia.bankportal.twofa.infrastructure.config;

import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.retry.RetryConfig;
import io.github.resilience4j.retry.RetryRegistry;
import io.github.resilience4j.timelimiter.TimeLimiterConfig;
import io.github.resilience4j.timelimiter.TimeLimiterRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.HttpClientErrorException;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.time.Duration;

/**
 * Configuración programática de Resilience4j para llamadas al core bancario.
 * ADR-017 — FEAT-009 Sprint 11
 *
 * Orden de decoración (exterior → interior): TimeLimiter → Retry → CircuitBreaker
 *
 * @author SOFIA Developer Agent
 */
@Configuration
public class ResilienceConfig {

    /**
     * Circuit Breaker: abre al 50% de fallos en ventana de 10 llamadas.
     * OPEN durante 30s → HALF-OPEN → CLOSED tras 3 éxitos.
     * Ignora 4xx (errores de negocio) — no penalizan el circuit breaker.
     */
    @Bean
    public CircuitBreakerRegistry circuitBreakerRegistry() {
        return CircuitBreakerRegistry.of(
            CircuitBreakerConfig.custom()
                .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
                .slidingWindowSize(10)
                .failureRateThreshold(50)
                .waitDurationInOpenState(Duration.ofSeconds(30))
                .permittedNumberOfCallsInHalfOpenState(3)
                .recordExceptions(ConnectException.class, SocketTimeoutException.class)
                .ignoreExceptions(HttpClientErrorException.class)
                .build()
        );
    }

    /**
     * Retry: 2 reintentos con backoff 500ms.
     * Solo en errores de red — nunca en 4xx.
     */
    @Bean
    public RetryRegistry retryRegistry() {
        return RetryRegistry.of(
            RetryConfig.custom()
                .maxAttempts(3)
                .waitDuration(Duration.ofMillis(500))
                .retryExceptions(ConnectException.class, SocketTimeoutException.class)
                .ignoreExceptions(HttpClientErrorException.class)
                .build()
        );
    }

    /**
     * TimeLimiter: cancela llamadas que superen 5 segundos.
     */
    @Bean
    public TimeLimiterRegistry timeLimiterRegistry() {
        return TimeLimiterRegistry.of(
            TimeLimiterConfig.custom()
                .timeoutDuration(Duration.ofSeconds(5))
                .cancelRunningFuture(true)
                .build()
        );
    }
}
