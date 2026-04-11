package com.experis.sofia.bankportal.auth.domain;

import java.time.Instant;
import java.util.UUID;

/** Token de desbloqueo — FEAT-006 US-602. Compatible con patrón no-arg + setters. */
public class UnlockToken {
    private String  token;
    private UUID    userId;
    private Instant expiresAt;
    private boolean used;

    public UnlockToken() {}

    public UnlockToken(String token, UUID userId, Instant expiresAt) {
        this.token = token; this.userId = userId; this.expiresAt = expiresAt;
    }

    public static UnlockToken of(UUID userId, String rawToken, Instant expiresAt) {
        return new UnlockToken(rawToken, userId, expiresAt);
    }

    public String  getToken()           { return token; }
    public void    setToken(String t)   { this.token = t; }
    public UUID    getUserId()          { return userId; }
    public void    setUserId(UUID id)   { this.userId = id; }
    public Instant getExpiresAt()       { return expiresAt; }
    public void    setExpiresAt(Instant t) { this.expiresAt = t; }
    public boolean isUsed()             { return used; }
    public void    setUsed(boolean u)   { this.used = u; }
    public boolean isExpired()          { return expiresAt != null && Instant.now().isAfter(expiresAt); }
}
