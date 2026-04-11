package com.experis.sofia.bankportal.loan.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class LoanApplication {
    private UUID id;
    private UUID userId;
    private BigDecimal importe;
    private int plazo;
    private LoanPurpose finalidad;
    private LoanStatus estado;
    private Integer scoringResult;
    private boolean otpVerified;
    private Instant createdAt;
    private Instant updatedAt;

    public LoanApplication() {}

    public LoanApplication(UUID id, UUID userId, BigDecimal importe, int plazo,
                           LoanPurpose finalidad, LoanStatus estado,
                           Integer scoringResult, boolean otpVerified,
                           Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.userId = userId;
        this.importe = importe;
        this.plazo = plazo;
        this.finalidad = finalidad;
        this.estado = estado;
        this.scoringResult = scoringResult;
        this.otpVerified = otpVerified;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public BigDecimal getImporte() { return importe; }
    public int getPlazo() { return plazo; }
    public LoanPurpose getFinalidad() { return finalidad; }
    public LoanStatus getEstado() { return estado; }
    public Integer getScoringResult() { return scoringResult; }
    public boolean isOtpVerified() { return otpVerified; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setEstado(LoanStatus estado) { this.estado = estado; }
}
