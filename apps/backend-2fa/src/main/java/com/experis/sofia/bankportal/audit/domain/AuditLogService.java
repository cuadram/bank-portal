package com.experis.sofia.bankportal.audit.domain;

import java.util.Map;
import java.util.UUID;

/**
 * Servicio de auditoría — FEAT-005.
 * Registra eventos de seguridad en audit_log inmutable (PCI-DSS 10.2).
 */
public interface AuditLogService {

    /** Registro completo con entrada estructurada. */
    void record(AuditLogEntry entry);

    /** Registro rápido con tipo de evento, userId y detalle en texto. */
    default void log(String eventType, UUID userId, String details) {
        record(AuditLogEntry.builder()
                .userId(userId)
                .eventType(eventType)
                .metadata(Map.of("details", details))
                .build());
    }
}
