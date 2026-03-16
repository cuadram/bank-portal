package com.experis.sofia.bankportal.notification.domain;

/**
 * Tipos de evento de seguridad que generan notificaciones visibles al usuario.
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 5
 */
public enum SecurityEventType {

    // ── Login / Autenticación ─────────────────────────────────────────────────
    LOGIN_NEW_DEVICE("Nuevo acceso detectado", true),
    LOGIN_FAILED_ATTEMPTS("Intentos fallidos detectados", true),
    TRUSTED_DEVICE_LOGIN("Acceso desde dispositivo de confianza", false),

    // ── Sesiones ──────────────────────────────────────────────────────────────
    SESSION_REVOKED("Sesión cerrada remotamente", false),
    SESSION_REVOKED_ALL("Todas las demás sesiones cerradas", false),
    SESSION_EVICTED("Sesión cerrada automáticamente (límite alcanzado)", false),
    SESSION_DENIED_BY_USER("Sesión denegada desde email", true),

    // ── Dispositivos de confianza ─────────────────────────────────────────────
    TRUSTED_DEVICE_CREATED("Dispositivo de confianza añadido", false),
    TRUSTED_DEVICE_REVOKED("Dispositivo de confianza eliminado", false),
    TRUSTED_DEVICE_REVOKE_ALL("Todos los dispositivos de confianza eliminados", false),

    // ── 2FA ───────────────────────────────────────────────────────────────────
    TWO_FA_ACTIVATED("2FA activado en tu cuenta", false),
    TWO_FA_DEACTIVATED("2FA desactivado en tu cuenta", true);

    private final String displayTitle;
    private final boolean critical;   // los eventos críticos se muestran como toast SSE

    SecurityEventType(String displayTitle, boolean critical) {
        this.displayTitle = displayTitle;
        this.critical     = critical;
    }

    public String getDisplayTitle() { return displayTitle; }
    public boolean isCritical()     { return critical; }
}
