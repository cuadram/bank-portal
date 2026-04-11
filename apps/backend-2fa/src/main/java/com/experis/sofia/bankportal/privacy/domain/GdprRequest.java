package com.experis.sofia.bankportal.privacy.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad JPA — Solicitudes de derechos GDPR (portabilidad, supresión, consentimiento).
 * RN-F019-34: SLA 30 días (GDPR Art.12§3).
 * RN-F019-36: retención 6 años (GDPR Art.17§3b + Ley Contabilidad).
 * RN-F019-37: append-only — no se permiten UPDATE lógicos del histórico.
 * LA-019-13: LocalDateTime para columnas TIMESTAMP sin timezone.
 *
 * @author SOFIA Developer Agent — FEAT-019 Sprint 21
 */
@Entity
@Table(name = "gdpr_requests")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class GdprRequest {

    @Id @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GdprRequestType tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GdprRequestStatus estado;

    private String descripcion;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;  // LA-019-13

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "sla_deadline", nullable = false)
    private LocalDateTime slaDeadline; // created_at + 30 días

    @Column(name = "sla_alert_sent", nullable = false)
    private boolean slaAlertSent;

    @PrePersist
    void prePersist() {
        if (this.createdAt == null)  this.createdAt  = LocalDateTime.now();
        if (this.slaDeadline == null) this.slaDeadline = this.createdAt.plusDays(30);
        if (this.estado == null)     this.estado      = GdprRequestStatus.PENDING;
    }

    @PreUpdate
    void preUpdate() { this.updatedAt = LocalDateTime.now(); }

    /** RN-F019-35: ¿está próximo a vencer el SLA (< 5 días)? */
    public boolean isExpiringSoon() {
        return !slaAlertSent
               && estado != GdprRequestStatus.COMPLETED
               && estado != GdprRequestStatus.REJECTED
               && LocalDateTime.now().isAfter(slaDeadline.minusDays(5));
    }

    public void complete() {
        this.estado = GdprRequestStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
    }

    public void reject(String motivo) {
        this.estado = GdprRequestStatus.REJECTED;
        this.descripcion = motivo;
    }
}
