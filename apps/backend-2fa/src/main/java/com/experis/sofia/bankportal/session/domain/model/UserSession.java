package com.experis.sofia.bankportal.session.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad de dominio — sesión activa de un usuario.
 *
 * <p>Invariantes:
 * <ul>
 *   <li>Activa → {@code revokedAt == null}</li>
 *   <li>Revocada → {@code revokedAt != null} y {@code revokeReason != null}</li>
 *   <li>{@code jti} identifica unívocamente el JWT asociado</li>
 * </ul>
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
public class UserSession {

    private final UUID id;
    private final UUID userId;
    private final String jti;
    private final String tokenHash;
    private final DeviceInfo deviceInfo;
    private final String ipMasked;
    private final LocalDateTime createdAt;
    private LocalDateTime lastActivity;
    private LocalDateTime revokedAt;
    private SessionRevocationReason revokeReason;

    public UserSession(UUID id, UUID userId, String jti, String tokenHash,
                       DeviceInfo deviceInfo, String ipMasked,
                       LocalDateTime createdAt, LocalDateTime lastActivity) {
        this.id           = id;
        this.userId       = userId;
        this.jti          = jti;
        this.tokenHash    = tokenHash;
        this.deviceInfo   = deviceInfo;
        this.ipMasked     = ipMasked;
        this.createdAt    = createdAt;
        this.lastActivity = lastActivity;
    }

    /** @return {@code true} si la sesión no ha sido revocada */
    public boolean isActive() { return revokedAt == null; }

    /**
     * Indica si la sesión superó el timeout de inactividad configurado por el usuario.
     *
     * @param timeoutMinutes minutos de inactividad máximos
     * @return {@code true} si debe considerarse expirada
     */
    public boolean isExpiredByInactivity(int timeoutMinutes) {
        return lastActivity.plusMinutes(timeoutMinutes).isBefore(LocalDateTime.now());
    }

    /**
     * Revoca esta sesión.
     *
     * @param reason motivo de revocación
     * @throws IllegalStateException si ya está revocada
     */
    public void revoke(SessionRevocationReason reason) {
        if (!isActive()) {
            throw new IllegalStateException("Cannot revoke already revoked session: " + id);
        }
        this.revokedAt    = LocalDateTime.now();
        this.revokeReason = reason;
    }

    /** Registra actividad en el momento actual. */
    public void updateActivity() { this.lastActivity = LocalDateTime.now(); }

    // ── Getters ───────────────────────────────────────────────────────────────
    public UUID getId()                                   { return id; }
    public UUID getUserId()                               { return userId; }
    public String getJti()                                { return jti; }
    public String getTokenHash()                          { return tokenHash; }
    public DeviceInfo getDeviceInfo()                     { return deviceInfo; }
    public String getIpMasked()                           { return ipMasked; }
    public LocalDateTime getCreatedAt()                   { return createdAt; }
    public LocalDateTime getLastActivity()                { return lastActivity; }
    public LocalDateTime getRevokedAt()                   { return revokedAt; }
    public SessionRevocationReason getRevokeReason()      { return revokeReason; }
}
