package com.experis.sofia.bankportal.privacy.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad JPA — Historial inmutable de consentimientos GDPR.
 * RN-F019-16: cada cambio genera registro inmutable (INSERT-only).
 * RN-F019-18: el historial es de solo lectura para el usuario.
 * V22__profile_gdpr.sql crea la tabla.
 * LA-019-13: LocalDateTime para columnas TIMESTAMP sin timezone.
 *
 * @author SOFIA Developer Agent — FEAT-019 Sprint 21
 */
@Entity
@Table(name = "consent_history")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ConsentType tipo;

    @Column(name = "valor_anterior")
    private Boolean valorAnterior;   // null en primera inserción

    @Column(name = "valor_nuevo", nullable = false)
    private boolean valorNuevo;

    @Column(name = "ip_origen", length = 45)
    private String ipOrigen;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt; // LA-019-13: LocalDateTime, no Instant

    @PrePersist
    void prePersist() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }
}
