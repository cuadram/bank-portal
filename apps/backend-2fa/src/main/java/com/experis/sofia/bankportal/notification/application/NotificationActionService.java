package com.experis.sofia.bankportal.notification.application;

import com.experis.sofia.bankportal.notification.domain.UserNotification;
import com.experis.sofia.bankportal.notification.domain.UserNotificationRepository;
import com.experis.sofia.bankportal.session.application.usecase.RevokeSessionUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * US-304 — Acciones directas desde notificación de seguridad.
 *
 * <p>Requisitos:
 * <ul>
 *   <li>R-F4-007: deep-link hacia sesión / dispositivo / historial correcto según eventType</li>
 *   <li>R-F4-008: revocar sesión directamente desde notificación sin abandonar el centro</li>
 *   <li>R-F4-009: el userId de la acción debe coincidir con el propietario de la notificación</li>
 * </ul>
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 8 Semana 2
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationActionService {

    private final UserNotificationRepository notificationRepo;
    private final RevokeSessionUseCase       revokeSessionUseCase;

    // ─────────────────────────────────────────────────────────────────────────
    // Resolver URL de deep-link
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Genera la URL de acción directa para una notificación según su tipo y contextId.
     * Usado en el frontend para el botón "Ver →" de cada notificación (US-304 Escenario 1 y 3).
     *
     * <p>Si la notificación ya tiene {@code actionUrl} persistida en BD se usa esa.
     * Si no, se genera dinámicamente por eventType.
     *
     * @param eventType tipo de evento de la notificación
     * @param contextId sessionId / deviceId / referencia contextual (puede ser null)
     * @return URL de deep-link relativa al frontend
     */
    public String resolveActionUrl(String eventType, String contextId) {
        if (eventType == null) return "/security/notifications";

        return switch (eventType) {
            case "LOGIN_NEW_DEVICE",
                 "LOGIN_FAILED_ATTEMPTS",
                 "SESSION_REVOKED",
                 "SESSION_EVICTED"         -> contextId != null
                                                ? "/security/sessions?highlight=" + contextId
                                                : "/security/sessions";
            case "TRUSTED_DEVICE_CREATED",
                 "TRUSTED_DEVICE_REVOKED"  -> "/security/devices";
            case "TWO_FA_ACTIVATED",
                 "TWO_FA_DEACTIVATED"      -> "/security/two-factor";
            case "ACCOUNT_LOCKED"          -> "/account-locked";
            case "ACCOUNT_UNLOCKED"        -> "/login?reason=account-unlocked";
            case "LOGIN_NEW_CONTEXT_CONFIRMED",
                 "PASSWORD_CHANGED",
                 "PREFERENCES_UPDATED"     -> "/security/config-history";
            default                        -> "/security/notifications";
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Revocar sesión desde notificación (US-304 Escenario 2)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Revoca la sesión asociada a una notificación directamente desde el centro.
     *
     * <p>Verifica que:
     * <ol>
     *   <li>La notificación pertenece al usuario autenticado (R-F4-009)</li>
     *   <li>La notificación tiene un {@code contextId} que referencia una sesión</li>
     *   <li>El eventType indica que la acción tiene sentido (sesión activa sospechosa)</li>
     * </ol>
     *
     * @param userId         ID del usuario autenticado (del claim JWT)
     * @param notificationId ID de la notificación desde la que se inicia la acción
     * @throws NotificationActionException si la notificación no existe, no pertenece al usuario
     *                                     o no tiene una sesión asociada revocable
     */
    @Transactional
    public void revokeSessionFromNotification(UUID userId, UUID notificationId) {
        UserNotification notification = notificationRepo
                .findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new NotificationActionException(
                        "Notificación no encontrada o sin permisos"));

        String contextId = notification.getContextId();
        if (contextId == null || contextId.isBlank()) {
            throw new NotificationActionException(
                    "La notificación no tiene sesión asociada");
        }

        if (!isRevocableEventType(notification.getEventType())) {
            throw new NotificationActionException(
                    "El tipo de notificación no permite revocar sesión directamente");
        }

        UUID sessionId = UUID.fromString(contextId);
        revokeSessionUseCase.revokeSession(userId, sessionId);

        log.info("[US-304] Sesión revocada desde notificación notifId={} sessionId={} userId={}",
                notificationId, sessionId, userId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private boolean isRevocableEventType(String eventType) {
        return eventType != null && (
                eventType.startsWith("LOGIN_") ||
                eventType.startsWith("SESSION_"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Excepción de dominio
    // ─────────────────────────────────────────────────────────────────────────

    public static class NotificationActionException extends RuntimeException {
        public NotificationActionException(String message) {
            super(message);
        }
    }
}
