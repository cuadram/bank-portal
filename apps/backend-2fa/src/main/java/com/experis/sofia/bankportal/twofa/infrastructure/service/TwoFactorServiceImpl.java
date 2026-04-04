package com.experis.sofia.bankportal.twofa.infrastructure.service;

import com.experis.sofia.bankportal.twofa.domain.exception.InvalidOtpException;
import com.experis.sofia.bankportal.twofa.domain.repository.TwoFactorRepository;
import com.experis.sofia.bankportal.twofa.domain.service.CryptoService;
import com.experis.sofia.bankportal.twofa.domain.service.TotpService;
import com.experis.sofia.bankportal.twofa.domain.service.TwoFactorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.UUID;

/**
 * Implementación de TwoFactorService — FEAT-001.
 * Usa TotpService (TOTP RFC 6238) + TwoFactorRepository (JPA/JDBC).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TwoFactorServiceImpl implements TwoFactorService {

    private final TwoFactorRepository twoFactorRepo;
    private final TotpService         totpService;
    private final CryptoService       cryptoService;

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
            .orElse(false);
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
