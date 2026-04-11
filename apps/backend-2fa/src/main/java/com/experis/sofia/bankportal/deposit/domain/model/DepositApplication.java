package com.experis.sofia.bankportal.deposit.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class DepositApplication {
    private UUID id;
    private UUID userId;
    private BigDecimal importe;
    private int plazoMeses;
    private UUID cuentaOrigenId;
    private RenewalInstruction renovacion;
    private String estado;
    private boolean otpVerified;
    private UUID depositId;
    private Instant createdAt;
    private Instant updatedAt;

    public UUID getId()                       { return id; }
    public UUID getUserId()                   { return userId; }
    public BigDecimal getImporte()            { return importe; }
    public int getPlazoMeses()                { return plazoMeses; }
    public UUID getCuentaOrigenId()           { return cuentaOrigenId; }
    public RenewalInstruction getRenovacion() { return renovacion; }
    public String getEstado()                 { return estado; }
    public boolean isOtpVerified()            { return otpVerified; }
    public UUID getDepositId()                { return depositId; }
    public Instant getCreatedAt()             { return createdAt; }
    public Instant getUpdatedAt()             { return updatedAt; }

    public void setId(UUID id)                           { this.id = id; }
    public void setUserId(UUID u)                        { this.userId = u; }
    public void setImporte(BigDecimal i)                 { this.importe = i; }
    public void setPlazoMeses(int p)                     { this.plazoMeses = p; }
    public void setCuentaOrigenId(UUID c)                { this.cuentaOrigenId = c; }
    public void setRenovacion(RenewalInstruction r)      { this.renovacion = r; }
    public void setEstado(String e)                      { this.estado = e; }
    public void setOtpVerified(boolean o)                { this.otpVerified = o; }
    public void setDepositId(UUID d)                     { this.depositId = d; }
    public void setCreatedAt(Instant t)                  { this.createdAt = t; }
    public void setUpdatedAt(Instant t)                  { this.updatedAt = t; }
}
