package com.experis.sofia.bankportal.auth.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Cuenta de usuario — FEAT-006.
 * Compatible con patrón no-arg + setters de los tests.
 * Ampliada en Sprint 14/15: passwordHash, totpEnabled, createdAt.
 */
public class UserAccount {
    private UUID    id;
    private String  email;
    private String  accountStatus = "ACTIVE";
    private int     failedOtpAttempts;
    private Instant lockedAt;
    private String  passwordHash;
    private boolean totpEnabled;
    private Instant createdAt;

    public UserAccount() {}

    public UserAccount(UUID id, String email, String accountStatus) {
        this.id = id; this.email = email; this.accountStatus = accountStatus;
    }

    public UUID    getId()                          { return id; }
    public void    setId(UUID id)                   { this.id = id; }
    public String  getEmail()                       { return email; }
    public void    setEmail(String e)               { this.email = e; }
    public String  getAccountStatus()               { return accountStatus; }
    public void    setAccountStatus(String s)       { this.accountStatus = s; }
    public int     getFailedOtpAttempts()           { return failedOtpAttempts; }
    public void    setFailedOtpAttempts(int n)      { this.failedOtpAttempts = n; }
    public Instant getLockedAt()                    { return lockedAt; }
    public void    setLockedAt(Instant t)           { this.lockedAt = t; }
    public boolean isLocked()                       { return "LOCKED".equals(accountStatus); }
    public void    incrementFailedAttempts()        { this.failedOtpAttempts++; }
    public void    resetFailedAttempts()            { this.failedOtpAttempts = 0; }

    // Sprint 14/15 — profile use cases
    public String  getPasswordHash()                { return passwordHash; }
    public void    setPasswordHash(String h)        { this.passwordHash = h; }
    public boolean isTotpEnabled()                  { return totpEnabled; }
    public void    setTotpEnabled(boolean b)        { this.totpEnabled = b; }
    public Instant getCreatedAt()                   { return createdAt; }
    public void    setCreatedAt(Instant t)          { this.createdAt = t; }
}
