package com.experis.sofia.bankportal.session.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad de dominio — dispositivo conocido de un usuario.
 * Se usa para detectar logins desde dispositivos nuevos (US-105).
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
public class KnownDevice {

    private final UUID id;
    private final UUID userId;
    private final String deviceFingerprintHash;
    private final LocalDateTime firstSeen;
    private LocalDateTime lastSeen;

    public KnownDevice(UUID id, UUID userId, String deviceFingerprintHash,
                       LocalDateTime firstSeen, LocalDateTime lastSeen) {
        this.id                    = id;
        this.userId                = userId;
        this.deviceFingerprintHash = deviceFingerprintHash;
        this.firstSeen             = firstSeen;
        this.lastSeen              = lastSeen;
    }

    /** Actualiza el timestamp de última vista al momento actual. */
    public void updateLastSeen() { this.lastSeen = LocalDateTime.now(); }

    public UUID getId()                       { return id; }
    public UUID getUserId()                   { return userId; }
    public String getDeviceFingerprintHash()  { return deviceFingerprintHash; }
    public LocalDateTime getFirstSeen()       { return firstSeen; }
    public LocalDateTime getLastSeen()        { return lastSeen; }
}
