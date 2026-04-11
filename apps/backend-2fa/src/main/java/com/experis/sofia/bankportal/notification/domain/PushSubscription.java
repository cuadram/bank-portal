package com.experis.sofia.bankportal.notification.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Suscripción Web Push VAPID de un dispositivo — FEAT-014.
 *
 * <p>Multi-device: un usuario puede tener hasta 5 suscripciones activas
 * (enforced en {@code ManagePushSubscriptionUseCase}).
 *
 * <p>Limpieza automática: cuando el Push Service devuelve HTTP 410 Gone,
 * {@code WebPushService} elimina la suscripción de esta tabla.
 */
@Entity
@Table(name = "push_subscriptions")
@Getter @Setter @NoArgsConstructor
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /** Endpoint del Push Service del navegador — globalmente único. */
    @Column(name = "endpoint", nullable = false, unique = true, columnDefinition = "TEXT")
    private String endpoint;

    /** Clave pública de cifrado del cliente (Base64 URL-safe). */
    @Column(name = "p256dh", nullable = false, columnDefinition = "TEXT")
    private String p256dh;

    /** Secreto de autenticación del cliente (Base64 URL-safe). */
    @Column(name = "auth", nullable = false, columnDefinition = "TEXT")
    private String auth;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    public PushSubscription(UUID userId, String endpoint, String p256dh,
                            String auth, String userAgent) {
        this.userId    = userId;
        this.endpoint  = endpoint;
        this.p256dh    = p256dh;
        this.auth      = auth;
        this.userAgent = userAgent;
        this.createdAt = Instant.now();
    }
}
