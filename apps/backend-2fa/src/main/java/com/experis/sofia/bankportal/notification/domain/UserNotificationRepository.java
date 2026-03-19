package com.experis.sofia.bankportal.notification.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Puerto de dominio para persistencia de notificaciones de seguridad.
 *
 * <p>Sprint 9 DEBT-012: añadido {@link #deleteExpiredBefore(Instant)} para
 * que {@code NotificationPurgeJob} pase el cutoff calculado dinámicamente.
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 5 / DEBT-012 Sprint 9
 */
public interface UserNotificationRepository {

    UserNotification save(UserNotification notification);

    /** US-301: paginado con filtro opcional por eventType. */
    Page<UserNotification> findByUserId(UUID userId, String eventTypeFilter, Pageable pageable);

    /**
     * US-302: lookup O(1) por ID con IDOR protection (filtra por userId).
     */
    Optional<UserNotification> findByIdAndUserId(UUID notificationId, UUID userId);

    /** US-303: conteo de no leídas para el badge. */
    long countUnreadByUserId(UUID userId);

    /** US-302: todas las no leídas para markAllAsRead en batch. */
    List<UserNotification> findUnreadByUserId(UUID userId);

    /** US-302: marca todas las notificaciones del usuario como leídas. */
    int markAllReadByUserId(UUID userId, Instant readAt);

    /**
     * US-301 v2 — Paginado con filtro completo (eventType + unreadOnly + windowStart).
     * Delegado al método básico como compatibilidad.
     */
    default Page<UserNotification> findByUserIdWithFilter(
            UUID userId,
            com.experis.sofia.bankportal.notification.application.NotificationHistoryUseCase.NotificationFilter filter,
            java.time.Instant windowStart,
            Pageable pageable) {
        return findByUserId(userId, filter != null ? filter.eventType() : null, pageable);
    }

    /**
     * DEBT-012 — Purga notificaciones anteriores al cutoff indicado.
     * @param cutoff instante de corte (exclusivo — elimina created_at < cutoff)
     * @return número de filas eliminadas
     */
    int deleteExpiredBefore(Instant cutoff);

    /** @deprecated usar {@link #deleteExpiredBefore(Instant)} con cutoff explícito. */
    @Deprecated
    default int deleteExpired() {
        return deleteExpiredBefore(Instant.now().minusSeconds(90L * 24 * 3600));
    }
}
