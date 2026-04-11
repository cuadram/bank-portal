package com.experis.sofia.bankportal.twofa.application;

import com.experis.sofia.bankportal.twofa.domain.service.TwoFactorService;
import com.experis.sofia.bankportal.twofa.infrastructure.config.TotpProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Facade de validación OTP para casos de uso que requieren confirmación TOTP.
 * Delega en TwoFactorService.verifyCurrentOtp — lanza InvalidOtpException si inválido.
 *
 * STG bypass: si totp.stg-bypass-code está configurado y el código coincide,
 * se omite la validación TOTP real. NUNCA configurar en producción.
 *
 * DEBT-022 — creado en Sprint 19 setup STG.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OtpValidationUseCase {

    private final TwoFactorService twoFactorService;
    private final TotpProperties   totpProperties;

    public void validate(UUID userId, String otpCode) {
        String bypass = totpProperties.stgBypassCode();
        if (bypass != null && !bypass.isBlank() && bypass.equals(otpCode)) {
            log.warn("[OTP-BYPASS] STG bypass activado para userId={} — NUNCA usar en producción", userId);
            return;
        }
        twoFactorService.verifyCurrentOtp(userId, otpCode);
    }
}
