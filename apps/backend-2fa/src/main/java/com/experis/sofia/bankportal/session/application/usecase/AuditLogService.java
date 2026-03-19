package com.experis.sofia.bankportal.session.application.usecase;

/**
 * Re-export de AuditLogService para compatibilidad de imports heredados de FEAT-001→006.
 * El contrato real vive en com.experis.sofia.bankportal.audit.domain.AuditLogService.
 * @deprecated Usar com.experis.sofia.bankportal.audit.domain.AuditLogService directamente.
 */
public interface AuditLogService
        extends com.experis.sofia.bankportal.audit.domain.AuditLogService {
    // Hereda void record(AuditLogEntry entry)
}
