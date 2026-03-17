package com.experis.sofia.bankportal.notification.application;

import com.experis.sofia.bankportal.notification.domain.UserNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * US-303 — Servicio de contador de notificaciones no leídas.
 *
 * <p>Cacheable durante 30 segundos para evitar queries repetidas en cada
 * petición de polling fallback del badge (R-F4-003).
 * El caché se invalida automáticamente tras {@code markAsRead} / {@code markAllAsRead}.
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 8
 */
@Service
@RequiredArgsConstructor
public class UnreadCountService {

    private final UserNotificationRepository notificationRepo;

    /**
     * Retorna el número de notificaciones no leídas del usuario.
     * Cacheable 30s — clave: userId.
     */
    @Cacheable(value = "unread-count", key = "#userId")
    public long getUnreadCount(UUID userId) {
        return notificationRepo.countUnreadByUserId(userId);
    }

    /**
     * Invalida el caché del usuario.
     * Llamado por {@link MarkNotificationsUseCase} tras cualquier mark-as-read.
     */
    @CacheEvict(value = "unread-count", key = "#userId")
    public void invalidate(UUID userId) {
        // Anotación @CacheEvict gestiona la invalidación
    }
}
