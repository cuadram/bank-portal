package com.experis.sofia.bankportal.export.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Entidad JPA — registro de auditoría de exportaciones.
 * RN-F018-12: retención 7 años (GDPR Art.17§3b, PCI-DSS Req.10.7).
 * V21__export_audit_log.sql crea la tabla.
 * HOTFIX-S20: paquete corregido; OffsetDateTime (LA-019-13).
 */
@Entity
@Table(name = "export_audit_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExportAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "timestamp_utc", nullable = false)
    private OffsetDateTime timestampUtc;

    @Column(name = "iban", nullable = false)
    private String iban;

    @Column(name = "fecha_desde", nullable = false)
    private LocalDate fechaDesde;

    @Column(name = "fecha_hasta", nullable = false)
    private LocalDate fechaHasta;

    @Column(name = "tipo_movimiento")
    private String tipoMovimiento;

    @Enumerated(EnumType.STRING)
    @Column(name = "formato", nullable = false)
    private ExportFormat formato;

    @Column(name = "num_registros", nullable = false)
    private int numRegistros;

    @Column(name = "ip_origen", length = 45)
    private String ipOrigen;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "hash_sha256", length = 64)
    private String hashSha256;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (timestampUtc == null) timestampUtc = OffsetDateTime.now();
        if (createdAt == null)    createdAt    = OffsetDateTime.now();
    }
}
