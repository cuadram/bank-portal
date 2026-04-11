package com.experis.sofia.bankportal.auth.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad de dominio — subred conocida confirmada por el usuario (FEAT-006 ADR-011).
 */
public class KnownSubnet {
    private UUID userId;
    private String subnet;
    private Instant confirmedAt;

    private KnownSubnet(UUID userId, String subnet, Instant confirmedAt) {
        this.userId      = userId;
        this.subnet      = subnet;
        this.confirmedAt = confirmedAt;
    }

    public static KnownSubnet of(UUID userId, String subnet) {
        return new KnownSubnet(userId, subnet, Instant.now());
    }

    public UUID    getUserId()      { return userId; }
    public String  getSubnet()      { return subnet; }
    public Instant getConfirmedAt() { return confirmedAt; }
}
