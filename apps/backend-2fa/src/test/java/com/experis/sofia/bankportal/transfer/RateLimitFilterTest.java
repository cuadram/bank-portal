package com.experis.sofia.bankportal.transfer;

import com.experis.sofia.bankportal.transfer.infrastructure.RateLimitFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — DEBT-016 RateLimitFilter.
 * Cubre: límite superado, dentro de límite, degradación graceful Redis.
 *
 * @author SOFIA Developer Agent — FEAT-009 Sprint 11
 */
@ExtendWith(MockitoExtension.class)
class RateLimitFilterTest {

    @Mock StringRedisTemplate redis;
    @Mock ValueOperations<String, String> valueOps;
    @Mock HttpServletRequest request;
    @Mock HttpServletResponse response;
    @Mock FilterChain chain;

    private RateLimitFilter filter;
    private final String userId = UUID.randomUUID().toString();

    @BeforeEach
    void setUp() {
        filter = new RateLimitFilter(redis);
        ReflectionTestUtils.setField(filter, "transferLimit", 10);
        ReflectionTestUtils.setField(filter, "beneficiaryLimit", 5);

        // Autenticar usuario en SecurityContext
        var auth = new UsernamePasswordAuthenticationToken(userId, null, java.util.List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(redis.opsForValue()).thenReturn(valueOps);
    }

    @Test
    @DisplayName("DEBT-016 Escenario 1: Dentro del límite → petición permitida")
    void transfer_withinLimit_allowsRequest() throws Exception {
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn("/api/v1/transfers/own");
        when(valueOps.increment(anyString())).thenReturn(5L); // 5 de 10

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verify(response, never()).setStatus(429);
    }

    @Test
    @DisplayName("DEBT-016 Escenario 2: Límite superado → HTTP 429 + Retry-After")
    void transfer_limitExceeded_returns429() throws Exception {
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn("/api/v1/transfers/own");
        when(valueOps.increment(anyString())).thenReturn(11L); // supera límite 10
        when(redis.getExpire(anyString())).thenReturn(45L);

        StringWriter sw = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(sw));

        filter.doFilter(request, response, chain);

        verify(response).setStatus(429);
        verify(response).setHeader("Retry-After", "45");
        assertThat(sw.toString()).contains("RATE_LIMIT_EXCEEDED");
        verify(chain, never()).doFilter(any(), any());
    }

    @Test
    @DisplayName("DEBT-016 Escenario 3: Tráfico legítimo (3 requests) no bloqueado")
    void transfer_legitimateTraffic_notBlocked() throws Exception {
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn("/api/v1/transfers/beneficiary");
        when(valueOps.increment(anyString())).thenReturn(3L);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
    }

    @Test
    @DisplayName("DEBT-016 Escenario 4: Redis no disponible → fail-open, operación permitida")
    void transfer_redisUnavailable_failOpen() throws Exception {
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn("/api/v1/transfers/own");
        when(valueOps.increment(anyString())).thenThrow(new RuntimeException("Redis down"));

        filter.doFilter(request, response, chain);

        // Fail-open: la petición pasa aunque Redis falle
        verify(chain).doFilter(request, response);
        verify(response, never()).setStatus(429);
    }

    @Test
    @DisplayName("DEBT-016: Rate limiting solo aplica a POST, no a GET")
    void get_request_notRateLimited() throws Exception {
        when(request.getMethod()).thenReturn("GET");
        when(request.getRequestURI()).thenReturn("/api/v1/transfers/limits");

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verifyNoInteractions(valueOps);
    }
}
