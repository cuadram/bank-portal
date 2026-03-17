package com.experis.sofia.bankportal.notification;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.notification.application.NotificationHistoryUseCase;
import com.experis.sofia.bankportal.notification.domain.UserNotification;
import com.experis.sofia.bankportal.notification.domain.UserNotificationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static com.experis.sofia.bankportal.notification.application.NotificationHistoryUseCase.HISTORY_WINDOW_DAYS;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — US-301 NotificationHistoryUseCase.
 *
 * Escenarios:
 *  1. getHistory → llama repo con windowStart correcto (~90 días atrás)
 *  2. getHistory → retorna página con elementos
 *  3. getHistory → página vacía no lanza excepción
 *  4. getHistory → audita NOTIFICATIONS_VIEWED con total correcto
 *  5. NotificationFilter.none() → eventType null, unreadOnly null
 *
 * @author SOFIA QA Agent — Sprint 8
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("US-301 - NotificationHistoryUseCase")
class NotificationHistoryUseCaseTest {

    @Mock UserNotificationRepository notificationRepo;
    @Mock AuditLogService            auditLogService;

    @InjectMocks NotificationHistoryUseCase useCase;

    private static final UUID USER_ID = UUID.randomUUID();

    private UserNotification fakeNotification(String type) {
        UserNotification n = new UserNotification();
        n.setId(UUID.randomUUID());
        n.setEventType(type);
        n.setTitle("Test " + type);
        n.setCreatedAt(Instant.now());
        return n;
    }

    @Nested @DisplayName("getHistory - windowStart")
    class WindowStart {

        @Test @DisplayName("windowStart ~= now - 90 días (tolerancia 5s)")
        void windowStart_90Days() {
            when(notificationRepo.findByUserIdWithFilter(
                    eq(USER_ID), any(), any(Instant.class), any(Pageable.class)))
                    .thenReturn(Page.empty());

            useCase.getHistory(USER_ID, NotificationHistoryUseCase.NotificationFilter.none(),
                    PageRequest.of(0, 20));

            verify(notificationRepo).findByUserIdWithFilter(
                    eq(USER_ID),
                    any(),
                    argThat(since -> {
                        Instant expected = Instant.now().minus(HISTORY_WINDOW_DAYS, ChronoUnit.DAYS);
                        return Math.abs(since.toEpochMilli() - expected.toEpochMilli()) < 5_000;
                    }),
                    any(Pageable.class));
        }
    }

    @Nested @DisplayName("getHistory - retorno y auditoría")
    class ReturnAndAudit {

        @Test @DisplayName("2 notificaciones → retorna página con 2 elementos")
        void twoNotifications_returnsPage() {
            List<UserNotification> data = List.of(
                    fakeNotification("LOGIN_NEW_DEVICE"),
                    fakeNotification("TWO_FA_DISABLED"));
            Page<UserNotification> page = new PageImpl<>(data);

            when(notificationRepo.findByUserIdWithFilter(
                    eq(USER_ID), any(), any(), any(Pageable.class)))
                    .thenReturn(page);

            Page<UserNotification> result = useCase.getHistory(
                    USER_ID,
                    NotificationHistoryUseCase.NotificationFilter.none(),
                    PageRequest.of(0, 20));

            assertThat(result.getContent()).hasSize(2);
        }

        @Test @DisplayName("Página vacía → no lanza excepción")
        void emptyPage_noException() {
            when(notificationRepo.findByUserIdWithFilter(
                    eq(USER_ID), any(), any(), any(Pageable.class)))
                    .thenReturn(Page.empty());

            assertThat(useCase.getHistory(
                    USER_ID,
                    NotificationHistoryUseCase.NotificationFilter.none(),
                    PageRequest.of(0, 20))).isEmpty();
        }

        @Test @DisplayName("Audita NOTIFICATIONS_VIEWED con total correcto")
        void auditsWithTotal() {
            Page<UserNotification> page = new PageImpl<>(
                    List.of(fakeNotification("ACCOUNT_LOCKED")),
                    PageRequest.of(0, 20), 1);

            when(notificationRepo.findByUserIdWithFilter(
                    eq(USER_ID), any(), any(), any(Pageable.class)))
                    .thenReturn(page);

            useCase.getHistory(
                    USER_ID,
                    NotificationHistoryUseCase.NotificationFilter.none(),
                    PageRequest.of(0, 20));

            verify(auditLogService).log(
                    eq("NOTIFICATIONS_VIEWED"), eq(USER_ID),
                    contains("total=1"));
        }
    }

    @Test @DisplayName("NotificationFilter.none() → eventType=null, unreadOnly=null")
    void filterNone_isAllNull() {
        var filter = NotificationHistoryUseCase.NotificationFilter.none();
        assertThat(filter.eventType()).isNull();
        assertThat(filter.unreadOnly()).isNull();
    }
}
