package com.experis.sofia.bankportal.auth.domain;

import java.time.Instant;
import java.util.UUID;

/** Token de confirmación de contexto — FEAT-006 ADR-011. Compatible no-arg + setters. */
public class ContextConfirmToken {
    private UUID    userId;
    private String  pendingSubnet;
    private String  rawToken;
    private Instant expiresAt;
    private boolean used;

    public ContextConfirmToken() {}

    public ContextConfirmToken(UUID userId, String pendingSubnet, String rawToken, Instant expiresAt) {
        this.userId = userId; this.pendingSubnet = pendingSubnet;
        this.rawToken = rawToken; this.expiresAt = expiresAt;
    }

    public static ContextConfirmToken of(UUID userId, String subnet, String token, Instant exp) {
        return new ContextConfirmToken(userId, subnet, token, exp);
    }

    public UUID    getUserId()              { return userId; }
    public void    setUserId(UUID id)       { this.userId = id; }
    public String  getPendingSubnet()       { return pendingSubnet; }
    public void    setSubnet(String s)      { this.pendingSubnet = s; }
    public void    setPendingSubnet(String s){ this.pendingSubnet = s; }
    public String  getRawToken()            { return rawToken; }
    public void    setRawToken(String t)    { this.rawToken = t; }
    public Instant getExpiresAt()           { return expiresAt; }
    public void    setExpiresAt(Instant t)  { this.expiresAt = t; }
    public boolean isUsed()                 { return used; }
    public void    setUsed(boolean u)       { this.used = u; }
}
