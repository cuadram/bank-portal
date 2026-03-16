package com.experis.sofia.bankportal.notification.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Puerto de dominio para persistencia de notificaciones de seguridad.
 * RV-S5-002: añadido findByIdAndUserId para lookup O(1) con IDOR protection.
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 5
 */
public interface UserNotificationRepository {

    UserNotification save(UserNotification notification);

    /** US-301: paginado con filtro opcional por eventType. */
    Page<UserNotification> findByUserId(UUID userId, String eventTypeFilter, Pageable pageable);

    /**
     * US-302: lookup O(1) por ID con IDOR protection (filtra por userId).
     * RV-S5-002: evita cargar todas las notificaciones del usuario en memoria.
     */
    Optional<UserNotification> findByIdAndUserId(UUID notificationId, UUID userId);

    /** US-303: conteo de no leídas para el badge. */
    long countUnreadByUserId(UUID userId);

    /** US-302: todas las no leídas para markAllAsRead en batch. */
    List<UserNotification> findUnreadByUserId(UUID userId);

    /** Cleanup nocturno de notificaciones expiradas (> 90 días). */
    int deleteExpired();
}
