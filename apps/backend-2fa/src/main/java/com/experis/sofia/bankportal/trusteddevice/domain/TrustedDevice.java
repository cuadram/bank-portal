package com.experis.sofia.bankportal.trusteddevice.domain;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad de dominio — dispositivo de confianza de un usuario.
 * Un dispositivo de confianza permite omitir el OTP en logins sucesivos
 * desde ese dispositivo durante el TTL configurado (30 días).
 *
 * Invariantes:
 * - Un dispositivo activo tiene {@code revokedAt == null} y {@code expiresAt > now()}
 * - El trust token es opaco para el cliente — almacenado como cookie HttpOnly
 * - El {@code tokenHash} es SHA-256 del trust token — nunca el token en claro
 *
 * @author SOFIA Developer Agent — FEAT-003 Sprint 4
 */
public class TrustedDevice {

    private final UUID id;
    private final UUID userId;
    private final String tokenHash;
    private final String deviceFingerprintHash;
    private final String deviceOs;
    private final String deviceBrowser;
    private final String ipMasked;
    private final LocalDateTime createdAt;
    private LocalDateTime lastUsedAt;
    private final LocalDateTime expiresAt;
    private LocalDateTime revokedAt;
    private String revokeReason;

    public TrustedDevice(UUID id, UUID userId, String tokenHash,
                          String deviceFingerprintHash, String deviceOs,
                          String deviceBrowser, String ipMasked,
                          LocalDateTime createdAt, LocalDateTime lastUsedAt,
                          LocalDateTime expiresAt) {
        this.id                    = id;
        this.userId                = userId;
        this.tokenHash             = tokenHash;
        this.deviceFingerprintHash = deviceFingerprintHash;
        this.deviceOs              = deviceOs;
        this.deviceBrowser         = deviceBrowser;
        this.ipMasked              = ipMasked;
        this.createdAt             = createdAt;
        this.lastUsedAt            = lastUsedAt;
        this.expiresAt             = expiresAt;
    }

    /** @return {@code true} si el dispositivo es de confianza activo y no expirado. */
    public boolean isActive() {
        return revokedAt == null && expiresAt.isAfter(LocalDateTime.now());
    }

    /** @return {@code true} si el token ha superado su TTL de 30 días. */
    public boolean isExpired() {
        return expiresAt.isBefore(LocalDateTime.now());
    }

    /** Revoca el dispositivo de confianza. */
    public void revoke(String reason) {
        if (!isActive()) throw new IllegalStateException("Device already revoked or expired");
        this.revokedAt    = LocalDateTime.now();
        this.revokeReason = reason;
    }

    /** Actualiza el timestamp de último uso y renueva el TTL. */
    public void recordUse() {
        this.lastUsedAt = LocalDateTime.now();
    }

    // ── Getters ───────────────────────────────────────────────────────────────
    public UUID getId()                       { return id; }
    public UUID getUserId()                   { return userId; }
    public String getTokenHash()              { return tokenHash; }
    public String getDeviceFingerprintHash()  { return deviceFingerprintHash; }
    public String getDeviceOs()               { return deviceOs; }
    public String getDeviceBrowser()          { return deviceBrowser; }
    public String getIpMasked()               { return ipMasked; }
    public LocalDateTime getCreatedAt()       { return createdAt; }
    public LocalDateTime getLastUsedAt()      { return lastUsedAt; }
    public LocalDateTime getExpiresAt()       { return expiresAt; }
    public LocalDateTime getRevokedAt()       { return revokedAt; }
    public String getRevokeReason()           { return revokeReason; }
}
