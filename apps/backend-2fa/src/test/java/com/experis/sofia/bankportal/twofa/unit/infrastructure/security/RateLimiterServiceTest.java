package com.experis.sofia.bankportal.twofa.unit.infrastructure.security;

import com.experis.sofia.bankportal.twofa.infrastructure.config.RateLimitProperties;
import com.experis.sofia.bankportal.twofa.infrastructure.security.RateLimiterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

@DisplayName("RateLimiterService — Token Bucket Bucket4j")
class RateLimiterServiceTest {

    private RateLimiterService rateLimiter;

    @BeforeEach
    void setUp() {
        // capacity=3 para que los tests sean rápidos (no necesitamos 5 intentos)
        RateLimitProperties props = new RateLimitProperties(3L, 10L, 15L);
        rateLimiter = new RateLimiterService(props);
    }

    @Test
    @DisplayName("tryConsume permite intentos dentro de la capacidad")
    void tryConsume_withinCapacity_returnsTrue() {
        UUID userId = UUID.randomUUID();
        assertThat(rateLimiter.tryConsume(userId)).isTrue();
        assertThat(rateLimiter.tryConsume(userId)).isTrue();
        assertThat(rateLimiter.tryConsume(userId)).isTrue();
    }

    @Test
    @DisplayName("tryConsume rechaza al agotar la capacidad")
    void tryConsume_capacityExhausted_returnsFalse() {
        UUID userId = UUID.randomUUID();
        rateLimiter.tryConsume(userId);
        rateLimiter.tryConsume(userId);
        rateLimiter.tryConsume(userId); // agota capacity=3

        assertThat(rateLimiter.tryConsume(userId)).isFalse();
    }

    @Test
    @DisplayName("isBlocked retorna false para usuario sin intentos")
    void isBlocked_newUser_returnsFalse() {
        assertThat(rateLimiter.isBlocked(UUID.randomUUID())).isFalse();
    }

    @Test
    @DisplayName("isBlocked retorna true tras agotar el bucket")
    void isBlocked_afterExhausting_returnsTrue() {
        UUID userId = UUID.randomUUID();
        rateLimiter.tryConsume(userId);
        rateLimiter.tryConsume(userId);
        rateLimiter.tryConsume(userId); // agota capacity=3

        assertThat(rateLimiter.isBlocked(userId)).isTrue();
    }

    @Test
    @DisplayName("reset limpia el bucket — tryConsume vuelve a permitir")
    void reset_afterBlocking_allowsConsumeAgain() {
        UUID userId = UUID.randomUUID();
        rateLimiter.tryConsume(userId);
        rateLimiter.tryConsume(userId);
        rateLimiter.tryConsume(userId); // agota

        rateLimiter.reset(userId);

        assertThat(rateLimiter.tryConsume(userId)).isTrue();
        assertThat(rateLimiter.isBlocked(userId)).isFalse();
    }

    @Test
    @DisplayName("usuarios distintos tienen buckets independientes")
    void tryConsume_differentUsers_haveIndependentBuckets() {
        UUID user1 = UUID.randomUUID();
        UUID user2 = UUID.randomUUID();

        // Agota user1
        rateLimiter.tryConsume(user1);
        rateLimiter.tryConsume(user1);
        rateLimiter.tryConsume(user1);

        // user2 no debe verse afectado
        assertThat(rateLimiter.tryConsume(user2)).isTrue();
        assertThat(rateLimiter.isBlocked(user2)).isFalse();
    }

    @Test
    @DisplayName("getBlockMinutes retorna el valor configurado")
    void getBlockMinutes_returnsConfiguredValue() {
        assertThat(rateLimiter.getBlockMinutes()).isEqualTo(15L);
    }
}
