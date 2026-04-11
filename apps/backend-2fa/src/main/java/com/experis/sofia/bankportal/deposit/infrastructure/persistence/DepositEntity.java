package com.experis.sofia.bankportal.deposit.infrastructure.persistence;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "deposits")
public class DepositEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal importe;

    @Column(name = "plazo_meses", nullable = false)
    private int plazoMeses;

    @Column(nullable = false, precision = 10, scale = 6)
    private BigDecimal tin;

    @Column(nullable = false, precision = 10, scale = 6)
    private BigDecimal tae;

    @Column(nullable = false, length = 20)
    private String estado;

    @Column(nullable = false, length = 30)
    private String renovacion;

    @Column(name = "cuenta_origen_id", nullable = false)
    private UUID cuentaOrigenId;

    @Column(name = "fecha_apertura", nullable = false)
    private LocalDate fechaApertura;

    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;

    @Column(precision = 15, scale = 2)
    private BigDecimal penalizacion;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() { createdAt = updatedAt = Instant.now(); }

    @PreUpdate
    void preUpdate() { updatedAt = Instant.now(); }

    public UUID getId()                   { return id; }
    public UUID getUserId()               { return userId; }
    public BigDecimal getImporte()        { return importe; }
    public int getPlazoMeses()            { return plazoMeses; }
    public BigDecimal getTin()            { return tin; }
    public BigDecimal getTae()            { return tae; }
    public String getEstado()             { return estado; }
    public String getRenovacion()         { return renovacion; }
    public UUID getCuentaOrigenId()       { return cuentaOrigenId; }
    public LocalDate getFechaApertura()   { return fechaApertura; }
    public LocalDate getFechaVencimiento(){ return fechaVencimiento; }
    public BigDecimal getPenalizacion()   { return penalizacion; }
    public Instant getCreatedAt()         { return createdAt; }
    public Instant getUpdatedAt()         { return updatedAt; }

    public void setId(UUID id)                          { this.id = id; }
    public void setUserId(UUID u)                       { this.userId = u; }
    public void setImporte(BigDecimal i)                { this.importe = i; }
    public void setPlazoMeses(int p)                    { this.plazoMeses = p; }
    public void setTin(BigDecimal t)                    { this.tin = t; }
    public void setTae(BigDecimal t)                    { this.tae = t; }
    public void setEstado(String e)                     { this.estado = e; }
    public void setRenovacion(String r)                 { this.renovacion = r; }
    public void setCuentaOrigenId(UUID c)               { this.cuentaOrigenId = c; }
    public void setFechaApertura(LocalDate d)           { this.fechaApertura = d; }
    public void setFechaVencimiento(LocalDate d)        { this.fechaVencimiento = d; }
    public void setPenalizacion(BigDecimal p)           { this.penalizacion = p; }
    public void setCreatedAt(Instant t)                 { this.createdAt = t; }
    public void setUpdatedAt(Instant t)                 { this.updatedAt = t; }
}
