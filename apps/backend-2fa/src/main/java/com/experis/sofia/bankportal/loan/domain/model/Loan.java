package com.experis.sofia.bankportal.loan.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class Loan {
    private UUID id;
    private UUID userId;
    private String tipo;
    private BigDecimal importeOriginal;
    private BigDecimal importePendiente;
    private int plazo;
    private BigDecimal tae;
    private BigDecimal cuotaMensual;
    private LoanStatus estado;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Instant createdAt;
    private Instant updatedAt;

    // Constructor
    public Loan() {}

    public Loan(UUID id, UUID userId, String tipo, BigDecimal importeOriginal,
                BigDecimal importePendiente, int plazo, BigDecimal tae,
                BigDecimal cuotaMensual, LoanStatus estado,
                LocalDate fechaInicio, LocalDate fechaFin, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.userId = userId;
        this.tipo = tipo;
        this.importeOriginal = importeOriginal;
        this.importePendiente = importePendiente;
        this.plazo = plazo;
        this.tae = tae;
        this.cuotaMensual = cuotaMensual;
        this.estado = estado;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters
    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getTipo() { return tipo; }
    public BigDecimal getImporteOriginal() { return importeOriginal; }
    public BigDecimal getImportePendiente() { return importePendiente; }
    public int getPlazo() { return plazo; }
    public BigDecimal getTae() { return tae; }
    public BigDecimal getCuotaMensual() { return cuotaMensual; }
    public LoanStatus getEstado() { return estado; }
    public LocalDate getFechaInicio() { return fechaInicio; }
    public LocalDate getFechaFin() { return fechaFin; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
