package com.experis.sofia.bankportal.notification.domain;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;

/** Notificación de seguridad — FEAT-004. Compatible con patrón no-arg + setters. */
public class UserNotification {

    private UUID   id;
    private UUID   userId;
    private String eventType;
    private String title;
    private String body;
    private Map<String, String> metadata = Map.of();
    private String actionUrl;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime expiresAt;
    private boolean read;
    private Instant  readAt;
    private String   contextId;
    private String   ipSubnet;
    private boolean  unusualLocation;

    public UserNotification() { this.expiresAt = LocalDateTime.now().plusDays(90); }

    public UserNotification(UUID id, UUID userId, String eventType, String title,
                            String body, Map<String, String> metadata, String actionUrl,
                            LocalDateTime createdAt) {
        this.id = id; this.userId = userId; this.eventType = eventType;
        this.title = title; this.body = body; this.metadata = metadata;
        this.actionUrl = actionUrl; this.createdAt = createdAt;
        this.expiresAt = createdAt.plusDays(90);
    }

    public void markAsRead() { this.read = true; this.readAt = Instant.now(); }
    public boolean isActive() { return expiresAt != null && expiresAt.isAfter(LocalDateTime.now()); }

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
    public String             getContextId()       { return contextId; }
    public String             getIpSubnet()        { return ipSubnet; }
    public boolean            isUnusualLocation()  { return unusualLocation; }

    // Setters
    public void setId(UUID id)                       { this.id = id; }
    public void setUserId(UUID userId)               { this.userId = userId; }
    public void setEventType(String eventType)       { this.eventType = eventType; }
    public void setTitle(String title)               { this.title = title; }
    public void setBody(String body)                 { this.body = body; }
    public void setMetadata(Map<String,String> m)    { this.metadata = m; }
    public void setActionUrl(String url)             { this.actionUrl = url; }
    public void setCreatedAt(LocalDateTime t)        { this.createdAt = t; if (t != null) this.expiresAt = t.plusDays(90); }
    public void setCreatedAt(Instant t)              { setCreatedAt(t != null ? LocalDateTime.ofInstant(t, ZoneOffset.UTC) : null); }
    public void setReadAt(Instant t)                 { this.readAt = t; this.read = true; }
    public void setContextId(String id)              { this.contextId = id; }
    public void setIpSubnet(String ip)               { this.ipSubnet = ip; }
    public void setUnusualLocation(boolean u)        { this.unusualLocation = u; }
}
