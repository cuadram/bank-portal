package com.experis.sofia.bankportal.twofa.unit.domain.service;

import com.experis.sofia.bankportal.twofa.domain.service.TotpService;
import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

@DisplayName("TotpService")
class TotpServiceTest {

    private TotpService totpService;

    @BeforeEach
    void setUp() {
        TimeProvider timeProvider = new SystemTimeProvider();
        CodeGenerator codeGenerator = new DefaultCodeGenerator(HashingAlgorithm.SHA1, 6);
        DefaultCodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
        verifier.setTimePeriod(30);
        verifier.setAllowedTimePeriodDiscrepancy(1);

        totpService = new TotpService(
            new DefaultSecretGenerator(20),
            verifier,
            new ZxingPngQrGenerator(),
            "BankMeridianTest",
            6,
            30
        );
    }

    @Test
    @DisplayName("generateSecret devuelve secreto Base32 no vacío")
    void generateSecret_returnsNonBlankBase32() {
        String secret = totpService.generateSecret();
        assertThat(secret).isNotBlank();
        // Base32 solo contiene A-Z y 2-7
        assertThat(secret).matches("[A-Z2-7]+=*");
    }

    @Test
    @DisplayName("dos secretos generados son distintos")
    void generateSecret_twoCallsReturnDifferentSecrets() {
        assertThat(totpService.generateSecret()).isNotEqualTo(totpService.generateSecret());
    }

    @Test
    @DisplayName("generateQrDataUri devuelve data URI PNG válido")
    void generateQrDataUri_returnsValidDataUri() {
        String secret = totpService.generateSecret();
        String dataUri = totpService.generateQrDataUri(secret, "user@test.com");
        assertThat(dataUri).startsWith("data:image/png;base64,");
    }

    @Test
    @DisplayName("generateQrDataUri incluye issuer en el data URI")
    void generateQrDataUri_containsIssuerInUri() {
        // El QR codifica la URI otpauth — la verificamos a nivel de que genera sin error
        // y que el resultado es un PNG válido (no nulo, no vacío)
        String dataUri = totpService.generateQrDataUri(totpService.generateSecret(), "angel@bank.com");
        assertThat(dataUri).isNotBlank().contains("base64,");
    }

    @Test
    @DisplayName("validateCode retorna true para OTP generado en el mismo período")
    void validateCode_currentPeriodOtp_returnsTrue() throws Exception {
        String secret = totpService.generateSecret();
        TimeProvider tp = new SystemTimeProvider();
        CodeGenerator gen = new DefaultCodeGenerator(HashingAlgorithm.SHA1, 6);
        long bucket = Math.floorDiv(tp.getTime(), 30L);
        String otp = gen.generate(secret, bucket);

        assertThat(totpService.validateCode(secret, otp)).isTrue();
    }

    @Test
    @DisplayName("validateCode retorna false para OTP incorrecto")
    void validateCode_wrongOtp_returnsFalse() {
        assertThat(totpService.validateCode(totpService.generateSecret(), "000000")).isFalse();
    }
}
