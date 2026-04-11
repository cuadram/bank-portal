package com.experis.sofia.bankportal.notification.application;

import com.experis.sofia.bankportal.notification.domain.NotificationEventType;
import com.experis.sofia.bankportal.notification.domain.NotificationPreference;
import com.experis.sofia.bankportal.notification.domain.NotificationPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Caso de uso: gestión de preferencias de canal — FEAT-014.
 *
 * <p>GET retorna preferencias para todos los {@link NotificationEventType} conocidos,
 * creando defaults on-the-fly para los tipos sin fila en BD (lazy initialization).
 */
@Service
@RequiredArgsConstructor
public class ManagePreferencesUseCase {

    private final NotificationPreferenceRepository repo;

    /**
     * Retorna las preferencias del usuario para todos los event types.
     * Si no existe fila para un tipo, retorna el default (todos activos).
     */
    @Transactional(readOnly = true)
    public List<NotificationPreference> getPreferences(UUID userId) {
        var existing = repo.findByUserId(userId);

        // Completar con defaults para tipos sin preferencia guardada
        return Arrays.stream(NotificationEventType.values())
                .map(type -> existing.stream()
                        .filter(p -> p.getEventType() == type)
                        .findFirst()
                        .orElse(NotificationPreference.defaults(userId, type)))
                .toList();
    }

    /**
     * Actualiza (o crea si no existe) la preferencia de canal para un tipo de evento.
     *
     * @return preferencia actualizada
     */
    @Transactional
    public NotificationPreference updatePreference(UUID userId, PreferencePatchRequest req) {
        var pref = repo.findByUserIdAndEventType(userId, req.eventType())
                .orElseGet(() -> NotificationPreference.defaults(userId, req.eventType()));

        if (req.emailEnabled()  != null) pref.setEmailEnabled(req.emailEnabled());
        if (req.pushEnabled()   != null) pref.setPushEnabled(req.pushEnabled());
        if (req.inAppEnabled()  != null) pref.setInAppEnabled(req.inAppEnabled());

        return repo.save(pref);
    }

    // ── DTO ──────────────────────────────────────────────────────────────────

    public record PreferencePatchRequest(
            NotificationEventType eventType,
            Boolean emailEnabled,
            Boolean pushEnabled,
            Boolean inAppEnabled
    ) {}
}
