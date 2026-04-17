package com.experis.sofia.bankportal.notification.application;

import com.experis.sofia.bankportal.notification.domain.SecurityEventType;
import com.experis.sofia.bankportal.notification.domain.UserNotification;
import com.experis.sofia.bankportal.notification.domain.UserNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Servicio de notificaciones de seguridad — FEAT-004 Sprint 5 · integración Sprint 6.
 *
 * <p>Sprint 6 (FEAT-004 cont.): {@code buildBody()} completo con los 13 tipos de evento
 * y 10 puntos de integración con FEAT-001/002/003 (ver LLD-backend-notification.md).
 *
 * <p>RV-S5-001: {@code @Async} y {@code @Transactional} en métodos separados.
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 5 · Sprint 6
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final UserNotificationRepository notificationRepository;
    private final SseEmitterRegistry         sseRegistry;

    /** Crea y persiste una notificación. Síncrono y transaccional. */
    @Transactional
    public void createNotification(UUID userId, SecurityEventType eventType,
                                    Map<String, String> metadata, String actionUrl) {
        var notification = new UserNotification(
                UUID.randomUUID(), userId,
                eventType.name(), eventType.getDisplayTitle(),
                buildBody(eventType, metadata),
                metadata, actionUrl, LocalDateTime.now());
        notificationRepository.save(notification);
        log.debug("Notification persisted userId={} eventType={}", userId, eventType);

        if (eventType.isCritical()) {
            sendSseAsync(userId, NotificationSseEvent.from(notification));
        }
    }

    /** Envía SSE en thread separado — sin acceso a BD (RV-S5-001). */
    @Async
    public void sendSseAsync(UUID userId, NotificationSseEvent event) {
        sseRegistry.sendToUser(userId, event);
    }

    /** Limpieza nocturna de notificaciones expiradas (> 90 días). */
    @Scheduled(cron = "0 30 2 * * *", zone = "UTC")
    @Transactional
    public void cleanupExpired() {
        int deleted = notificationRepository.deleteExpired();
        if (deleted > 0) log.info("Cleaned up {} expired notifications", deleted);
    }

    // ── buildBody — 13 tipos completos (Sprint 6 ACT-26) ─────────────────────

    private String buildBody(SecurityEventType type, Map<String, String> meta) {
        if (meta == null) return type.getDisplayTitle();
        String browser = meta.getOrDefault("browser", "dispositivo");
        String os      = meta.getOrDefault("os", "");
        String ip      = meta.getOrDefault("ipMasked", "IP desconocida");
        String count   = meta.getOrDefault("count", "");

        return switch (type) {
            case LOGIN_NEW_DEVICE ->
                    String.format("Acceso desde %s · %s (%s)", browser, os, ip);

            case LOGIN_FAILED_ATTEMPTS ->
                    String.format("Se detectaron %s intentos fallidos de acceso en los últimos 10 minutos",
                            count.isEmpty() ? "múltiples" : count);

            case TRUSTED_DEVICE_LOGIN ->
                    String.format("Acceso sin OTP desde %s · %s (registrado hace %s)",
                            browser, os, meta.getOrDefault("registeredDaysAgo", "varios días"));

            case SESSION_REVOKED ->
                    String.format("Sesión en %s · %s cerrada remotamente", browser, os);

            case SESSION_REVOKED_ALL ->
                    String.format("Todas las sesiones excepto la actual han sido cerradas (%s sesiones)",
                            count.isEmpty() ? "varias" : count);

            case SESSION_EVICTED ->
                    "Tu sesión más antigua fue cerrada automáticamente por alcanzar el límite de sesiones.";

            case SESSION_DENIED_BY_USER ->
                    "Acceso denegado mediante el enlace del email de alerta de seguridad.";

            case TRUSTED_DEVICE_CREATED ->
                    String.format("%s · %s añadido como dispositivo de confianza.", browser, os);

            case TRUSTED_DEVICE_REVOKED ->
                    String.format("%s · %s eliminado de tus dispositivos de confianza.", browser, os);

            case TRUSTED_DEVICE_REVOKE_ALL ->
                    String.format("Todos tus dispositivos de confianza han sido eliminados (%s dispositivos).",
                            count.isEmpty() ? "varios" : count);

            case TWO_FA_ACTIVATED ->
                    "La verificación en dos pasos ha sido activada en tu cuenta.";

            case TWO_FA_DEACTIVATED ->
                    "⚠️ La verificación en dos pasos ha sido desactivada en tu cuenta.";
            // FEAT-023 Sprint 25 — alerta presupuesto PFM
            case BUDGET_ALERT -> {
                String cat   = meta.getOrDefault("category",    "?");
                String pct   = meta.getOrDefault("percent",     "?");
                String limit = meta.getOrDefault("amountLimit", "?");
                yield "⚠️ " + cat + ": has consumido el " + pct + "% de tu presupuesto de " + limit + " €";
            }
        };
    }
}
