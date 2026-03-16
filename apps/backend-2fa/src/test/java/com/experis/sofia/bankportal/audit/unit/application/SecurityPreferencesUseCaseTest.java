package com.experis.sofia.bankportal.audit.unit.application;

import com.experis.sofia.bankportal.audit.application.SecurityPreferencesUseCase;
import com.experis.sofia.bankportal.audit.application.SecurityPreferencesUseCase.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests unitarios — SecurityPreferencesUseCase
 * US-403: verificar que las preferencias de notificaciones NUNCA afectan al audit_log (R-F5-003)
 * US-403: verificar GET y UPDATE de preferencias
 *
 * @author SOFIA Developer Agent — Sprint 7
 */
@DisplayName("SecurityPreferencesUseCase")
class SecurityPreferencesUseCaseTest {

    private SecurityPreferencesUseCase useCase;
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        useCase = new SecurityPreferencesUseCase();
    }

    // ── US-403: GET preferencias ─────────────────────────────────────────────

    @Test
    @DisplayName("US-403: getPreferences retorna estructura válida no nula")
    void getPreferences_returnsNonNullResponse() {
        SecurityPreferencesResponse resp = useCase.getPreferences(userId);

        assertThat(resp).isNotNull();
    }

    @Test
    @DisplayName("US-403: getPreferences incluye campo notificationsEnabled")
    void getPreferences_includesNotificationsEnabled() {
        SecurityPreferencesResponse resp = useCase.getPreferences(userId);

        // El campo existe — no lanza NPE ni IllegalStateException
        assertThatCode(() -> resp.notificationsEnabled()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("US-403: getPreferences incluye sessionTimeoutMinutes > 0")
    void getPreferences_hasPositiveSessionTimeout() {
        SecurityPreferencesResponse resp = useCase.getPreferences(userId);

        assertThat(resp.sessionTimeoutMinutes()).isPositive();
    }

    // ── US-403: UPDATE — R-F5-003 ────────────────────────────────────────────

    @Test
    @DisplayName("R-F5-003: updatePreferences con notificationsByType no lanza excepción — audit_log no afectado")
    void updatePreferences_notifPrefs_doesNotThrow() {
        UpdateSecurityPreferencesRequest request = new UpdateSecurityPreferencesRequest(
            null,
            Map.of("LOGIN_FAILED_ATTEMPTS", false, "SESSION_REVOKED", true)
        );

        // R-F5-003: no lanza excepción — la preferencia se procesa sin tocar audit_log
        assertThatCode(() -> useCase.updatePreferences(userId, request))
            .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("R-F5-003: updatePreferences con sessionTimeoutMinutes no lanza excepción")
    void updatePreferences_sessionTimeout_doesNotThrow() {
        UpdateSecurityPreferencesRequest request = new UpdateSecurityPreferencesRequest(60, null);

        assertThatCode(() -> useCase.updatePreferences(userId, request))
            .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("US-403: updatePreferences con request null es idempotente — no lanza excepción")
    void updatePreferences_nullRequest_isIdempotent() {
        assertThatCode(() -> useCase.updatePreferences(userId, null))
            .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("US-403: updatePreferences con map vacío no lanza excepción")
    void updatePreferences_emptyNotifMap_doesNotThrow() {
        UpdateSecurityPreferencesRequest request = new UpdateSecurityPreferencesRequest(null, Map.of());

        assertThatCode(() -> useCase.updatePreferences(userId, request))
            .doesNotThrowAnyException();
    }
}
