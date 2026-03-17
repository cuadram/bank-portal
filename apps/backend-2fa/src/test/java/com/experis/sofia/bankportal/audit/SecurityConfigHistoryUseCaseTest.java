package com.experis.sofia.bankportal.audit;

import com.experis.sofia.bankportal.audit.application.SecurityConfigHistoryUseCase;
import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.audit.infrastructure.AuditLogQueryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static com.experis.sofia.bankportal.audit.application.SecurityConfigHistoryUseCase.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — US-604 SecurityConfigHistoryUseCase.
 *
 * <p>Escenarios:
 * <ol>
 *   <li>getHistory sin override → windowStart = now - 90 días</li>
 *   <li>getHistory con sinceOverride dentro de 90 días → usa sinceOverride</li>
 *   <li>getHistory con sinceOverride > 90 días → clampea a maxWindow</li>
 *   <li>Retorna lista vacía cuando no hay eventos → no lanza excepción</li>
 *   <li>Audita CONFIG_HISTORY_VIEWED con count correcto</li>
 *   <li>CONFIG_EVENT_TYPES contiene los 9 tipos requeridos</li>
 * </ol>
 *
 * @author SOFIA QA Agent — Sprint 7
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("US-604 - SecurityConfigHistoryUseCase")
class SecurityConfigHistoryUseCaseTest {

    @Mock AuditLogQueryRepository auditLogQueryRepository;
    @Mock AuditLogService         auditLogService;

    @InjectMocks SecurityConfigHistoryUseCase useCase;

    private static final UUID USER_ID = UUID.randomUUID();

    private ConfigHistoryEntry entry(String eventType) {
        return new ConfigHistoryEntry(
                UUID.randomUUID(), eventType, "desc",
                Instant.now(), "192.168.1", false);
    }

    // ─────────────────────────────────────────────────────────────────────────

    @Nested @DisplayName("getHistory - ventana de tiempo")
    class WindowComputation {

        @Test @DisplayName("Sin override → windowStart ~= now - 90 días")
        void noOverride_uses90DayWindow() {
            when(auditLogQueryRepository.findConfigChangesByUserId(
                    eq(USER_ID), anyList(), any(Instant.class)))
                    .thenReturn(List.of());

            useCase.getHistory(USER_ID);

            verify(auditLogQueryRepository).findConfigChangesByUserId(
                    eq(USER_ID),
                    eq(CONFIG_EVENT_TYPES),
                    argThat(since -> {
                        Instant expected = Instant.now().minus(HISTORY_WINDOW_DAYS, ChronoUnit.DAYS);
                        // Tolerancia 5 segundos
                        return Math.abs(since.toEpochMilli() - expected.toEpochMilli()) < 5_000;
                    }));
        }

        @Test @DisplayName("sinceOverride dentro de 90d → usa sinceOverride")
        void overrideWithinWindow_usesOverride() {
            Instant override = Instant.now().minus(10, ChronoUnit.DAYS);
            when(auditLogQueryRepository.findConfigChangesByUserId(
                    eq(USER_ID), anyList(), eq(override)))
                    .thenReturn(List.of());

            useCase.getHistory(USER_ID, override);

            verify(auditLogQueryRepository).findConfigChangesByUserId(
                    eq(USER_ID), eq(CONFIG_EVENT_TYPES), eq(override));
        }

        @Test @DisplayName("sinceOverride > 90d → clampea a maxWindow (90d)")
        void overrideExceeds90d_clampsToMaxWindow() {
            Instant tooOld = Instant.now().minus(200, ChronoUnit.DAYS);
            when(auditLogQueryRepository.findConfigChangesByUserId(
                    eq(USER_ID), anyList(), any(Instant.class)))
                    .thenReturn(List.of());

            useCase.getHistory(USER_ID, tooOld);

            verify(auditLogQueryRepository).findConfigChangesByUserId(
                    eq(USER_ID),
                    eq(CONFIG_EVENT_TYPES),
                    argThat(since -> {
                        Instant maxWindow = Instant.now().minus(HISTORY_WINDOW_DAYS, ChronoUnit.DAYS);
                        return Math.abs(since.toEpochMilli() - maxWindow.toEpochMilli()) < 5_000;
                    }));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────

    @Nested @DisplayName("getHistory - retorno y auditoría")
    class ReturnAndAudit {

        @Test @DisplayName("Lista vacía → retorna vacía sin excepción")
        void emptyList_noException() {
            when(auditLogQueryRepository.findConfigChangesByUserId(
                    eq(USER_ID), anyList(), any()))
                    .thenReturn(List.of());

            List<ConfigHistoryEntry> result = useCase.getHistory(USER_ID);
            assertThat(result).isEmpty();
        }

        @Test @DisplayName("Lista con 3 entradas → retorna las 3")
        void threeEntries_returnedAll() {
            List<ConfigHistoryEntry> data = List.of(
                    entry("PREFERENCES_UPDATED"),
                    entry("TWO_FA_ENABLED"),
                    entry("PASSWORD_CHANGED"));
            when(auditLogQueryRepository.findConfigChangesByUserId(
                    eq(USER_ID), anyList(), any()))
                    .thenReturn(data);

            List<ConfigHistoryEntry> result = useCase.getHistory(USER_ID);
            assertThat(result).hasSize(3);
        }

        @Test @DisplayName("Audita CONFIG_HISTORY_VIEWED con count correcto")
        void auditsViewedWithCount() {
            List<ConfigHistoryEntry> data = List.of(entry("PASSWORD_CHANGED"));
            when(auditLogQueryRepository.findConfigChangesByUserId(
                    eq(USER_ID), anyList(), any()))
                    .thenReturn(data);

            useCase.getHistory(USER_ID);

            verify(auditLogService).log(
                    eq("CONFIG_HISTORY_VIEWED"),
                    eq(USER_ID),
                    contains("entries=1"));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("CONFIG_EVENT_TYPES contiene los 9 tipos requeridos por R-F6-004")
    void configEventTypes_containsRequired9() {
        assertThat(CONFIG_EVENT_TYPES).containsExactlyInAnyOrder(
                "PREFERENCES_UPDATED",
                "PASSWORD_CHANGED",
                "TWO_FA_ENABLED",
                "TWO_FA_DISABLED",
                "TRUSTED_DEVICE_ADDED",
                "TRUSTED_DEVICE_REMOVED",
                "NOTIFICATION_PREFS_UPDATED",
                "LOGIN_NEW_CONTEXT_CONFIRMED",
                "ACCOUNT_UNLOCKED"
        );
    }
}
