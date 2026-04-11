package com.experis.sofia.bankportal.notification.infrastructure;

import com.experis.sofia.bankportal.notification.domain.UserNotificationRepository;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * DEBT-012 — Purga automática de notificaciones con más de 90 días.
 *
 * <p>Ejecuta a las 02:00 UTC cada día. Idempotente: sin filas → log "0 purgadas",
 * sin fallo. Misma cuenta de 90 días que la retención de {@code user_notifications}
 * establecida en V9 y la entidad {@link com.experis.sofia.bankportal.notification.domain.UserNotification}.
 *
 * @author SOFIA Developer Agent — DEBT-012 Sprint 9
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationPurgeJob {

    private final UserNotificationRepository notificationRepository;
    private final MeterRegistry              meterRegistry;

    private static final int RETENTION_DAYS = 90;

    /**
     * Purga notificaciones con {@code created_at < NOW() - 90 días}.
     * Cron: 02:00 UTC diario.
     *
     * <p>Idempotente — si el job se ejecuta dos veces seguidas (reinicio a las 02:00)
     * la segunda ejecución registra "0 notificaciones purgadas" sin fallar.
     */
    @Transactional
    @Scheduled(cron = "0 0 2 * * *")
    public void purgeOldNotifications() {
        Instant cutoff = Instant.now().minus(RETENTION_DAYS, ChronoUnit.DAYS);
        long start = System.currentTimeMillis();

        int deleted = notificationRepository.deleteExpiredBefore(cutoff);

        long elapsed = System.currentTimeMillis() - start;
        log.info("[DEBT-012] purge.notifications.count={} elapsed={}ms cutoff={}",
                deleted, elapsed, cutoff);

        meterRegistry.counter("notifications.purged.total").increment(deleted);
    }
}
