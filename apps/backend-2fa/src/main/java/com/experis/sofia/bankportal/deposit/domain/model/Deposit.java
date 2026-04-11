package com.experis.sofia.bankportal.deposit.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Entidad de dominio — Depósito a Plazo Fijo.
 * FEAT-021 Sprint 23 · Banco Meridian
 */
public class Deposit {
    private UUID id;
    private UUID userId;
    private BigDecimal importe;
    private int plazoMeses;
    private BigDecimal tin;
    private BigDecimal tae;
    private DepositStatus estado;
    private RenewalInstruction renovacion;
    private UUID cuentaOrigenId;
    private LocalDate fechaApertura;
    private LocalDate fechaVencimiento;
    private BigDecimal penalizacion;
    private Instant createdAt;
    private Instant updatedAt;

    public Deposit() {}

    public UUID getId()                       { return id; }
    public UUID getUserId()                   { return userId; }
    public BigDecimal getImporte()            { return importe; }
    public int getPlazoMeses()                { return plazoMeses; }
    public BigDecimal getTin()                { return tin; }
    public BigDecimal getTae()                { return tae; }
    public DepositStatus getEstado()          { return estado; }
    public RenewalInstruction getRenovacion() { return renovacion; }
    public UUID getCuentaOrigenId()           { return cuentaOrigenId; }
    public LocalDate getFechaApertura()       { return fechaApertura; }
    public LocalDate getFechaVencimiento()    { return fechaVencimiento; }
    public BigDecimal getPenalizacion()       { return penalizacion; }
    public Instant getCreatedAt()             { return createdAt; }
    public Instant getUpdatedAt()             { return updatedAt; }

    public void setId(UUID id)                           { this.id = id; }
    public void setUserId(UUID userId)                   { this.userId = userId; }
    public void setImporte(BigDecimal importe)           { this.importe = importe; }
    public void setPlazoMeses(int plazoMeses)            { this.plazoMeses = plazoMeses; }
    public void setTin(BigDecimal tin)                   { this.tin = tin; }
    public void setTae(BigDecimal tae)                   { this.tae = tae; }
    public void setEstado(DepositStatus estado)          { this.estado = estado; }
    public void setRenovacion(RenewalInstruction r)      { this.renovacion = r; }
    public void setCuentaOrigenId(UUID id)               { this.cuentaOrigenId = id; }
    public void setFechaApertura(LocalDate d)            { this.fechaApertura = d; }
    public void setFechaVencimiento(LocalDate d)         { this.fechaVencimiento = d; }
    public void setPenalizacion(BigDecimal p)            { this.penalizacion = p; }
    public void setCreatedAt(Instant t)                  { this.createdAt = t; }
    public void setUpdatedAt(Instant t)                  { this.updatedAt = t; }
}
