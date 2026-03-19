package com.experis.sofia.bankportal.audit.application;

import com.experis.sofia.bankportal.audit.infrastructure.AuditLogQueryRepository;
import com.experis.sofia.bankportal.notification.domain.UserNotificationRepository;
import com.experis.sofia.bankportal.session.domain.repository.UserSessionRepository;
import com.experis.sofia.bankportal.trusteddevice.domain.TrustedDeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Caso de uso US-401 — Dashboard de seguridad del usuario.
 *
 * <p>DEBT-008 (Sprint 7): consultas paralelas con {@code CompletableFuture.allOf()}.
 * Latencia objetivo: ≈ max(query individual) ≈ 12ms vs ~45ms secuencial (mejora ~4×).
 *
 * <p>Nota sobre @Transactional: la anotación cubre el thread del caller pero NO los
 * threads del executor. Las 6 queries son lecturas independientes — cada repositorio
 * abre su propia conexión del pool. Correcto para readOnly sin coordinación transaccional.
 *
 * @author SOFIA Developer Agent — FEAT-005 Sprint 6 · DEBT-008 Sprint 7
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityDashboardUseCase {

    private final AuditLogQueryRepository    auditRepo;
    private final UserSessionRepository      sessionRepo;
    private final TrustedDeviceRepository    deviceRepo;
    private final UserNotificationRepository notifRepo;
    private final Executor                   dashboardExecutor;

    private static final int  DASHBOARD_DAYS   = 30;
    private static final int  RECENT_LIMIT     = 10;
    private static final int  FAILED_THRESHOLD = 3;
    private static final long QUERY_TIMEOUT_S  = 5L;

    /**
     * Genera el resumen de seguridad del usuario con consultas paralelas.
     *
     * @param userId      ID del usuario autenticado
     * @param twoFaActive estado del 2FA extraído del claim JWT {@code twoFaEnabled} (ACT-30)
     */
    @Transactional(readOnly = true)
    public SecurityDashboardResponse execute(UUID userId, boolean twoFaActive) {

        // Lanzar las 6 consultas en paralelo — DEBT-008
        var fCounts  = CompletableFuture.supplyAsync(
                () -> auditRepo.countEventsByTypeAndPeriod(userId, DASHBOARD_DAYS), dashboardExecutor);
        var fSession = CompletableFuture.supplyAsync(
                () -> sessionRepo.countActiveByUserId(userId), dashboardExecutor);
        var fDevices = CompletableFuture.supplyAsync(
                () -> deviceRepo.countActiveByUserId(userId), dashboardExecutor);
        var fNotifs  = CompletableFuture.supplyAsync(
                () -> notifRepo.countUnreadByUserId(userId), dashboardExecutor);
        var fRecent  = CompletableFuture.supplyAsync(
                () -> auditRepo.findRecentByUserId(userId, RECENT_LIMIT), dashboardExecutor);
        var fChart   = CompletableFuture.supplyAsync(
                () -> auditRepo.findDailyActivityByUserId(userId, DASHBOARD_DAYS), dashboardExecutor);

        // Esperar a todas con timeout de seguridad
        try {
            CompletableFuture.allOf(fCounts, fSession, fDevices, fNotifs, fRecent, fChart)
                    .get(QUERY_TIMEOUT_S, TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            log.warn("Dashboard query timeout for userId={}", userId);
            throw new IllegalStateException("Dashboard query timeout", e);
        } catch (Exception e) {
            log.error("Dashboard query failed for userId={}: {}", userId, e.getMessage());
            throw new IllegalStateException("Dashboard query failed", e);
        }

        // Ensamblar resultado
        Map<String, Long> counts        = fCounts.join();
        int  activeSessions             = fSession.join();
        int  trustedDevices             = fDevices.join();
        long unreadNotifs               = fNotifs.join();
        List<AuditEventSummary> recent  = fRecent.join();
        List<DailyActivityPoint> chart  = fChart.join();

        long failedAttempts = counts.getOrDefault("LOGIN_FAILED", 0L);
        long loginCount     = counts.getOrDefault("LOGIN_SUCCESS", 0L)
                            + counts.getOrDefault("TRUSTED_DEVICE_LOGIN", 0L);

        String score = computeSecurityScore(twoFaActive, failedAttempts, activeSessions);

        log.debug("Dashboard assembled for userId={} score={}", userId, score);

        return new SecurityDashboardResponse(
                (int) loginCount, (int) failedAttempts,
                activeSessions, trustedDevices, unreadNotifs,
                score, recent, chart
        );
    }

    /**
     * US-604 — Historial de cambios de configuración de seguridad del usuario.
     *
     * @param userId ID del usuario
     * @param days   período en días (default 90)
     */
    @Transactional(readOnly = true)
    public List<AuditEventSummary> getConfigHistory(UUID userId, int days) {
        // Adaptar ConfigHistoryEntry → AuditEventSummary
        return auditRepo.findConfigChangesByUserId(userId, Math.min(days, 90)).stream()
                .map(e -> new AuditEventSummary(
                        e.eventType(),
                        e.eventDescription(),
                        e.ipSubnet(),
                        e.occurredAt().atZone(java.time.ZoneOffset.UTC).toLocalDateTime(),
                        e.unusualLocation()))
                .toList();
    }

    // ── SecurityScore ─────────────────────────────────────────────────────────

    private String computeSecurityScore(boolean twoFaActive, long failedAttempts,
                                         int activeSessions) {
        if (!twoFaActive)                       return "ALERT";
        if (failedAttempts >= FAILED_THRESHOLD) return "REVIEW";
        if (activeSessions > 3)                 return "REVIEW";
        return "SECURE";
    }

    // ── Response records ──────────────────────────────────────────────────────

    public record SecurityDashboardResponse(
            int  loginCount30d,
            int  failedAttempts30d,
            int  activeSessions,
            int  trustedDevices,
            long unreadNotifications,
            String securityScore,
            List<AuditEventSummary> recentEvents,
            List<DailyActivityPoint> activityChart
    ) {}

    public record AuditEventSummary(
            String    eventType,
            String    description,
            String    ipMasked,
            java.time.LocalDateTime occurredAt,
            boolean   unusualLocation   // US-604: true si subnet no está en known_subnets
    ) {}

    public record DailyActivityPoint(
            LocalDate date,
            int       count
    ) {}
}
