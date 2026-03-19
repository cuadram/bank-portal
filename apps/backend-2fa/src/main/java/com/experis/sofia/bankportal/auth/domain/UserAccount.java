package com.experis.sofia.bankportal.auth.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad de cuenta de usuario con gestión de bloqueo — FEAT-006.
 */
public class UserAccount {
    private UUID id;
    private String email;
    private String accountStatus;   // "ACTIVE" | "LOCKED" | "INACTIVE"
    private int failedOtpAttempts;
    private Instant lockedAt;

    public UserAccount(UUID id, String email, String accountStatus) {
        this.id = id;
        this.email = email;
        this.accountStatus = accountStatus;
    }

    public UUID getId()                        { return id; }
    public String getEmail()                   { return email; }
    public String getAccountStatus()           { return accountStatus; }
    public int getFailedOtpAttempts()          { return failedOtpAttempts; }
    public Instant getLockedAt()               { return lockedAt; }

    public void setAccountStatus(String s)     { this.accountStatus = s; }
    public void setFailedOtpAttempts(int n)    { this.failedOtpAttempts = n; }
    public void setLockedAt(Instant t)         { this.lockedAt = t; }

    public void incrementFailedAttempts()      { this.failedOtpAttempts++; }
    public void resetFailedAttempts()          { this.failedOtpAttempts = 0; }
    public boolean isLocked()                  { return "LOCKED".equals(accountStatus); }
}
