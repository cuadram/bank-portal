package com.experis.sofia.bankportal.transfer.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad de dominio — Transferencia bancaria (FEAT-008 US-801/802).
 * Invariantes: importe > 0, destino = cuenta propia XOR beneficiario.
 *
 * @author SOFIA Developer Agent — FEAT-008 Sprint 10
 */
public class Transfer {

    private final UUID          id;
    private final UUID          userId;
    private final UUID          sourceAccount;
    private final UUID          targetAccount;   // null para transferencia a beneficiario
    private final UUID          beneficiaryId;   // null para transferencia entre cuentas propias
    private final BigDecimal    amount;
    private final String        concept;
    private TransferStatus      status;
    private LocalDateTime       executedAt;
    private final LocalDateTime createdAt;

    public Transfer(UUID userId, UUID sourceAccount, UUID targetAccount,
                    UUID beneficiaryId, BigDecimal amount, String concept) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("El importe debe ser positivo");
        if (targetAccount == null && beneficiaryId == null)
            throw new IllegalArgumentException("Transferencia sin destino");
        this.id            = UUID.randomUUID();
        this.userId        = userId;
        this.sourceAccount = sourceAccount;
        this.targetAccount = targetAccount;
        this.beneficiaryId = beneficiaryId;
        this.amount        = amount;
        this.concept       = concept;
        this.status        = TransferStatus.PENDING;
        this.createdAt     = LocalDateTime.now();
    }

    public void complete() {
        if (status != TransferStatus.PENDING)
            throw new IllegalStateException("Solo PENDING puede completarse");
        status     = TransferStatus.COMPLETED;
        executedAt = LocalDateTime.now();
    }

    public void fail()   { status = TransferStatus.FAILED; }
    public void cancel() { status = TransferStatus.CANCELLED; }

    public UUID           getId()            { return id; }
    public UUID           getUserId()        { return userId; }
    public UUID           getSourceAccount() { return sourceAccount; }
    public UUID           getTargetAccount() { return targetAccount; }
    public UUID           getBeneficiaryId() { return beneficiaryId; }
    public BigDecimal     getAmount()        { return amount; }
    public String         getConcept()       { return concept; }
    public TransferStatus getStatus()        { return status; }
    public LocalDateTime  getExecutedAt()    { return executedAt; }
    public LocalDateTime  getCreatedAt()     { return createdAt; }
    public boolean        isOwnTransfer()    { return targetAccount != null; }
    public boolean        isCompleted()      { return status == TransferStatus.COMPLETED; }
}
