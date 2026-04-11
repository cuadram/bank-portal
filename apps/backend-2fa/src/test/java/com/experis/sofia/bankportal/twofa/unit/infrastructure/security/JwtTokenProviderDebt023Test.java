package com.experis.sofia.bankportal.twofa.unit.infrastructure.security;

import com.experis.sofia.bankportal.twofa.infrastructure.config.JwtProperties;
import com.experis.sofia.bankportal.twofa.infrastructure.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * DEBT-023 — Verifica que JwtTokenProvider incluye jti en el payload
 * y que validateAndExtract devuelve claims completos incluyendo jti y expiresAt.
 *
 * Sprint 14 — SOFIA QA Agent — CMMI VER SP 2.1
 */
@DisplayName("JwtTokenProvider — DEBT-023: jti en payload JWT")
class JwtTokenProviderDebt023Test {

    private static final String SECRET =
        "test-jwt-secret-suficientemente-largo-para-hmac-sha256-32bytes!!";

    private JwtTokenProvider provider;

    @BeforeEach
    void setUp() {
        JwtProperties props = new JwtProperties(SECRET,
            "pre-auth-secret-suficientemente-largo-32bytes!!", 300L, 28800L);
        provider = new JwtTokenProvider(props);
    }

    @Test
    @DisplayName("generate() incluye jti no nulo y no vacío")
    void generate_includesJti() {
        UUID userId = UUID.randomUUID();
        String token = provider.generate(userId, "test@example.com");
        JwtTokenProvider.JwtClaims claims = provider.validateAndExtract(token);

        assertThat(claims.jti()).isNotNull().isNotEmpty();
        // jti debe ser UUID válido
        assertThatCode(() -> UUID.fromString(claims.jti())).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("generate() produce jti único por cada token")
    void generate_uniqueJtiPerToken() {
        UUID userId = UUID.randomUUID();
        String token1 = provider.generate(userId, "test@example.com");
        String token2 = provider.generate(userId, "test@example.com");

        String jti1 = provider.validateAndExtract(token1).jti();
        String jti2 = provider.validateAndExtract(token2).jti();

        assertThat(jti1).isNotEqualTo(jti2);
    }

    @Test
    @DisplayName("validateAndExtract() devuelve expiresAt no nulo")
    void validateAndExtract_includesExpiresAt() {
        UUID userId = UUID.randomUUID();
        String token = provider.generate(userId, "test@example.com");
        JwtTokenProvider.JwtClaims claims = provider.validateAndExtract(token);

        assertThat(claims.expiresAt()).isNotNull();
        assertThat(claims.expiresAt()).isAfter(java.time.Instant.now());
    }

    @Test
    @DisplayName("validateAndExtract() devuelve userId y username correctos")
    void validateAndExtract_correctUserIdAndUsername() {
        UUID userId = UUID.randomUUID();
        String token = provider.generate(userId, "angel@nemtec.es");
        JwtTokenProvider.JwtClaims claims = provider.validateAndExtract(token);

        assertThat(claims.userId()).isEqualTo(userId);
        assertThat(claims.username()).isEqualTo("angel@nemtec.es");
    }
}
