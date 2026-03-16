package com.experis.sofia.bankportal.audit.unit.application;

import com.experis.sofia.bankportal.audit.application.SecurityDashboardUseCase;
import com.experis.sofia.bankportal.audit.application.SecurityDashboardUseCase.*;
import com.experis.sofia.bankportal.audit.infrastructure.AuditLogQueryRepository;
import com.experis.sofia.bankportal.notification.domain.UserNotificationRepository;
import com.experis.sofia.bankportal.session.domain.repository.UserSessionRepository;
import com.experis.sofia.bankportal.trusteddevice.domain.TrustedDeviceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executor;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — SecurityDashboardUseCase
 * DEBT-008: verifica queries paralelas con CompletableFuture.allOf()
 * US-401:   verifica SecurityScore + respuesta correcta
 * US-604:   verifica getConfigHistory()
 *
 * @author SOFIA Developer Agent — Sprint 7
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SecurityDashboardUseCase")
class SecurityDashboardUseCaseTest {

    @Mock AuditLogQueryRepository    auditRepo;
    @Mock UserSessionRepository      sessionRepo;
    @Mock TrustedDeviceRepository    deviceRepo;
    @Mock UserNotificationRepository notifRepo;

    // Executor síncrono — ejecuta en el thread del caller, sin asincronía real en tests
    private final Executor syncExecutor = Runnable::run;

    private SecurityDashboardUseCase useCase;
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        useCase = new SecurityDashboardUseCase(
            auditRepo, sessionRepo, deviceRepo, notifRepo, syncExecutor);
    }

    // ── DEBT-008: paralelismo ────────────────────────────────────────────────

    @Test
    @DisplayName("DEBT-008: todas las 6 queries se ejecutan exactamente una vez")
    void debt008_allSixQueriesExecutedExactlyOnce() {
        stubAllQueries(Map.of("LOGIN_SUCCESS", 5L), 1);

        useCase.execute(userId, true);

        verify(auditRepo, times(1)).countEventsByTypeAndPeriod(userId, 30);
        verify(sessionRepo, times(1)).countActiveByUserId(userId);
        verify(deviceRepo,  times(1)).countActiveByUserId(userId);
        verify(notifRepo,   times(1)).countUnreadByUserId(userId);
        verify(auditRepo, times(1)).findRecentByUserId(eq(userId), eq(10));
        verify(auditRepo, times(1)).findDailyActivityByUserId(eq(userId), eq(30));
    }

    @Test
    @DisplayName("DEBT-008: respuesta ensamblada correctamente con datos de las 6 queries")
    void debt008_responseAssembledFromAllQueries() {
        when(auditRepo.countEventsByTypeAndPeriod(userId, 30))
            .thenReturn(Map.of("LOGIN_SUCCESS", 8L, "LOGIN_FAILED", 2L,
                               "TRUSTED_DEVICE_LOGIN", 3L));
        when(sessionRepo.countActiveByUserId(userId)).thenReturn(2);
        when(deviceRepo.countActiveByUserId(userId)).thenReturn(3);
        when(notifRepo.countUnreadByUserId(userId)).thenReturn(5L);
        when(auditRepo.findRecentByUserId(eq(userId), anyInt())).thenReturn(List.of());
        when(auditRepo.findDailyActivityByUserId(eq(userId), anyInt())).thenReturn(List.of());

        SecurityDashboardResponse resp = useCase.execute(userId, true);

        assertThat(resp.loginCount30d()).isEqualTo(11);       // 8 + 3 TRUSTED_DEVICE_LOGIN
        assertThat(resp.failedAttempts30d()).isEqualTo(2);
        assertThat(resp.activeSessions()).isEqualTo(2);
        assertThat(resp.trustedDevices()).isEqualTo(3);
        assertThat(resp.unreadNotifications()).isEqualTo(5L);
    }

    // ── US-401: SecurityScore ────────────────────────────────────────────────

    @Test
    @DisplayName("SecurityScore: SECURE — 2FA activo, < 3 intentos fallidos, <= 3 sesiones")
    void score_secure() {
        stubAllQueries(Map.of("LOGIN_SUCCESS", 5L, "LOGIN_FAILED", 2L), 2);

        assertThat(useCase.execute(userId, true).securityScore()).isEqualTo("SECURE");
    }

    @Test
    @DisplayName("SecurityScore: ALERT — 2FA inactivo siempre devuelve ALERT")
    void score_alert_whenTwoFaOff() {
        stubAllQueries(Map.of("LOGIN_SUCCESS", 5L), 1);

        assertThat(useCase.execute(userId, false).securityScore()).isEqualTo("ALERT");
    }

    @Test
    @DisplayName("SecurityScore: REVIEW — >= 3 intentos fallidos")
    void score_review_whenFailedAttemptsReachThreshold() {
        stubAllQueries(Map.of("LOGIN_FAILED", 3L), 1);

        assertThat(useCase.execute(userId, true).securityScore()).isEqualTo("REVIEW");
    }

    @Test
    @DisplayName("SecurityScore: REVIEW — > 3 sesiones activas")
    void score_review_whenTooManySessions() {
        stubAllQueries(Map.of("LOGIN_SUCCESS", 5L), 4);

        assertThat(useCase.execute(userId, true).securityScore()).isEqualTo("REVIEW");
    }

    @Test
    @DisplayName("SecurityScore: ALERT tiene prioridad sobre REVIEW cuando 2FA inactivo")
    void score_alert_takesPriorityOverReview() {
        // 2FA off + 3 failed attempts + 4 sessions → ALERT (2FA off gana)
        stubAllQueries(Map.of("LOGIN_FAILED", 5L), 5);

        assertThat(useCase.execute(userId, false).securityScore()).isEqualTo("ALERT");
    }

    // ── US-604: Config History ───────────────────────────────────────────────

    @Test
    @DisplayName("US-604: getConfigHistory delega en auditRepo con userId y days exactos")
    void configHistory_delegatesToRepo() {
        List<AuditEventSummary> expected = List.of(
            new AuditEventSummary("TWO_FA_ACTIVATED", "2FA activado",
                                  "192.168.x.x", LocalDateTime.now(), false)
        );
        when(auditRepo.findConfigChangesByUserId(userId, 30)).thenReturn(expected);

        List<AuditEventSummary> result = useCase.getConfigHistory(userId, 30);

        assertThat(result).isEqualTo(expected);
        verify(auditRepo).findConfigChangesByUserId(userId, 30);
    }

    @Test
    @DisplayName("US-604: getConfigHistory limita el período a 90 días máximo")
    void configHistory_capsDaysAt90() {
        when(auditRepo.findConfigChangesByUserId(userId, 90)).thenReturn(List.of());

        useCase.getConfigHistory(userId, 9999);

        verify(auditRepo).findConfigChangesByUserId(userId, 90);
        verify(auditRepo, never()).findConfigChangesByUserId(userId, 9999);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void stubAllQueries(Map<String, Long> counts, int sessions) {
        when(auditRepo.countEventsByTypeAndPeriod(userId, 30)).thenReturn(counts);
        when(sessionRepo.countActiveByUserId(userId)).thenReturn(sessions);
        when(deviceRepo.countActiveByUserId(userId)).thenReturn(1);
        when(notifRepo.countUnreadByUserId(userId)).thenReturn(0L);
        when(auditRepo.findRecentByUserId(eq(userId), anyInt())).thenReturn(List.of());
        when(auditRepo.findDailyActivityByUserId(eq(userId), anyInt())).thenReturn(List.of());
    }
}
