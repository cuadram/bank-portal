package com.experis.sofia.bankportal.auth.domain;

import java.time.Instant;
import java.util.UUID;

/** Cuenta de usuario — FEAT-006. Compatible con patrón no-arg + setters de los tests. */
public class UserAccount {
    private UUID    id;
    private String  email;
    private String  accountStatus = "ACTIVE";
    private int     failedOtpAttempts;
    private Instant lockedAt;

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
}
