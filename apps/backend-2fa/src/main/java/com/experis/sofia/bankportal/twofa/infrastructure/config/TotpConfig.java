package com.experis.sofia.bankportal.twofa.infrastructure.config;

import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.qr.QrDataFactory;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de beans TOTP — ADR-004.
 *
 * <p>Utiliza la librería {@code dev.samstevens.totp} con configuración RFC 6238:
 * HMAC-SHA1, ventana 30s, 6 dígitos, tolerancia ±1 ventana.</p>
 *
 * <p>FEAT-001 | US-006 | ADR-004</p>
 *
 * @since 1.0.0
 */
@Configuration
public class TotpConfig {

    private final TotpProperties totpProperties;

    public TotpConfig(TotpProperties totpProperties) {
        this.totpProperties = totpProperties;
    }

    /**
     * Generador de secretos TOTP Base32 — 160 bits (20 bytes).
     *
     * @return {@link SecretGenerator} con longitud estándar RFC 4648
     */
    @Bean
    public SecretGenerator secretGenerator() {
        return new DefaultSecretGenerator(20);
    }

    /**
     * Proveedor de tiempo del sistema para cálculo de ventanas TOTP.
     *
     * @return {@link TimeProvider} basado en System.currentTimeMillis()
     */
    @Bean
    public TimeProvider timeProvider() {
        return new SystemTimeProvider();
    }

    /**
     * Generador de códigos TOTP con HMAC-SHA1 (RFC 6238 estándar).
     *
     * @param timeProvider proveedor de tiempo inyectado
     * @return {@link CodeGenerator} configurado
     */
    @Bean
    public CodeGenerator codeGenerator(TimeProvider timeProvider) {
        return new DefaultCodeGenerator(HashingAlgorithm.SHA1, totpProperties.codeDigits());
    }

    /**
     * Verificador de códigos OTP con tolerancia de ±1 ventana temporal.
     *
     * <p>La tolerancia permite validar códigos de la ventana anterior y siguiente,
     * compensando desfases de reloj menores en el dispositivo del usuario.</p>
     *
     * @param codeGenerator generador de códigos inyectado
     * @param timeProvider  proveedor de tiempo inyectado
     * @return {@link CodeVerifier} con tolerance=1
     */
    @Bean
    public CodeVerifier codeVerifier(CodeGenerator codeGenerator, TimeProvider timeProvider) {
        DefaultCodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
        verifier.setTimePeriod(totpProperties.period());
        verifier.setAllowedTimePeriodDiscrepancy(totpProperties.tolerance());
        return verifier;
    }

    /**
     * Fábrica de datos QR para generar URIs {@code otpauth://totp/...}.
     *
     * <p>El URI generado es compatible con Google Authenticator, Authy,
     * Microsoft Authenticator y cualquier app TOTP estándar.</p>
     *
     * @return {@link QrDataFactory} configurado con issuer y dígitos
     */
    @Bean
    public QrDataFactory qrDataFactory() {
        return new QrDataFactory()
                .label("%s")
                .issuer(totpProperties.issuer())
                .digits(totpProperties.codeDigits())
                .period(totpProperties.period())
                .algorithm(HashingAlgorithm.SHA1);
    }
}
