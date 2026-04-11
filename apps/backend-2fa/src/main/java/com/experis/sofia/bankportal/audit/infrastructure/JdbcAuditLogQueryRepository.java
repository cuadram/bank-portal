package com.experis.sofia.bankportal.audit.infrastructure;

import com.experis.sofia.bankportal.audit.application.SecurityDashboardUseCase.AuditEventSummary;
import com.experis.sofia.bankportal.audit.application.SecurityDashboardUseCase.DailyActivityPoint;
import org.springframework.stereotype.Repository;
import java.util.*;

/**
 * Stub de AuditLogQueryRepository para STG — devuelve colecciones vacías.
 * La implementación real (JPA) se activa en producción. FEAT-005.
 */
@Repository
public class JdbcAuditLogQueryRepository implements AuditLogQueryRepository {

    @Override
    public Map<String, Long> countEventsByTypeAndPeriod(UUID userId, int days) {
        return Map.of();
    }

    @Override
    public List<AuditEventSummary> findRecentByUserId(UUID userId, int limit) {
        return List.of();
    }

    @Override
    public List<DailyActivityPoint> findDailyActivityByUserId(UUID userId, int days) {
        return List.of();
    }

    @Override
    public List<AuditLogQueryRepository.AuditEvent> findByUserIdAndPeriod(UUID userId, int days) {
        return List.of();
    }
}
