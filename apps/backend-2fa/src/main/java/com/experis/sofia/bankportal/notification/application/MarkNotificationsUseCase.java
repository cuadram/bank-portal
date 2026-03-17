package com.experis.sofia.bankportal.notification.application;

import com.experis.sofia.bankportal.auth.application.SseEvent;
import com.experis.sofia.bankportal.auth.application.SseRegistry;
import com.experis.sofia.bankportal.notification.domain.UserNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * US-302 — Marcar notificaciones como leídas (individual + bulk).
 *
 * <p>Requisitos:
 * <ul>
 *   <li>R-F4-004: operación idempotente — marcar una ya-leída no produce error</li>
 *   <li>R-F4-005: badge del header se actualiza inmediatamente vía SSE (US-303)</li>
 *   <li>R-F4-006: estado persiste entre sesiones (persistido en BD)</li>
 * </ul>
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 8
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MarkNotificationsUseCase {

    private final UserNotificationRepository notificationRepo;
    private final SseRegistry                sseRegistry;

    // ─────────────────────────────────────────────────────────────────────────
    // Marcar individual
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Marca una notificación individual como leída.
     * Operación idempotente: si ya estaba leída no hace nada.
     * Tras marcar, emite evento SSE de unread-count actualizado.
     *
     * @param userId         ID del usuario propietario (verificado en controller)
     * @param notificationId ID de la notificación a marcar
     */
    @Transactional
    public void markAsRead(UUID userId, UUID notificationId) {
        notificationRepo.findByIdAndUserId(notificationId, userId)
                .filter(n -> n.getReadAt() == null)
                .ifPresent(n -> {
                    n.setReadAt(Instant.now());
                    notificationRepo.save(n);
                    broadcastUnreadCount(userId);
                    log.debug("[US-302] Notificacion marcada leida id={} userId={}",
                            notificationId, userId);
                });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Marcar todas
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Marca todas las notificaciones no leídas del usuario como leídas.
     * Retorna el número de notificaciones actualizadas.
     */
    @Transactional
    public int markAllAsRead(UUID userId) {
        int updated = notificationRepo.markAllReadByUserId(userId, Instant.now());
        if (updated > 0) {
            broadcastUnreadCount(userId);
            log.info("[US-302] Mark-all-read userId={} updated={}", userId, updated);
        }
        return updated;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper SSE
    // ─────────────────────────────────────────────────────────────────────────

    private void broadcastUnreadCount(UUID userId) {
        long count = notificationRepo.countUnreadByUserId(userId);
        sseRegistry.send(userId, SseEvent.unreadCount(count));
    }
}
