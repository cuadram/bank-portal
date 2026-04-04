package com.experis.sofia.bankportal.audit.infrastructure;

import com.experis.sofia.bankportal.audit.domain.AuditLogEntry;
import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/**
 * Implementación JDBC de AuditLogService — persiste en audit_log (FEAT-005).
 * Implementa también session.application.usecase.AuditLogService (alias legacy).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JdbcAuditLogService implements AuditLogService,
        com.experis.sofia.bankportal.session.application.usecase.AuditLogService {

    private final JdbcClient jdbc;

    @Override
    public void record(AuditLogEntry entry) {
        try {
            jdbc.sql("INSERT INTO audit_log (user_id, event_type, ip_address, user_agent, result) " +
                     "VALUES (:userId, :eventType, 'internal', 'system', 'SUCCESS')")
                .param("userId",    entry.userId())
                .param("eventType", entry.eventType())
                .update();
        } catch (Exception e) {
            log.warn("[AuditLog] Failed type={}: {}", entry.eventType(), e.getMessage());
        }
    }
}
