package com.experis.sofia.bankportal.notification.application;

import com.experis.sofia.bankportal.notification.domain.UserNotification;
import com.experis.sofia.bankportal.notification.domain.UserNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Caso de uso US-301/302/303 — Gestión de notificaciones de seguridad.
 * RV-S5-002: markOneAsRead usa findByIdAndUserId() — lookup O(1) con IDOR protection.
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 5
 */
@Service
@RequiredArgsConstructor
public class ManageNotificationsUseCase {

    private final UserNotificationRepository notificationRepository;

    /** US-301 — Lista notificaciones paginadas con filtro opcional por eventType. */
    @Transactional(readOnly = true)
    public Page<UserNotification> listNotifications(UUID userId, String eventTypeFilter,
                                                     int page, int size) {
        var pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return notificationRepository.findByUserId(userId, eventTypeFilter, pageable);
    }

    /**
     * US-302 — Marca una notificación individual como leída.
     * RV-S5-002: usa findByIdAndUserId() — O(1) con IDOR protection implícita en la query.
     * Idempotente — si ya está leída no hace nada.
     */
    @Transactional
    public void markOneAsRead(UUID userId, UUID notificationId) {
        notificationRepository.findByIdAndUserId(notificationId, userId)
                .ifPresent(n -> {
                    n.markAsRead();
                    notificationRepository.save(n);
                });
    }

    /** US-302 — Marca todas las notificaciones del usuario como leídas. */
    @Transactional
    public int markAllAsRead(UUID userId) {
        var unread = notificationRepository.findUnreadByUserId(userId);
        unread.forEach(n -> {
            n.markAsRead();
            notificationRepository.save(n);
        });
        return unread.size();
    }

    /** US-303 — Cuenta notificaciones no leídas para el badge del header. */
    @Transactional(readOnly = true)
    public long countUnread(UUID userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }
}
