package com.experis.sofia.bankportal.auth.infrastructure;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import com.experis.sofia.bankportal.auth.application.SseRegistry;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios DEBT-009 JwtBlacklistService.
 * Escenarios: blacklist futuro/expirado, isBlacklisted true/false/null, remove.
 * @author SOFIA Developer Agent Sprint 8
 */
@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
@DisplayName("DEBT-009 - JwtBlacklistService")
class JwtBlacklistServiceTest {

    @Mock StringRedisTemplate redisTemplate;
    @Mock ValueOperations<String, String> valueOps;
    @Mock SseRegistry sseRegistry;
    @InjectMocks JwtBlacklistService service;

    private static final String JTI     = UUID.randomUUID().toString();
    private static final UUID   USER_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
    }

    @Nested @DisplayName("blacklist()")
    class Blacklist {

        @Test @DisplayName("JWT con expiracion futura -> SET Redis con TTL positivo")
        void futureExpiry_setsRedis() {
            service.blacklist(JTI, USER_ID, Instant.now().plusSeconds(600));
            verify(valueOps).set(
                    eq("jwt:blacklist:" + JTI),
                    eq(USER_ID.toString()),
                    argThat(ttl -> !ttl.isNegative() && !ttl.isZero()));
        }

        @Test @DisplayName("JWT ya expirado -> no-op sin llamada Redis")
        void expiredToken_noOp() {
            service.blacklist(JTI, USER_ID, Instant.now().minusSeconds(1));
            verifyNoInteractions(valueOps);
        }
    }

    @Nested @DisplayName("isBlacklisted()")
    class IsBlacklisted {

        @Test @DisplayName("Clave presente -> true")
        void keyPresent_true() {
            when(redisTemplate.hasKey("jwt:blacklist:" + JTI)).thenReturn(true);
            assertThat(service.isBlacklisted(JTI)).isTrue();
        }

        @Test @DisplayName("Clave ausente -> false")
        void keyAbsent_false() {
            when(redisTemplate.hasKey("jwt:blacklist:" + JTI)).thenReturn(false);
            assertThat(service.isBlacklisted(JTI)).isFalse();
        }

        @Test @DisplayName("Redis null -> false (Boolean.TRUE.equals guard)")
        void redisNull_false() {
            when(redisTemplate.hasKey("jwt:blacklist:" + JTI)).thenReturn(null);
            assertThat(service.isBlacklisted(JTI)).isFalse();
        }
    }

    @Test @DisplayName("remove() -> DELETE Redis key")
    void remove_deletesKey() {
        service.remove(JTI);
        verify(redisTemplate).delete("jwt:blacklist:" + JTI);
    }
}
