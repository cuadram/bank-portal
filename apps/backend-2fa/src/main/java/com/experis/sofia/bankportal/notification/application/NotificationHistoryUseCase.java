package com.experis.sofia.bankportal.notification.application;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.notification.domain.UserNotification;
import com.experis.sofia.bankportal.notification.domain.UserNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * US-301 — Historial paginado de notificaciones de seguridad.
 *
 * <p>Requisitos:
 * <ul>
 *   <li>R-F4-001: ventana máxima de 90 días</li>
 *   <li>R-F4-002: paginación de 20 elementos por defecto, ordenado por createdAt DESC</li>
 *   <li>R-F4-003: filtro opcional por eventType y estado leído/no leído</li>
 *   <li>R-F6-006: solo el propio usuario puede ver sus notificaciones — userId del JWT</li>
 * </ul>
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 8
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationHistoryUseCase {

    private final UserNotificationRepository notificationRepo;
    private final AuditLogService            auditLogService;

    public static final int HISTORY_WINDOW_DAYS = 90;
    public static final int DEFAULT_PAGE_SIZE   = 20;

    // ─────────────────────────────────────────────────────────────────────────
    // Query principal
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Retorna el historial paginado de notificaciones del usuario para los últimos
     * {@value HISTORY_WINDOW_DAYS} días, aplicando filtros opcionales.
     *
     * @param userId   ID del usuario autenticado (verificado en controller)
     * @param filter   filtros opcionales de eventType y unreadOnly
     * @param pageable paginación — page, size, sort
     * @return página de notificaciones, vacía si no hay resultados
     */
    @Transactional(readOnly = true)
    public Page<UserNotification> getHistory(UUID userId, NotificationFilter filter,
                                             Pageable pageable) {
        Instant windowStart = Instant.now().minus(HISTORY_WINDOW_DAYS, ChronoUnit.DAYS);

        Page<UserNotification> page = notificationRepo
                .findByUserIdWithFilter(userId, filter, windowStart, pageable);

        auditLogService.log("NOTIFICATIONS_VIEWED", userId,
                "page=" + pageable.getPageNumber()
                + " size=" + page.getNumberOfElements()
                + " total=" + page.getTotalElements());

        log.debug("[US-301] History consultado userId={} total={}", userId, page.getTotalElements());
        return page;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DTO de filtro
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Filtros opcionales para el historial.
     *
     * @param eventType  tipo de evento exacto (null = todos)
     * @param unreadOnly true = solo no leídas, false/null = todas
     */
    public record NotificationFilter(
            String  eventType,
            Boolean unreadOnly
    ) {
        /** Sin filtros. */
        public static NotificationFilter none() {
            return new NotificationFilter(null, null);
        }
    }
}
