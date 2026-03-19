package com.experis.sofia.bankportal.audit.domain;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Entrada de auditoría inmutable — FEAT-005.
 * Builder pattern para construcción fluida.
 */
public record AuditLogEntry(
        UUID userId,
        String eventType,
        Map<String, Object> metadata,
        Instant occurredAt
) {
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private UUID userId;
        private String eventType;
        private Map<String, Object> metadata = Map.of();

        public Builder userId(UUID userId)                   { this.userId = userId; return this; }
        public Builder eventType(String eventType)           { this.eventType = eventType; return this; }
        public Builder metadata(Map<String, Object> m)       { this.metadata = m; return this; }
        public AuditLogEntry build() {
            return new AuditLogEntry(userId, eventType, metadata, Instant.now());
        }
    }
}
