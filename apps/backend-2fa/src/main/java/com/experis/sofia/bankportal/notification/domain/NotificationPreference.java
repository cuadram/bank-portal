package com.experis.sofia.bankportal.notification.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Preferencias de canal por usuario y tipo de evento — FEAT-014.
 *
 * <p>Si no existe una fila para un (userId, eventType) dado, el {@code NotificationHub}
 * usa defaults (todos los canales activos). Esto evita tener que pre-poblar
 * la tabla para todos los usuarios al darse de alta.
 *
 * <p>Severidad HIGH: el Hub ignora preferencias de email/in-app, siempre entrega.
 * Solo push puede desactivarse para eventos HIGH (decisión ADR-025).
 */
@Entity
@Table(name = "notification_preferences")
@Getter @Setter @NoArgsConstructor
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "event_type", nullable = false, length = 64)
    @Enumerated(EnumType.STRING)
    private NotificationEventType eventType;

    @Column(name = "email_enabled", nullable = false)
    private boolean emailEnabled = true;

    @Column(name = "push_enabled", nullable = false)
    private boolean pushEnabled = true;

    @Column(name = "in_app_enabled", nullable = false)
    private boolean inAppEnabled = true;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    /** Factory — preferencias por defecto (todos los canales activos). */
    public static NotificationPreference defaults(UUID userId, NotificationEventType eventType) {
        var p = new NotificationPreference();
        p.userId        = userId;
        p.eventType     = eventType;
        p.emailEnabled  = true;
        p.pushEnabled   = true;
        p.inAppEnabled  = true;
        p.updatedAt     = Instant.now();
        return p;
    }

    @PreUpdate
    void onUpdate() { this.updatedAt = Instant.now(); }
}
