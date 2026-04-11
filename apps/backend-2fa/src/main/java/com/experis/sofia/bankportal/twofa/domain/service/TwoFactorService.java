package com.experis.sofia.bankportal.twofa.domain.service;

import java.util.UUID;

/**
 * Servicio de verificación 2FA — FEAT-001.
 * Gestiona TOTP y estado de 2FA por usuario.
 */
public interface TwoFactorService {
    boolean isEnabled(UUID userId);
    boolean verifyOtp(UUID userId, String code);
    void    verifyCurrentOtp(UUID userId, String code);   // lanza InvalidOtpException si inválido
    void    enable(UUID userId, String secret);
    void    disable(UUID userId);
}
