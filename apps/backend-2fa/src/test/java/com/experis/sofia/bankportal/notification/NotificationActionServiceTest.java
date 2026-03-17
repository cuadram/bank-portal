package com.experis.sofia.bankportal.notification;

import com.experis.sofia.bankportal.notification.application.NotificationActionService;
import com.experis.sofia.bankportal.notification.application.NotificationActionService.NotificationActionException;
import com.experis.sofia.bankportal.notification.domain.UserNotification;
import com.experis.sofia.bankportal.notification.domain.UserNotificationRepository;
import com.experis.sofia.bankportal.session.application.usecase.RevokeSessionUseCase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — US-304 NotificationActionService.
 *
 * Escenarios:
 *  1. resolveActionUrl: LOGIN_NEW_DEVICE + contextId → /security/sessions?highlight=ID
 *  2. resolveActionUrl: LOGIN_NEW_DEVICE sin contextId → /security/sessions
 *  3. resolveActionUrl: TRUSTED_DEVICE_CREATED → /security/devices
 *  4. resolveActionUrl: TWO_FA_DEACTIVATED → /security/two-factor
 *  5. resolveActionUrl: tipo desconocido → /security/notifications (fallback)
 *  6. revokeSessionFromNotification: notificación válida + sesión → delega en RevokeSessionUseCase
 *  7. revokeSessionFromNotification: notificación no encontrada → NotificationActionException
 *  8. revokeSessionFromNotification: sin contextId → NotificationActionException
 *  9. revokeSessionFromNotification: eventType no revocable → NotificationActionException
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 8 Semana 2
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("US-304 - NotificationActionService")
class NotificationActionServiceTest {

    @Mock UserNotificationRepository notificationRepo;
    @Mock RevokeSessionUseCase       revokeSessionUseCase;

    @InjectMocks NotificationActionService service;

    private static final UUID USER_ID    = UUID.randomUUID();
    private static final UUID NOTIF_ID   = UUID.randomUUID();
    private static final UUID SESSION_ID = UUID.randomUUID();

    // ─── resolveActionUrl ─────────────────────────────────────────────────────

    @Nested @DisplayName("resolveActionUrl()")
    class ResolveActionUrl {

        @Test @DisplayName("LOGIN_NEW_DEVICE + contextId → /security/sessions?highlight=<id>")
        void loginNewDevice_withContext_includesHighlight() {
            String url = service.resolveActionUrl("LOGIN_NEW_DEVICE", SESSION_ID.toString());
            assertThat(url).contains("/security/sessions").contains("highlight=");
        }

        @Test @DisplayName("LOGIN_NEW_DEVICE sin contextId → /security/sessions")
        void loginNewDevice_noContext_sessionsRoot() {
            assertThat(service.resolveActionUrl("LOGIN_NEW_DEVICE", null))
                    .isEqualTo("/security/sessions");
        }

        @ParameterizedTest(name = "TRUSTED_DEVICE_* → /security/devices")
        @ValueSource(strings = {"TRUSTED_DEVICE_CREATED", "TRUSTED_DEVICE_REVOKED"})
        void trustedDevice_mapsToDevices(String eventType) {
            assertThat(service.resolveActionUrl(eventType, null))
                    .isEqualTo("/security/devices");
        }

        @ParameterizedTest(name = "TWO_FA_* → /security/two-factor")
        @ValueSource(strings = {"TWO_FA_ACTIVATED", "TWO_FA_DEACTIVATED"})
        void twoFa_mapsToTwoFactor(String eventType) {
            assertThat(service.resolveActionUrl(eventType, null))
                    .isEqualTo("/security/two-factor");
        }

        @Test @DisplayName("Tipo desconocido → /security/notifications (fallback seguro)")
        void unknownType_fallbackToNotifications() {
            assertThat(service.resolveActionUrl("UNKNOWN_EVENT", null))
                    .isEqualTo("/security/notifications");
        }

        @Test @DisplayName("null eventType → /security/notifications")
        void nullEventType_fallback() {
            assertThat(service.resolveActionUrl(null, null))
                    .isEqualTo("/security/notifications");
        }
    }

    // ─── revokeSessionFromNotification ───────────────────────────────────────

    @Nested @DisplayName("revokeSessionFromNotification()")
    class RevokeSession {

        private UserNotification buildNotification(String eventType, String contextId) {
            UserNotification n = new UserNotification();
            n.setId(NOTIF_ID);
            n.setUserId(USER_ID);
            n.setEventType(eventType);
            n.setContextId(contextId);
            return n;
        }

        @Test @DisplayName("Notificacion LOGIN + contextId valido → delega en RevokeSessionUseCase")
        void validLogin_revokesSession() {
            when(notificationRepo.findByIdAndUserId(NOTIF_ID, USER_ID))
                    .thenReturn(Optional.of(
                            buildNotification("LOGIN_NEW_DEVICE", SESSION_ID.toString())));

            service.revokeSessionFromNotification(USER_ID, NOTIF_ID);

            verify(revokeSessionUseCase).revokeSession(USER_ID, SESSION_ID);
        }

        @Test @DisplayName("Notificacion no encontrada → NotificationActionException")
        void notFound_throws() {
            when(notificationRepo.findByIdAndUserId(NOTIF_ID, USER_ID))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.revokeSessionFromNotification(USER_ID, NOTIF_ID))
                    .isInstanceOf(NotificationActionException.class)
                    .hasMessageContaining("no encontrada");
        }

        @Test @DisplayName("contextId null → NotificationActionException")
        void noContextId_throws() {
            when(notificationRepo.findByIdAndUserId(NOTIF_ID, USER_ID))
                    .thenReturn(Optional.of(
                            buildNotification("LOGIN_NEW_DEVICE", null)));

            assertThatThrownBy(() -> service.revokeSessionFromNotification(USER_ID, NOTIF_ID))
                    .isInstanceOf(NotificationActionException.class)
                    .hasMessageContaining("no tiene sesión");
        }

        @Test @DisplayName("eventType TRUSTED_DEVICE (no revocable) → NotificationActionException")
        void nonRevocableType_throws() {
            when(notificationRepo.findByIdAndUserId(NOTIF_ID, USER_ID))
                    .thenReturn(Optional.of(
                            buildNotification("TRUSTED_DEVICE_CREATED", SESSION_ID.toString())));

            assertThatThrownBy(() -> service.revokeSessionFromNotification(USER_ID, NOTIF_ID))
                    .isInstanceOf(NotificationActionException.class)
                    .hasMessageContaining("no permite revocar");
        }
    }
}
