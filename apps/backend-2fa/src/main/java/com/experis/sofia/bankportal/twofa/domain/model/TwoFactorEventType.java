package com.experis.sofia.bankportal.twofa.domain.model;

/**
 * Tipos de evento auditables para el módulo 2FA.
 *
 * <p>Persisten en {@code audit_log.event_type} (VARCHAR 64, inmutable).
 * Cada evento corresponde a una acción de seguridad relevante para
 * PCI-DSS req. 10 y la política de auditoría de Banco Meridian.</p>
 *
 * <p>FEAT-001 | US-005 | ADR-003</p>
 *
 * @since 1.0.0
 */
public enum TwoFactorEventType {

    /** Usuario completó el enrolamiento TOTP (US-001). */
    TWO_FACTOR_ENROLLED,

    /** Usuario desactivó 2FA con contraseña + OTP confirmados (US-004). */
    TWO_FACTOR_DISABLED,

    /** Verificación OTP exitosa durante login (US-002). */
    OTP_VERIFICATION_SUCCESS,

    /** Verificación OTP fallida — código incorrecto o expirado (US-002). */
    OTP_VERIFICATION_FAILED,

    /** Cuenta bloqueada por exceder el límite de intentos — ADR-002. */
    ACCOUNT_BLOCKED,

    /** Login completado mediante código de recuperación (US-003). */
    LOGIN_RECOVERY_CODE,

    /** Usuario regeneró el conjunto de códigos de recuperación (US-003). */
    RECOVERY_CODES_REGENERATED
}
