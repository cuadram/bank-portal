package com.experis.sofia.bankportal.twofa.infrastructure.service;

import com.experis.sofia.bankportal.twofa.domain.exception.InvalidOtpException;
import com.experis.sofia.bankportal.twofa.domain.repository.TwoFactorRepository;
import com.experis.sofia.bankportal.twofa.domain.service.CryptoService;
import com.experis.sofia.bankportal.twofa.domain.service.TotpService;
import com.experis.sofia.bankportal.twofa.domain.service.TwoFactorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.UUID;

/**
 * Implementación de TwoFactorService — FEAT-001.
 * Usa TotpService (TOTP RFC 6238) + TwoFactorRepository (JPA/JDBC).
 *
 * STG: si el usuario no tiene TOTP configurado (totp_secret_enc NULL),
 * se acepta el código bypass definido en totp.stg-bypass-code (default "123456").
 * En producción este valor debe dejarse vacío para deshabilitar el bypass.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TwoFactorServiceImpl implements TwoFactorService {

    private final TwoFactorRepository twoFactorRepo;
    private final TotpService         totpService;
    private final CryptoService       cryptoService;

    /** Código bypass STG — vacío en producción para deshabilitarlo. */
    @Value("${totp.stg-bypass-code:}")
    private String stgBypassCode;

    @Override
    public boolean isEnabled(UUID userId) {
        return twoFactorRepo.isTwoFactorEnabled(userId);
    }

    @Override
    public boolean verifyOtp(UUID userId, String code) {
        return twoFactorRepo.findTotpSecretEncByUserId(userId)
            .map(enc -> {
                try {
                    String secret = cryptoService.decrypt(enc);
                    return totpService.validateCode(secret, code);
                } catch (Exception e) {
                    log.warn("[2FA] OTP verify failed userId={}: {}", userId, e.getMessage());
                    return false;
                }
            })
            .orElseGet(() -> {
                // Sin TOTP configurado: aceptar bypass STG si está definido y coincide
                if (stgBypassCode != null && !stgBypassCode.isBlank() && stgBypassCode.equals(code)) {
                    log.warn("[2FA] STG bypass OTP aceptado para userId={} — configurar TOTP real en producción", userId);
                    return true;
                }
                log.warn("[2FA] Sin TOTP configurado para userId={} y código no coincide con bypass", userId);
                return false;
            });
    }

    @Override
    public void verifyCurrentOtp(UUID userId, String code) {
        if (!verifyOtp(userId, code))
            throw new InvalidOtpException();
    }

    @Override
    public void enable(UUID userId, String secret) {
        twoFactorRepo.enableTwoFactor(userId);
    }

    @Override
    public void disable(UUID userId) {
        twoFactorRepo.disableTwoFactor(userId);
    }
}
