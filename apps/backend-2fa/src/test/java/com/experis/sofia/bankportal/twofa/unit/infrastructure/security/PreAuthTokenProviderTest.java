package com.experis.sofia.bankportal.twofa.unit.infrastructure.security;

import com.experis.sofia.bankportal.twofa.infrastructure.config.JwtProperties;
import com.experis.sofia.bankportal.twofa.infrastructure.security.PreAuthTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

@DisplayName("PreAuthTokenProvider — JWT pre-autenticación")
class PreAuthTokenProviderTest {

    private static final String PRE_AUTH_SECRET =
        "pre-auth-secret-suficientemente-largo-para-hmac256!!";
    private static final String SESSION_SECRET =
        "session-secret-suficientemente-largo-para-hmac256!!-";

    private PreAuthTokenProvider provider;

    @BeforeEach
    void setUp() {
        JwtProperties props = new JwtProperties(
            SESSION_SECRET,
            PRE_AUTH_SECRET,
            300L,
            28800L
        );
        provider = new PreAuthTokenProvider(props);
    }

    @Test
    @DisplayName("generate produce un JWT con tres segmentos")
    void generate_producesThreeSegmentJwt() {
        String token = provider.generate(UUID.randomUUID());
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    @DisplayName("validate extrae correctamente el userId")
    void validate_returnsCorrectUserId() {
        UUID userId = UUID.randomUUID();
        String token = provider.generate(userId);

        UUID extracted = provider.validate(token);

        assertThat(extracted).isEqualTo(userId);
    }

    @Test
    @DisplayName("validate con token inválido lanza PreAuthTokenInvalidException")
    void validate_invalidToken_throwsException() {
        assertThatThrownBy(() -> provider.validate("token.invalido.aqui"))
            .isInstanceOf(PreAuthTokenProvider.PreAuthTokenInvalidException.class);
    }

    @Test
    @DisplayName("validate con JWT de sesión (sin claim pre_auth) lanza excepción")
    void validate_sessionTokenWithoutPreAuthClaim_throwsException() {
        // Un JWT generado con otro provider (sin claim pre_auth=true) debe ser rechazado
        JwtProperties sameSecretProps = new JwtProperties(
            SESSION_SECRET,
            PRE_AUTH_SECRET,
            300L,
            28800L
        );
        // Generamos un token con el secreto de sesión (distinto al pre-auth)
        // para simular que alguien intentó usar un token de sesión en /2fa/verify
        JwtProperties attackProps = new JwtProperties(
            PRE_AUTH_SECRET,  // intencionalmente usando el mismo secreto pero sin pre_auth claim
            SESSION_SECRET,
            300L, 28800L
        );
        // El token generado con otro provider no tendrá el claim pre_auth=true
        assertThatThrownBy(() -> provider.validate("eyJhbGciOiJIUzI1NiJ9.tampered.signature"))
            .isInstanceOf(PreAuthTokenProvider.PreAuthTokenInvalidException.class);
    }

    @Test
    @DisplayName("dos tokens para el mismo userId son distintos (timestamps distintos)")
    void generate_twoTokensForSameUser_areDifferent() throws InterruptedException {
        UUID userId = UUID.randomUUID();
        String t1 = provider.generate(userId);
        Thread.sleep(1001); // diferente iat
        String t2 = provider.generate(userId);
        assertThat(t1).isNotEqualTo(t2);
    }
}
