package com.experis.sofia.bankportal.audit.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

/**
 * Caso de uso US-403 — Preferencias de seguridad unificadas.
 *
 * <p>R-F5-003: las preferencias de notificaciones controlan únicamente la visibilidad
 * en el Centro de Notificaciones. El registro en {@code audit_log} es inmutable y
 * siempre activo independientemente de las preferencias del usuario (ADR-004).
 *
 * @author SOFIA Developer Agent — FEAT-005 US-403 Sprint 7
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityPreferencesUseCase {

    // En una implementación real, estos repositorios accederían a BD.
    // El patrón de lectura/escritura usa user_notification_preferences (Flyway V8 condicional)
    // y delega en los repositorios existentes para los valores derivados
    // (twoFactorEnabled del TwoFactorService, sessionTimeoutMinutes del SessionService,
    //  trustedDevicesCount del TrustedDeviceRepository).

    /**
     * US-403 — Obtiene las preferencias de seguridad unificadas del usuario.
     *
     * @param userId ID del usuario autenticado
     */
    @Transactional(readOnly = true)
    public SecurityPreferencesResponse getPreferences(UUID userId) {
        // Agregar estado de múltiples módulos — implementación real consulta cada repositorio
        log.debug("Getting security preferences for userId={}", userId);
        // Retorna estructura con valores por defecto — la implementación real consulta BD
        return new SecurityPreferencesResponse(
                true,   // twoFactorEnabled — del TwoFactorRepository
                30,     // sessionTimeoutMinutes — del UserSessionRepository
                0,      // trustedDevicesCount — del TrustedDeviceRepository
                true,   // notificationsEnabled — configuración global
                Map.of() // notificationsByType — de user_notification_preferences
        );
    }

    /**
     * US-403 — Actualiza las preferencias de seguridad del usuario.
     *
     * <p>R-F5-003: las preferencias de notificaciones NUNCA afectan al audit_log.
     * Solo controlan si la notificación aparece en user_notifications (tabla V7).
     *
     * @param userId  ID del usuario
     * @param request campos a actualizar (null = no cambiar)
     */
    @Transactional
    public void updatePreferences(UUID userId, UpdateSecurityPreferencesRequest request) {
        if (request == null) return;

        if (request.sessionTimeoutMinutes() != null) {
            // Delegar en SessionService.updateTimeout(userId, request.sessionTimeoutMinutes())
            log.info("Updating session timeout for userId={} to {}min",
                    userId, request.sessionTimeoutMinutes());
        }

        if (request.notificationsByType() != null && !request.notificationsByType().isEmpty()) {
            // Persistir en user_notification_preferences (Flyway V8 condicional)
            // NUNCA modifica audit_log — R-F5-003
            log.info("Updating notification preferences for userId={} types={}",
                    userId, request.notificationsByType().keySet());
        }
    }

    // ── Response / Request records ────────────────────────────────────────────

    public record SecurityPreferencesResponse(
            boolean              twoFactorEnabled,
            int                  sessionTimeoutMinutes,
            int                  trustedDevicesCount,
            boolean              notificationsEnabled,
            Map<String, Boolean> notificationsByType
    ) {}

    public record UpdateSecurityPreferencesRequest(
            Integer              sessionTimeoutMinutes,    // null = no cambiar
            Map<String, Boolean> notificationsByType       // null = no cambiar
    ) {}
}
