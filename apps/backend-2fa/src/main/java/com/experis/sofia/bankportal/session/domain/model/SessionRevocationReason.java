package com.experis.sofia.bankportal.session.domain.model;

/**
 * Enum de causas de revocación de sesión — auditables en {@code audit_log}.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
public enum SessionRevocationReason {
    /** El usuario cerró la sesión manualmente con confirmación OTP. */
    MANUAL,
    /** Evicción LRU por superación del límite de sesiones concurrentes. */
    SESSION_EVICTED,
    /** Timeout de inactividad superado. */
    TIMEOUT,
    /** El usuario usó el enlace "No fui yo" del email de alerta. */
    DENY_LINK,
    /** Revocación administrativa. */
    ADMIN
}
