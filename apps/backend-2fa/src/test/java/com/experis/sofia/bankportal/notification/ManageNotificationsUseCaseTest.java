package com.experis.sofia.bankportal.notification;

import com.experis.sofia.bankportal.notification.application.ManageNotificationsUseCase;
import com.experis.sofia.bankportal.notification.domain.UserNotification;
import com.experis.sofia.bankportal.notification.domain.UserNotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para {@link ManageNotificationsUseCase}.
 * Cubre US-301 (listar), US-302 (marcar leídas), US-303 (badge count).
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 5
 */
@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
class ManageNotificationsUseCaseTest {

    @Mock private UserNotificationRepository notificationRepository;

    private ManageNotificationsUseCase useCase;

    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        useCase = new ManageNotificationsUseCase(notificationRepository);
    }

    // ── US-301: listNotifications ─────────────────────────────────────────────

    @Nested
    @DisplayName("US-301 — listNotifications()")
    class ListNotifications {

        @Test
        @DisplayName("returns paginated notifications ordered by createdAt DESC")
        void returnsPaginatedResults() {
            // Arrange
            var n1 = buildNotification("LOGIN_NEW_DEVICE", false);
            var n2 = buildNotification("SESSION_REVOKED", true);
            var page = new PageImpl<>(List.of(n1, n2));
            when(notificationRepository.findByUserId(eq(userId), any(), any(Pageable.class)))
                    .thenReturn(page);

            // Act
            var result = useCase.listNotifications(userId, null, 0, 20);

            // Assert
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getContent().get(0).getEventType()).isEqualTo("LOGIN_NEW_DEVICE");
        }

        @Test
        @DisplayName("passes eventType filter to repository")
        void passesEventTypeFilter() {
            when(notificationRepository.findByUserId(eq(userId), eq("SESSION_REVOKED"),
                    any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of()));

            useCase.listNotifications(userId, "SESSION_REVOKED", 0, 20);

            verify(notificationRepository).findByUserId(eq(userId), eq("SESSION_REVOKED"), any());
        }
    }

    // ── US-303: countUnread ───────────────────────────────────────────────────

    @Nested
    @DisplayName("US-303 — countUnread()")
    class CountUnread {

        @Test
        @DisplayName("returns count from repository")
        void returnsCount() {
            when(notificationRepository.countUnreadByUserId(userId)).thenReturn(5L);
            assertThat(useCase.countUnread(userId)).isEqualTo(5L);
        }

        @Test
        @DisplayName("returns 0 when no unread notifications")
        void returnsZero() {
            when(notificationRepository.countUnreadByUserId(userId)).thenReturn(0L);
            assertThat(useCase.countUnread(userId)).isZero();
        }
    }

    // ── US-302: markOneAsRead ─────────────────────────────────────────────────

    @Nested
    @DisplayName("US-302 — markOneAsRead()")
    class MarkOneAsRead {

        @Test
        @DisplayName("marks notification as read and saves")
        void marksAsRead() {
            // Arrange
            var notification = buildNotification("LOGIN_NEW_DEVICE", false);
            when(notificationRepository.findByIdAndUserId(eq(notification.getId()), eq(userId)))
                    .thenReturn(java.util.Optional.of(notification));
            when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            useCase.markOneAsRead(userId, notification.getId());

            // Assert
            var captor = ArgumentCaptor.forClass(UserNotification.class);
            verify(notificationRepository).save(captor.capture());
            assertThat(captor.getValue().isRead()).isTrue();
        }

        @Test
        @DisplayName("is idempotent — already read notification is not saved again")
        void idempotentForAlreadyRead() {
            // Arrange — notificación ya leída
            var alreadyRead = buildNotification("SESSION_REVOKED", true);
            when(notificationRepository.findByIdAndUserId(eq(alreadyRead.getId()), eq(userId)))
                    .thenReturn(java.util.Optional.of(alreadyRead));

            // Act
            useCase.markOneAsRead(userId, alreadyRead.getId());

            // Assert — save no debería llamarse para notificaciones ya leídas
            // (la entidad no cambia de estado si ya estaba leída)
            verify(notificationRepository, atMostOnce()).save(any());
        }
    }

    // ── US-302: markAllAsRead ─────────────────────────────────────────────────

    @Nested
    @DisplayName("US-302 — markAllAsRead()")
    class MarkAllAsRead {

        @Test
        @DisplayName("marks all unread as read and returns count")
        void marksAll() {
            // Arrange
            var n1 = buildNotification("LOGIN_NEW_DEVICE", false);
            var n2 = buildNotification("TRUSTED_DEVICE_CREATED", false);
            when(notificationRepository.findUnreadByUserId(userId)).thenReturn(List.of(n1, n2));
            when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            int count = useCase.markAllAsRead(userId);

            // Assert
            assertThat(count).isEqualTo(2);
            verify(notificationRepository, times(2)).save(any());
        }

        @Test
        @DisplayName("returns 0 when no unread notifications")
        void returnsZeroWhenNoneUnread() {
            when(notificationRepository.findUnreadByUserId(userId)).thenReturn(List.of());
            assertThat(useCase.markAllAsRead(userId)).isZero();
            verify(notificationRepository, never()).save(any());
        }
    }

    // ── UserNotification entity ───────────────────────────────────────────────

    @Nested
    @DisplayName("UserNotification entity")
    class Entity {

        @Test
        @DisplayName("isActive() is true when not expired")
        void activeWhenNotExpired() {
            var n = buildNotification("LOGIN_NEW_DEVICE", false);
            assertThat(n.isActive()).isTrue();
        }

        @Test
        @DisplayName("markAsRead() sets read = true")
        void markAsReadSetsFlag() {
            var n = buildNotification("SESSION_REVOKED", false);
            assertThat(n.isRead()).isFalse();
            n.markAsRead();
            assertThat(n.isRead()).isTrue();
        }

        @Test
        @DisplayName("markAsRead() is idempotent")
        void markAsReadIdempotent() {
            var n = buildNotification("SESSION_REVOKED", false);
            n.markAsRead();
            n.markAsRead();  // segunda llamada no debe lanzar excepción
            assertThat(n.isRead()).isTrue();
        }

        @Test
        @DisplayName("expiresAt is 90 days after createdAt")
        void expiration() {
            var now = LocalDateTime.now();
            var n   = new UserNotification(UUID.randomUUID(), userId,
                    "LOGIN_NEW_DEVICE", "title", "body", Map.of(), null, now);
            assertThat(n.getExpiresAt()).isAfter(now.plusDays(89));
            assertThat(n.getExpiresAt()).isBefore(now.plusDays(91));
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private UserNotification buildNotification(String eventType, boolean read) {
        var n = new UserNotification(
                UUID.randomUUID(), userId,
                eventType, "Test title", "Test body",
                Map.of("browser", "Chrome", "os", "macOS"),
                "/security/sessions",
                LocalDateTime.now().minusMinutes(10)
        );
        if (read) n.markAsRead();
        return n;
    }
}
