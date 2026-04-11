package com.experis.sofia.bankportal.loan.infrastructure.persistence;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "loans")
public class LoanEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(name = "importe_original", nullable = false, precision = 15, scale = 2)
    private BigDecimal importeOriginal;

    @Column(name = "importe_pendiente", nullable = false, precision = 15, scale = 2)
    private BigDecimal importePendiente;

    @Column(nullable = false)
    private int plazo;

    @Column(nullable = false, precision = 10, scale = 6)
    private BigDecimal tae;

    @Column(name = "cuota_mensual", nullable = false, precision = 15, scale = 2)
    private BigDecimal cuotaMensual;

    @Column(nullable = false, length = 20)
    private String estado;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = Instant.now(); }

    // Getters & Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public BigDecimal getImporteOriginal() { return importeOriginal; }
    public void setImporteOriginal(BigDecimal v) { this.importeOriginal = v; }
    public BigDecimal getImportePendiente() { return importePendiente; }
    public void setImportePendiente(BigDecimal v) { this.importePendiente = v; }
    public int getPlazo() { return plazo; }
    public void setPlazo(int plazo) { this.plazo = plazo; }
    public BigDecimal getTae() { return tae; }
    public void setTae(BigDecimal tae) { this.tae = tae; }
    public BigDecimal getCuotaMensual() { return cuotaMensual; }
    public void setCuotaMensual(BigDecimal v) { this.cuotaMensual = v; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate v) { this.fechaInicio = v; }
    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate v) { this.fechaFin = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant v) { this.createdAt = v; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant v) { this.updatedAt = v; }
}
