package com.experis.sofia.bankportal.auth.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Token de desbloqueo de cuenta — FEAT-006 US-602.
 * HMAC-SHA256 one-time use con TTL 1h (ADR-007).
 */
public class UnlockToken {
    private String  token;
    private UUID    userId;
    private Instant expiresAt;
    private boolean used;

    private UnlockToken(String token, UUID userId, Instant expiresAt) {
        this.token     = token;
        this.userId    = userId;
        this.expiresAt = expiresAt;
        this.used      = false;
    }

    /** Factory method usado por AccountUnlockUseCase. */
    public static UnlockToken of(UUID userId, String rawToken, Instant expiresAt) {
        return new UnlockToken(rawToken, userId, expiresAt);
    }

    public String  getToken()        { return token; }
    public UUID    getUserId()       { return userId; }
    public Instant getExpiresAt()    { return expiresAt; }
    public boolean isUsed()          { return used; }
    public void    setUsed(boolean u){ this.used = u; }
    public boolean isExpired()       { return Instant.now().isAfter(expiresAt); }
}
