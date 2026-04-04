package com.experis.sofia.bankportal.twofa.application;

import com.experis.sofia.bankportal.twofa.domain.service.TwoFactorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Facade de validación OTP para casos de uso que requieren confirmación TOTP.
 * Delega en TwoFactorService.verifyCurrentOtp — lanza InvalidOtpException si inválido.
 * DEBT-022 — creado en Sprint 19 setup STG.
 */
@Service
@RequiredArgsConstructor
public class OtpValidationUseCase {

    private final TwoFactorService twoFactorService;

    public void validate(UUID userId, String otpCode) {
        twoFactorService.verifyCurrentOtp(userId, otpCode);
    }
}
