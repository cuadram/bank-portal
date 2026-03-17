package com.experis.sofia.bankportal.account.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entidad de dominio — Movimiento bancario.
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
public class Transaction {

    private final UUID       id;
    private final UUID       accountId;
    private final Instant    transactionDate;
    private final String     concept;
    private final BigDecimal amount;        // negativo=cargo, positivo=abono
    private final BigDecimal balanceAfter;
    private       String     category;     // asignado lazy por TransactionCategorizationService
    private final Type       type;
    private final Instant    createdAt;

    public enum Type { CARGO, ABONO }

    public Transaction(UUID id, UUID accountId, Instant transactionDate, String concept,
                       BigDecimal amount, BigDecimal balanceAfter, String category,
                       Type type, Instant createdAt) {
        this.id              = id;
        this.accountId       = accountId;
        this.transactionDate = transactionDate;
        this.concept         = concept;
        this.amount          = amount;
        this.balanceAfter    = balanceAfter;
        this.category        = category;
        this.type            = type;
        this.createdAt       = createdAt;
    }

    public void setCategory(String category) { this.category = category; }

    public UUID       getId()              { return id; }
    public UUID       getAccountId()       { return accountId; }
    public Instant    getTransactionDate() { return transactionDate; }
    public String     getConcept()         { return concept; }
    public BigDecimal getAmount()          { return amount; }
    public BigDecimal getBalanceAfter()    { return balanceAfter; }
    public String     getCategory()        { return category; }
    public Type       getType()            { return type; }
    public Instant    getCreatedAt()       { return createdAt; }
}
