package com.experis.sofia.bankportal.twofa.infrastructure.config;

import com.experis.sofia.bankportal.twofa.domain.service.CryptoService;
import com.experis.sofia.bankportal.twofa.domain.service.TotpService;
import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de beans TOTP — ADR-004.
 *
 * <p>Librería {@code dev.samstevens.totp:1.7.1}: RFC 6238, HMAC-SHA1,
 * ventana 30s, 6 dígitos, tolerancia ±1 ventana.</p>
 *
 * <p><strong>RV-003 fix:</strong> actúa como adaptador hexagonal —
 * provee la clave AES como {@code String} a {@link CryptoService},
 * eliminando la dependencia domain→infrastructure.</p>
 *
 * <p><strong>Fix compilación v1.7.1:</strong> se eliminó {@code QrDataFactory}
 * (su constructor y método {@code label()} no existen en v1.7.1).
 * {@link TotpService} usa {@code QrData.Builder} directamente.</p>
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
     * Bean {@link CryptoService} — inyecta clave AES como String (RV-003 fix).
     */
    @Bean
    public CryptoService cryptoService() {
        return new CryptoService(totpProperties.aesKey());
    }

    /**
     * Generador de secretos TOTP Base32 — 160 bits (20 bytes).
     */
    @Bean
    public SecretGenerator secretGenerator() {
        return new DefaultSecretGenerator(20);
    }

    /**
     * Proveedor de tiempo del sistema para cálculo de ventanas TOTP.
     */
    @Bean
    public TimeProvider timeProvider() {
        return new SystemTimeProvider();
    }

    /**
     * Generador de códigos TOTP — HMAC-SHA1, 6 dígitos (RFC 6238).
     */
    @Bean
    public CodeGenerator codeGenerator() {
        return new DefaultCodeGenerator(HashingAlgorithm.SHA1, totpProperties.codeDigits());
    }

    /**
     * Verificador de códigos OTP con tolerancia ±1 ventana temporal.
     */
    @Bean
    public CodeVerifier codeVerifier(CodeGenerator codeGenerator, TimeProvider timeProvider) {
        DefaultCodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
        verifier.setTimePeriod(totpProperties.period());
        verifier.setAllowedTimePeriodDiscrepancy(totpProperties.tolerance());
        return verifier;
    }

    /**
     * Generador PNG de QR — singleton (stateless, RV-010 fix).
     */
    @Bean
    public ZxingPngQrGenerator qrGenerator() {
        return new ZxingPngQrGenerator();
    }

    /**
     * Bean {@link TotpService} — inyecta issuer, digits y period como valores
     * primitivos para que el dominio use {@code QrData.Builder} sin acoplarse
     * a {@code TotpProperties}.
     */
    @Bean
    public TotpService totpService(
            SecretGenerator secretGenerator,
            CodeVerifier codeVerifier,
            ZxingPngQrGenerator qrGenerator) {
        return new TotpService(
                secretGenerator,
                codeVerifier,
                qrGenerator,
                totpProperties.issuer(),
                totpProperties.codeDigits(),
                totpProperties.period()
        );
    }

}
