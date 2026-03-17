package com.experis.sofia.bankportal.notification;

import com.experis.sofia.bankportal.auth.application.SseEvent;
import com.experis.sofia.bankportal.auth.application.SseRegistry;
import com.experis.sofia.bankportal.notification.application.MarkNotificationsUseCase;
import com.experis.sofia.bankportal.notification.domain.UserNotification;
import com.experis.sofia.bankportal.notification.domain.UserNotificationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — US-302 MarkNotificationsUseCase.
 *
 * Escenarios:
 *  1. markAsRead: notificación no leída → read_at actualizado + save + SSE broadcast
 *  2. markAsRead: notificación ya leída → no-op (idempotente, sin save)
 *  3. markAsRead: notificación no encontrada → no-op silencioso
 *  4. markAllAsRead: N no leídas → bulk update + SSE broadcast + retorna N
 *  5. markAllAsRead: 0 no leídas → no SSE broadcast, retorna 0
 *  6. broadcastUnreadCount: consulta repo y envía evento SSE unread-count-updated
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 8
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("US-302 - MarkNotificationsUseCase")
class MarkNotificationsUseCaseTest {

    @Mock UserNotificationRepository notificationRepo;
    @Mock SseRegistry                sseRegistry;

    @InjectMocks MarkNotificationsUseCase useCase;

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID NOTIF_ID = UUID.randomUUID();

    private UserNotification unreadNotification() {
        UserNotification n = new UserNotification();
        n.setId(NOTIF_ID);
        n.setUserId(USER_ID);
        n.setReadAt(null);
        return n;
    }

    private UserNotification readNotification() {
        UserNotification n = unreadNotification();
        n.setReadAt(Instant.now().minusSeconds(60));
        return n;
    }

    // ─── markAsRead ───────────────────────────────────────────────────────────

    @Nested @DisplayName("markAsRead()")
    class MarkAsRead {

        @Test @DisplayName("Notificacion no leida -> read_at seteado + save + SSE broadcast")
        void unread_setsReadAt_saves_broadcasts() {
            when(notificationRepo.findByIdAndUserId(NOTIF_ID, USER_ID))
                    .thenReturn(Optional.of(unreadNotification()));
            when(notificationRepo.countUnreadByUserId(USER_ID)).thenReturn(2L);

            useCase.markAsRead(USER_ID, NOTIF_ID);

            ArgumentCaptor<UserNotification> captor =
                    ArgumentCaptor.forClass(UserNotification.class);
            verify(notificationRepo).save(captor.capture());
            assertThat(captor.getValue().getReadAt()).isNotNull();

            verify(sseRegistry).send(eq(USER_ID), argThat(
                    e -> "unread-count-updated".equals(e.type())));
        }

        @Test @DisplayName("Notificacion ya leida -> no-op (idempotente, sin save)")
        void alreadyRead_noOp() {
            when(notificationRepo.findByIdAndUserId(NOTIF_ID, USER_ID))
                    .thenReturn(Optional.of(readNotification()));

            useCase.markAsRead(USER_ID, NOTIF_ID);

            verify(notificationRepo, never()).save(any());
            verifyNoInteractions(sseRegistry);
        }

        @Test @DisplayName("Notificacion no encontrada -> no-op silencioso")
        void notFound_noOp() {
            when(notificationRepo.findByIdAndUserId(NOTIF_ID, USER_ID))
                    .thenReturn(Optional.empty());

            useCase.markAsRead(USER_ID, NOTIF_ID);

            verify(notificationRepo, never()).save(any());
            verifyNoInteractions(sseRegistry);
        }
    }

    // ─── markAllAsRead ────────────────────────────────────────────────────────

    @Nested @DisplayName("markAllAsRead()")
    class MarkAllAsRead {

        @Test @DisplayName("3 no leidas -> bulk update + SSE broadcast + retorna 3")
        void threeUnread_updatesAndBroadcasts() {
            when(notificationRepo.markAllReadByUserId(eq(USER_ID), any(Instant.class)))
                    .thenReturn(3);
            when(notificationRepo.countUnreadByUserId(USER_ID)).thenReturn(0L);

            int result = useCase.markAllAsRead(USER_ID);

            assertThat(result).isEqualTo(3);
            verify(sseRegistry).send(eq(USER_ID), argThat(
                    e -> "unread-count-updated".equals(e.type())));
        }

        @Test @DisplayName("0 no leidas -> sin SSE broadcast, retorna 0")
        void noneUnread_noSse() {
            when(notificationRepo.markAllReadByUserId(eq(USER_ID), any(Instant.class)))
                    .thenReturn(0);

            int result = useCase.markAllAsRead(USER_ID);

            assertThat(result).isZero();
            verifyNoInteractions(sseRegistry);
        }
    }

    // ─── broadcastUnreadCount ─────────────────────────────────────────────────

    @Test @DisplayName("broadcastUnreadCount -> SSE event tipo unread-count-updated con count correcto")
    void broadcast_sendsCorrectCount() {
        when(notificationRepo.findByIdAndUserId(NOTIF_ID, USER_ID))
                .thenReturn(Optional.of(unreadNotification()));
        when(notificationRepo.countUnreadByUserId(USER_ID)).thenReturn(5L);

        useCase.markAsRead(USER_ID, NOTIF_ID);

        ArgumentCaptor<SseEvent> eventCaptor = ArgumentCaptor.forClass(SseEvent.class);
        verify(sseRegistry).send(eq(USER_ID), eventCaptor.capture());
        assertThat(eventCaptor.getValue().type()).isEqualTo("unread-count-updated");
        assertThat(eventCaptor.getValue().payload().toString()).contains("5");
    }
}
