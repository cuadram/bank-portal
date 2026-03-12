package com.experis.sofia.bankportal.twofa.unit.infrastructure.security;

import com.experis.sofia.bankportal.twofa.infrastructure.config.JwtProperties;
import com.experis.sofia.bankportal.twofa.infrastructure.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

@DisplayName("JwtTokenProvider — JWT de sesión completa")
class JwtTokenProviderTest {

    // 64 chars = 512 bits — válido para HS256
    private static final String SECRET =
        "test-jwt-secret-suficientemente-largo-para-hmac-sha256-32bytes!!";

    private JwtTokenProvider provider;

    @BeforeEach
    void setUp() {
        JwtProperties props = new JwtProperties(
            SECRET,
            "pre-auth-secret-suficientemente-largo-32bytes!!",
            300L,
            28800L
        );
        provider = new JwtTokenProvider(props);
    }

    @Test
    @DisplayName("generate produce un JWT con tres segmentos")
    void generate_producesThreeSegmentJwt() {
        String token = provider.generate(UUID.randomUUID(), "user@test.com");
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    @DisplayName("validateAndExtract devuelve el userId correcto")
    void validateAndExtract_returnsCorrectUserId() {
        UUID userId = UUID.randomUUID();
        String token = provider.generate(userId, "user@test.com");

        JwtTokenProvider.JwtClaims claims = provider.validateAndExtract(token);

        assertThat(claims.userId()).isEqualTo(userId);
    }

    @Test
    @DisplayName("validateAndExtract devuelve el username correcto")
    void validateAndExtract_returnsCorrectUsername() {
        String token = provider.generate(UUID.randomUUID(), "angel@bank.com");

        JwtTokenProvider.JwtClaims claims = provider.validateAndExtract(token);

        assertThat(claims.username()).isEqualTo("angel@bank.com");
    }

    @Test
    @DisplayName("validateAndExtract con token inválido lanza JwtTokenInvalidException")
    void validateAndExtract_invalidToken_throwsException() {
        assertThatThrownBy(() -> provider.validateAndExtract("esto.no.es.un.jwt"))
            .isInstanceOf(JwtTokenProvider.JwtTokenInvalidException.class);
    }

    @Test
    @DisplayName("validateAndExtract con token firmado con secreto distinto lanza excepción")
    void validateAndExtract_tokenSignedWithDifferentSecret_throwsException() {
        JwtProperties otherProps = new JwtProperties(
            "otro-secreto-completamente-diferente-32bytes!!--",
            "pre-auth-x",
            300L, 28800L
        );
        JwtTokenProvider otherProvider = new JwtTokenProvider(otherProps);
        String foreignToken = otherProvider.generate(UUID.randomUUID(), "hacker");

        assertThatThrownBy(() -> provider.validateAndExtract(foreignToken))
            .isInstanceOf(JwtTokenProvider.JwtTokenInvalidException.class);
    }
}
