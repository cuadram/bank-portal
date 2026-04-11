package com.experis.sofia.bankportal.export.repository;

import com.experis.sofia.bankportal.export.domain.ExportAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repositorio JPA para el audit log de exportaciones.
 * FEAT-018 Sprint 20. HOTFIX-S20: creado en paquete correcto.
 */
@Repository
public interface ExportAuditLogRepository extends JpaRepository<ExportAuditLog, UUID> {
}
