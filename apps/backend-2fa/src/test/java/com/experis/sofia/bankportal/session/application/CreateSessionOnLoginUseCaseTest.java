package com.experis.sofia.bankportal.session.application;

import com.experis.sofia.bankportal.session.application.usecase.AuditLogService;
import com.experis.sofia.bankportal.session.application.usecase.CreateSessionOnLoginUseCase;
import com.experis.sofia.bankportal.session.domain.model.DeviceInfo;
import com.experis.sofia.bankportal.session.domain.model.SessionRevocationReason;
import com.experis.sofia.bankportal.session.domain.model.UserSession;
import com.experis.sofia.bankportal.session.domain.repository.UserSessionRepository;
import com.experis.sofia.bankportal.session.domain.service.SessionDomainService;
import com.experis.sofia.bankportal.session.infrastructure.cache.SessionRedisAdapter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para {@link CreateSessionOnLoginUseCase}.
 * Cubre US-104: control de concurrencia y evicción LRU.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@ExtendWith(MockitoExtension.class)
class CreateSessionOnLoginUseCaseTest {

    @Mock private UserSessionRepository sessionRepository;
    @Mock private SessionRedisAdapter   redisAdapter;
    @Mock private AuditLogService       auditLogService;

    private SessionDomainService          domainService;
    private CreateSessionOnLoginUseCase   useCase;

    private final UUID   userId    = UUID.randomUUID();
    private final DeviceInfo device = new DeviceInfo("macOS","Chrome","desktop","ua");

    @BeforeEach
    void setUp() {
        domainService = new SessionDomainService();
        useCase = new CreateSessionOnLoginUseCase(
                sessionRepository, redisAdapter, domainService, auditLogService);
    }

    @Nested
    @DisplayName("when user has fewer than MAX sessions")
    class BelowLimit {

        @Test
        @DisplayName("creates session without eviction")
        void createsWithoutEviction() {
            // Arrange
            when(sessionRepository.findAllActiveByUserId(userId))
                    .thenReturn(buildSessions(2));
            when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            var result = useCase.execute(userId, "jti-new", "hash-new", device,
                                          "192.168.1.1", 30);

            // Assert
            assertThat(result.getUserId()).isEqualTo(userId);
            assertThat(result.getJti()).isEqualTo("jti-new");
            verify(redisAdapter, never()).addToBlacklist(any(), any());
            verify(auditLogService, never()).log(eq("SESSION_EVICTED"), any(), any());
        }
    }

    @Nested
    @DisplayName("when user has MAX_CONCURRENT_SESSIONS active")
    class AtLimit {

        @Test
        @DisplayName("evicts LRU session before creating new one")
        void evictsLruBeforeCreating() {
            // Arrange — 3 sesiones activas, la más antigua hace 5h
            var sessions = buildSessions(3);
            var oldest   = buildSessionWithLastActivity(LocalDateTime.now().minusHours(5));
            sessions.add(oldest);

            // Solo 3 en la lista (el limite es MAX_CONCURRENT=3)
            var limitedSessions = List.of(sessions.get(0), sessions.get(1), oldest);
            when(sessionRepository.findAllActiveByUserId(userId)).thenReturn(limitedSessions);
            when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            useCase.execute(userId, "jti-new", "hash", device, "10.0.0.1", 30);

            // Assert: la sesión eviccionada es la más antigua
            var savedCaptor = ArgumentCaptor.forClass(UserSession.class);
            verify(sessionRepository, atLeastOnce()).save(savedCaptor.capture());

            var evicted = savedCaptor.getAllValues().stream()
                    .filter(s -> s.getRevokeReason() == SessionRevocationReason.SESSION_EVICTED)
                    .findFirst();
            assertThat(evicted).isPresent();
            assertThat(evicted.get().getJti()).isEqualTo(oldest.getJti());

            // Redis blacklist debe haberse llamado
            verify(redisAdapter).addToBlacklist(eq(oldest.getJti()), any());

            // Audit log de evicción
            verify(auditLogService).log(eq("SESSION_EVICTED"), eq(userId), any());
        }

        @Test
        @DisplayName("new session is always created after eviction")
        void alwaysCreatesNewSession() {
            // Arrange
            var limitedSessions = buildSessions(3);
            when(sessionRepository.findAllActiveByUserId(userId)).thenReturn(limitedSessions);
            when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            var result = useCase.execute(userId, "jti-brand-new", "hash", device, "1.2.3.4", 30);

            // Assert
            assertThat(result.getJti()).isEqualTo("jti-brand-new");
            assertThat(result.isActive()).isTrue();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private List<UserSession> buildSessions(int count) {
        var list = new ArrayList<UserSession>();
        for (int i = 0; i < count; i++) {
            list.add(buildSessionWithLastActivity(
                    LocalDateTime.now().minusMinutes(10L * (i + 1))));
        }
        return list;
    }

    private UserSession buildSessionWithLastActivity(LocalDateTime lastActivity) {
        return new UserSession(UUID.randomUUID(), userId,
                UUID.randomUUID().toString(), "hash",
                device, "192.168.x.x",
                LocalDateTime.now().minusHours(1), lastActivity);
    }
}
