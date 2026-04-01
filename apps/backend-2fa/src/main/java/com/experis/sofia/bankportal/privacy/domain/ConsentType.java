package com.experis.sofia.bankportal.privacy.domain;

/**
 * Categorías de consentimiento GDPR Art.7.
 * RN-F019-15: SECURITY no es toggleable — protegida por ConsentManagementService.
 *
 * @author SOFIA Developer Agent — FEAT-019 Sprint 21
 */
public enum ConsentType {
    MARKETING,
    ANALYTICS,
    COMMUNICATIONS,
    SECURITY;

    /**
     * RN-F019-15: solo SECURITY no puede ser desactivada por el usuario.
     */
    public boolean isToggleable() {
        return this != SECURITY;
    }
}
