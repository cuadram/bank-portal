package com.experis.sofia.bankportal.notification.domain;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Entidad de dominio — notificación de seguridad del usuario (FEAT-004 Sprint 5).
 */
public class UserNotification {

    private final UUID   id;
    private final UUID   userId;
    private final String eventType;
    private final String title;
    private final String body;
    private final Map<String, String> metadata;
    private final String actionUrl;
    private final LocalDateTime createdAt;
    private final LocalDateTime expiresAt;
    private boolean read;
    // Sprint 7/8 extensions
    private Instant  readAt;
    private String   contextId;        // sessionId, deviceId — para deep-link de acción
    private String   ipSubnet;         // subnet de origen del evento
    private boolean  unusualLocation;  // true si subnet no estaba en known_subnets

    public UserNotification(UUID id, UUID userId, String eventType, String title,
                            String body, Map<String, String> metadata, String actionUrl,
                            LocalDateTime createdAt) {
        this.id        = id;
        this.userId    = userId;
        this.eventType = eventType;
        this.title     = title;
        this.body      = body;
        this.metadata  = metadata;
        this.actionUrl = actionUrl;
        this.createdAt = createdAt;
        this.expiresAt = createdAt.plusDays(90);
        this.read      = false;
    }

    public void markAsRead() { this.read = true; this.readAt = Instant.now(); }
    public boolean isActive() { return expiresAt.isAfter(LocalDateTime.now()); }

    // Getters
    public UUID               getId()              { return id; }
    public UUID               getUserId()          { return userId; }
    public String             getEventType()       { return eventType; }
    public String             getTitle()           { return title; }
    public String             getBody()            { return body; }
    public Map<String,String> getMetadata()        { return metadata; }
    public String             getActionUrl()       { return actionUrl; }
    public LocalDateTime      getCreatedAt()       { return createdAt; }
    public LocalDateTime      getExpiresAt()       { return expiresAt; }
    public boolean            isRead()             { return read; }
    public Instant            getReadAt()          { return readAt; }
    public void               setReadAt(Instant t) { this.readAt = t; this.read = true; }
    public String             getContextId()       { return contextId; }
    public void               setContextId(String id)     { this.contextId = id; }
    public String             getIpSubnet()        { return ipSubnet; }
    public void               setIpSubnet(String ip)      { this.ipSubnet = ip; }
    public boolean            isUnusualLocation()  { return unusualLocation; }
    public void               setUnusualLocation(boolean u){ this.unusualLocation = u; }
}
