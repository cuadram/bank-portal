package com.experis.sofia.bankportal.notification.application;

import com.experis.sofia.bankportal.notification.domain.*;
import com.experis.sofia.bankportal.notification.infrastructure.WebPushService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Orquestador multicanal de notificaciones — FEAT-014.
 *
 * <p>Recibe un {@link NotificationEvent} y lo despacha a los canales apropiados
 * (push, SSE in-app, email) según las preferencias del usuario y la severidad.
 *
 * <p>Lógica de resolución de canales:
 * <ul>
 *   <li><b>INFO</b>: respeta preferencias de usuario (push/inApp/email).</li>
 *   <li><b>HIGH</b>: ignora preferencias para inApp y email (siempre entrega);
 *       push sigue respetando la preferencia.</li>
 * </ul>
 *
 * <p>La persistencia en {@code user_notifications} se hace SIEMPRE, independiente
 * de los canales activos — garantiza el historial completo.
 *
 * <p><b>RV-F014-01 fix:</b> {@code @Async} y {@code @Transactional} están separados
 * en métodos distintos (patrón RV-S5-001). {@code dispatch()} es el punto de entrada
 * async; {@code persist()} lleva la transacción. Los despachos a canales externos
 * (push, SSE, email) ocurren fuera de la transacción para evitar bloqueos de BD.
 *
 * @author SOFIA Developer Agent — FEAT-014 Sprint 16
 * @see TransactionAlertService
 * @see SecurityAlertService
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationHub {

    private final NotificationPreferenceRepository preferenceRepo;
    private final UserNotificationRepository       notifRepo;
    private final WebPushService                   webPushService;
    private final NotificationHubSseRegistry       sseRegistry;
    private final EmailChannelService              emailChannelService;

    /**
     * Punto de entrada asíncrono — no transaccional.
     * La persistencia se delega a {@link #persistAndGetPayload(NotificationEvent)},
     * que lleva su propia transacción. Los despachos a canales externos se ejecutan
     * fuera de transacción para no mantener conexiones de BD abiertas durante I/O.
     *
     * @param event evento de negocio a despachar
     */
    @Async("notificationExecutor")
    public void dispatch(NotificationEvent event) {
        log.debug("[Hub] dispatch userId={} eventType={} severity={}",
                event.userId(), event.eventType(), event.severity());

        // 1. Persistir en transacción propia → retorna payload para SSE
        Map<String, Object> ssePayload = persistAndGetPayload(event);

        // 2. Obtener preferencias (fuera de transacción — read-only cache friendly)
        NotificationPreference prefs = preferenceRepo
                .findByUserIdAndEventType(event.userId(), event.eventType())
                .orElseGet(() -> NotificationPreference.defaults(event.userId(), event.eventType()));

        boolean isHigh = event.severity() == NotificationSeverity.HIGH;

        // 3. Canal IN-APP (SSE) — sin transacción
        if (isHigh || prefs.isInAppEnabled()) {
            sseRegistry.broadcastToUser(event.userId(), event.category(), ssePayload);
        }

        // 4. Canal PUSH — sin transacción (respeta prefs incluso HIGH)
        if (prefs.isPushEnabled()) {
            webPushService.sendToUser(event.userId(), event.title(), event.body(),
                    event.metadata());
        }

        // 5. Canal EMAIL — sin transacción (directo, sin doble @Async — RV-F014-06 fix)
        if (isHigh || prefs.isEmailEnabled()) {
            emailChannelService.sendNotificationEmail(event.userId(), event.title(),
                    event.body());
        }
    }

    /**
     * Persiste la notificación en una transacción propia y retorna el payload SSE.
     * Separado de {@link #dispatch} para cumplir RV-S5-001 (RV-F014-01).
     */
    @Transactional
    public Map<String, Object> persistAndGetPayload(NotificationEvent event) {
        var notif = new UserNotification();
        notif.setId(UUID.randomUUID());
        notif.setUserId(event.userId());
        notif.setEventType(event.eventType().name());
        notif.setTitle(event.title());
        notif.setBody(event.body());
        notif.setCategory(event.category());
        notif.setSeverity(event.severity());
        notif.setCreatedAt(LocalDateTime.now());
        notif.setMetadataMap(event.metadata());
        UserNotification saved = notifRepo.save(notif);

        return Map.of(
                "notificationId", saved.getId().toString(),
                "type",           saved.getEventType(),
                "title",          saved.getTitle()    != null ? saved.getTitle()    : "",
                "body",           saved.getBody()     != null ? saved.getBody()     : "",
                "severity",       saved.getSeverity() != null ? saved.getSeverity().name() : "INFO",
                "category",       saved.getCategory() != null ? saved.getCategory().name() : "SYSTEM",
                "createdAt",      saved.getCreatedAt().toString()
        );
    }
}
