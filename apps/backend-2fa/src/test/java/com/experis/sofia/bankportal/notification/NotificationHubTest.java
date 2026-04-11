package com.experis.sofia.bankportal.notification;

import com.experis.sofia.bankportal.notification.application.*;
import com.experis.sofia.bankportal.notification.infrastructure.WebPushService;
import com.experis.sofia.bankportal.notification.domain.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para {@link NotificationHub} — FEAT-014.
 *
 * <p>Verifica la lógica de despacho multicanal: resolución de preferencias,
 * comportamiento INFO vs HIGH, y persistencia obligatoria.
 * CMMI Level 3 — VER SP 1.1
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationHub — despacho multicanal")
class NotificationHubTest {

    @Mock NotificationPreferenceRepository preferenceRepo;
    @Mock UserNotificationRepository       notifRepo;
    @Mock WebPushService                   webPushService;
    @Mock NotificationHubSseRegistry       sseRegistry;
    @Mock EmailChannelService              emailChannelService;

    NotificationHub hub;

    @BeforeEach
    void setUp() {
        hub = new NotificationHub(preferenceRepo, notifRepo, webPushService,
                sseRegistry, emailChannelService);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private NotificationEvent infoEvent(UUID userId) {
        return NotificationEvent.of(userId, NotificationEventType.TRANSFER_COMPLETED,
                "Transferencia enviada", "250€ a IBAN ES76...",
                Map.of("amount", 250.0, "iban", "ES760000..."));
    }

    private NotificationEvent highEvent(UUID userId) {
        return NotificationEvent.of(userId, NotificationEventType.SECURITY_NEW_DEVICE,
                "Nuevo dispositivo detectado", "Acceso desde Chrome · macOS (192.168.*)",
                Map.of("browser", "Chrome", "os", "macOS"));
    }

    private UserNotification savedNotification(UUID userId) {
        var n = new UserNotification();
        n.setId(UUID.randomUUID());
        n.setUserId(userId);
        n.setEventType("TRANSFER_COMPLETED");
        n.setCategory(NotificationCategory.TRANSACTION);
        n.setSeverity(NotificationSeverity.INFO);
        return n;
    }

    // ── Tests ────────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("Persistencia obligatoria")
    class PersistenceTests {

        @Test
        @DisplayName("Siempre persiste en historial independientemente de preferencias")
        void alwaysPersists() {
            UUID userId = UUID.randomUUID();
            when(notifRepo.save(any())).thenReturn(savedNotification(userId));
            when(preferenceRepo.findByUserIdAndEventType(any(), any()))
                    .thenReturn(Optional.empty()); // defaults

            hub.dispatch(infoEvent(userId));

            verify(notifRepo, times(1)).save(any(UserNotification.class));
        }

        @Test
        @DisplayName("Persiste category y severity correctas")
        void persistsCorrectCategoryAndSeverity() {
            UUID userId = UUID.randomUUID();
            var captor = ArgumentCaptor.forClass(UserNotification.class);
            when(notifRepo.save(captor.capture())).thenAnswer(i -> i.getArgument(0));
            when(preferenceRepo.findByUserIdAndEventType(any(), any()))
                    .thenReturn(Optional.empty());

            hub.dispatch(infoEvent(userId));

            UserNotification saved = captor.getValue();
            assertThat(saved.getCategory()).isEqualTo(NotificationCategory.TRANSACTION);
            assertThat(saved.getSeverity()).isEqualTo(NotificationSeverity.INFO);
        }
    }

    @Nested
    @DisplayName("Eventos INFO — respeta preferencias")
    class InfoSeverityTests {

        @Test
        @DisplayName("Todos los canales activos → despacha a los tres")
        void allChannelsEnabled_dispatchesToAll() {
            UUID userId = UUID.randomUUID();
            when(notifRepo.save(any())).thenReturn(savedNotification(userId));

            var prefs = NotificationPreference.defaults(userId, NotificationEventType.TRANSFER_COMPLETED);
            when(preferenceRepo.findByUserIdAndEventType(userId, NotificationEventType.TRANSFER_COMPLETED))
                    .thenReturn(Optional.of(prefs));

            hub.dispatch(infoEvent(userId));

            verify(sseRegistry).broadcastToUser(eq(userId), eq(NotificationCategory.TRANSACTION), any());
            verify(webPushService).sendToUser(eq(userId), any(), any(), any());
            verify(emailChannelService).sendNotificationEmail(eq(userId), any(), any());
        }

        @Test
        @DisplayName("pushEnabled=false → no llama a WebPushService")
        void pushDisabled_skipsPush() {
            UUID userId = UUID.randomUUID();
            when(notifRepo.save(any())).thenReturn(savedNotification(userId));

            var prefs = NotificationPreference.defaults(userId, NotificationEventType.TRANSFER_COMPLETED);
            prefs.setPushEnabled(false);
            when(preferenceRepo.findByUserIdAndEventType(any(), any()))
                    .thenReturn(Optional.of(prefs));

            hub.dispatch(infoEvent(userId));

            verify(webPushService, never()).sendToUser(any(), any(), any(), any());
            verify(sseRegistry).broadcastToUser(any(), any(), any());
            verify(emailChannelService).sendNotificationEmail(any(), any(), any());
        }

        @Test
        @DisplayName("inAppEnabled=false → no llama a SseRegistry")
        void inAppDisabled_skipsSse() {
            UUID userId = UUID.randomUUID();
            when(notifRepo.save(any())).thenReturn(savedNotification(userId));

            var prefs = NotificationPreference.defaults(userId, NotificationEventType.TRANSFER_COMPLETED);
            prefs.setInAppEnabled(false);
            when(preferenceRepo.findByUserIdAndEventType(any(), any()))
                    .thenReturn(Optional.of(prefs));

            hub.dispatch(infoEvent(userId));

            verify(sseRegistry, never()).broadcastToUser(any(), any(), any());
        }

        @Test
        @DisplayName("Sin fila en BD → usa defaults (todos activos)")
        void noPrefRow_usesDefaults_allChannels() {
            UUID userId = UUID.randomUUID();
            when(notifRepo.save(any())).thenReturn(savedNotification(userId));
            when(preferenceRepo.findByUserIdAndEventType(any(), any()))
                    .thenReturn(Optional.empty());

            hub.dispatch(infoEvent(userId));

            verify(sseRegistry).broadcastToUser(any(), any(), any());
            verify(webPushService).sendToUser(any(), any(), any(), any());
            verify(emailChannelService).sendNotificationEmail(any(), any(), any());
        }
    }

    @Nested
    @DisplayName("Eventos HIGH — ignora preferencias para inApp y email")
    class HighSeverityTests {

        private UserNotification savedHighNotification(UUID userId) {
            var n = new UserNotification();
            n.setId(UUID.randomUUID());
            n.setUserId(userId);
            n.setEventType("SECURITY_NEW_DEVICE");
            n.setCategory(NotificationCategory.SECURITY);
            n.setSeverity(NotificationSeverity.HIGH);
            return n;
        }

        @Test
        @DisplayName("inApp=false pero severity=HIGH → SseRegistry sí se llama")
        void highOverridesInAppPreference() {
            UUID userId = UUID.randomUUID();
            when(notifRepo.save(any())).thenReturn(savedHighNotification(userId));

            var prefs = NotificationPreference.defaults(userId, NotificationEventType.SECURITY_NEW_DEVICE);
            prefs.setInAppEnabled(false);
            prefs.setEmailEnabled(false);
            when(preferenceRepo.findByUserIdAndEventType(any(), any()))
                    .thenReturn(Optional.of(prefs));

            hub.dispatch(highEvent(userId));

            // HIGH fuerza inApp y email aunque estén desactivados
            verify(sseRegistry).broadcastToUser(eq(userId), eq(NotificationCategory.SECURITY), any());
            verify(emailChannelService).sendNotificationEmail(eq(userId), any(), any());
        }

        @Test
        @DisplayName("pushEnabled=false y severity=HIGH → push sigue siendo omitido")
        void highRespectsPushPreference() {
            UUID userId = UUID.randomUUID();
            when(notifRepo.save(any())).thenReturn(savedHighNotification(userId));

            var prefs = NotificationPreference.defaults(userId, NotificationEventType.SECURITY_NEW_DEVICE);
            prefs.setPushEnabled(false);
            when(preferenceRepo.findByUserIdAndEventType(any(), any()))
                    .thenReturn(Optional.of(prefs));

            hub.dispatch(highEvent(userId));

            verify(webPushService, never()).sendToUser(any(), any(), any(), any());
        }
    }
}
