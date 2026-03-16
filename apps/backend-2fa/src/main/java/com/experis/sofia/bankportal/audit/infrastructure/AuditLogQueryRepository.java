package com.experis.sofia.bankportal.audit.infrastructure;

import com.experis.sofia.bankportal.audit.application.SecurityDashboardUseCase.AuditEventSummary;
import com.experis.sofia.bankportal.audit.application.SecurityDashboardUseCase.DailyActivityPoint;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Puerto de lectura sobre {@code audit_log} — solo lectura, nunca escribe.
 * La tabla es inmutable (trigger PostgreSQL desde Flyway V4 / ADR-004).
 *
 * @author SOFIA Developer Agent — FEAT-005 Sprint 6
 */
public interface AuditLogQueryRepository {

    /** US-401: cuenta eventos por tipo en los últimos N días para el usuario. */
    Map<String, Long> countEventsByTypeAndPeriod(UUID userId, int days);

    /** US-401: últimos N eventos del usuario para la tabla "Actividad reciente". */
    List<AuditEventSummary> findRecentByUserId(UUID userId, int limit);

    /** US-401: actividad diaria para el gráfico de barras (N días). */
    List<DailyActivityPoint> findDailyActivityByUserId(UUID userId, int days);

    /** US-402: eventos del usuario en un período para exportación. */
    List<AuditEvent> findByUserIdAndPeriod(UUID userId, int days);

    /** Evento de auditoría minimal — para exportación US-402. */
    record AuditEvent(
            String        eventType,
            String        description,
            String        device,
            String        ipMasked,
            LocalDateTime occurredAt
    ) {}
}
