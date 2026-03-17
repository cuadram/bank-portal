package com.experis.sofia.bankportal.account.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entidad de dominio — Cuenta bancaria del usuario.
 * Sprint 9: poblada desde MockAccountRepositoryAdapter (@Profile "!production").
 * Sprint 10: poblada desde CoreBankingAccountAdapter (@Profile "production").
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
public class Account {

    private final UUID      id;
    private final UUID      userId;
    private final String    alias;
    private final String    iban;
    private final Type      type;
    private final Status    status;
    private final Instant   createdAt;

    private BigDecimal availableBalance;
    private BigDecimal retainedBalance;

    public enum Type   { CORRIENTE, AHORRO, NOMINA }
    public enum Status { ACTIVE, INACTIVE, BLOCKED }

    public Account(UUID id, UUID userId, String alias, String iban,
                   Type type, Status status, Instant createdAt) {
        this.id        = id;
        this.userId    = userId;
        this.alias     = alias;
        this.iban      = iban;
        this.type      = type;
        this.status    = status;
        this.createdAt = createdAt;
    }

    /** IBAN enmascarado: "ES91 **** **** **** 1234" */
    public String getIbanMasked() {
        if (iban == null || iban.length() < 8) return "****";
        String clean = iban.replaceAll("\\s", "");
        return clean.substring(0, 4) + " **** **** **** " + clean.substring(clean.length() - 4);
    }

    public void loadBalance(BigDecimal available, BigDecimal retained) {
        this.availableBalance = available;
        this.retainedBalance  = retained;
    }

    public UUID       getId()                { return id; }
    public UUID       getUserId()            { return userId; }
    public String     getAlias()             { return alias; }
    public String     getIban()              { return iban; }
    public Type       getType()              { return type; }
    public Status     getStatus()            { return status; }
    public Instant    getCreatedAt()         { return createdAt; }
    public BigDecimal getAvailableBalance()  { return availableBalance; }
    public BigDecimal getRetainedBalance()   { return retainedBalance; }
    public boolean    isActive()             { return status == Status.ACTIVE; }
}
