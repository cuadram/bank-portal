package com.experis.sofia.bankportal.notification.domain;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Entidad de dominio — notificación de seguridad del usuario.
 * Representa un evento de seguridad relevante (login, sesión revocada,
 * dispositivo añadido...) que el usuario puede consultar y marcar como leído.
 *
 * Invariantes:
 * - Una notificación no puede "desmarcarse" como leída una vez leída
 * - La expiración es 90 días desde creación — no modificable
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 5
 */
public class UserNotification {

    private final UUID   id;
    private final UUID   userId;
    private final String eventType;   // LOGIN_NEW_DEVICE, SESSION_REVOKED, TRUSTED_DEVICE_CREATED...
    private final String title;
    private final String body;
    private final Map<String, String> metadata;  // device, ip, sessionId, etc.
    private final String actionUrl;   // deep-link al recurso relacionado
    private final LocalDateTime createdAt;
    private final LocalDateTime expiresAt;
    private boolean read;

    public UserNotification(UUID id, UUID userId, String eventType, String title,
                            String body, Map<String, String> metadata, String actionUrl,
                            LocalDateTime createdAt) {
        this.id         = id;
        this.userId     = userId;
        this.eventType  = eventType;
        this.title      = title;
        this.body       = body;
        this.metadata   = metadata;
        this.actionUrl  = actionUrl;
        this.createdAt  = createdAt;
        this.expiresAt  = createdAt.plusDays(90);
        this.read       = false;
    }

    /** Marca la notificación como leída — operación idempotente. */
    public void markAsRead() {
        this.read = true;
    }

    /** @return {@code true} si la notificación no ha expirado. */
    public boolean isActive() {
        return expiresAt.isAfter(LocalDateTime.now());
    }

    // ── Getters ───────────────────────────────────────────────────────────────
    public UUID   getId()                    { return id; }
    public UUID   getUserId()                { return userId; }
    public String getEventType()             { return eventType; }
    public String getTitle()                 { return title; }
    public String getBody()                  { return body; }
    public Map<String, String> getMetadata() { return metadata; }
    public String getActionUrl()             { return actionUrl; }
    public LocalDateTime getCreatedAt()      { return createdAt; }
    public LocalDateTime getExpiresAt()      { return expiresAt; }
    public boolean isRead()                  { return read; }
}
