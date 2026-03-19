package com.experis.sofia.bankportal.auth.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Token de confirmación de contexto nuevo — FEAT-006 ADR-011.
 * JWT scope=context-pending con TTL 15 min.
 */
public class ContextConfirmToken {
    private UUID    userId;
    private String  pendingSubnet;
    private String  rawToken;
    private Instant expiresAt;
    private boolean used;

    private ContextConfirmToken(UUID userId, String pendingSubnet,
                                 String rawToken, Instant expiresAt) {
        this.userId        = userId;
        this.pendingSubnet = pendingSubnet;
        this.rawToken      = rawToken;
        this.expiresAt     = expiresAt;
        this.used          = false;
    }

    public static ContextConfirmToken of(UUID userId, String pendingSubnet,
                                          String rawToken, Instant expiresAt) {
        return new ContextConfirmToken(userId, pendingSubnet, rawToken, expiresAt);
    }

    public UUID    getUserId()       { return userId; }
    public String  getPendingSubnet(){ return pendingSubnet; }
    public String  getRawToken()     { return rawToken; }
    public Instant getExpiresAt()    { return expiresAt; }
    public boolean isUsed()          { return used; }
    public void    setUsed(boolean u){ this.used = u; }
}
