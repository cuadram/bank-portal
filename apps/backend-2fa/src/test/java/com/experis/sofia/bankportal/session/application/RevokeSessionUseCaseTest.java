package com.experis.sofia.bankportal.session.application;

import com.experis.sofia.bankportal.session.application.usecase.AuditLogService;
import com.experis.sofia.bankportal.session.application.usecase.RevokeSessionUseCase;
import com.experis.sofia.bankportal.session.application.usecase.RevokeSessionUseCase.CannotRevokeCurrentSessionException;
import com.experis.sofia.bankportal.session.application.usecase.RevokeSessionUseCase.SessionNotFoundException;
import com.experis.sofia.bankportal.session.domain.model.DeviceInfo;
import com.experis.sofia.bankportal.session.domain.model.SessionRevocationReason;
import com.experis.sofia.bankportal.session.domain.model.UserSession;
import com.experis.sofia.bankportal.session.domain.repository.UserSessionRepository;
import com.experis.sofia.bankportal.session.infrastructure.cache.SessionRedisAdapter;
import com.experis.sofia.bankportal.twofa.domain.service.TwoFactorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para {@link RevokeSessionUseCase}.
 * Cubre US-102: revocación individual con confirmación OTP.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@ExtendWith(MockitoExtension.class)
class RevokeSessionUseCaseTest {

    @Mock private UserSessionRepository sessionRepository;
    @Mock private SessionRedisAdapter   redisAdapter;
    @Mock private TwoFactorService      twoFactorService;
    @Mock private AuditLogService       auditLogService;

    private RevokeSessionUseCase useCase;

    private final UUID userId     = UUID.randomUUID();
    private final UUID sessionId  = UUID.randomUUID();
    private final String otherJti = UUID.randomUUID().toString();
    private final String myJti    = UUID.randomUUID().toString();

    @BeforeEach
    void setUp() {
        useCase = new RevokeSessionUseCase(
                sessionRepository, redisAdapter, twoFactorService, auditLogService);
    }

    @Nested
    @DisplayName("happy path")
    class HappyPath {

        @Test
        @DisplayName("revokes session: blacklists in Redis and marks in DB")
        void revokesSuccessfully() {
            // Arrange
            var session = buildSession(sessionId, otherJti);
            doNothing().when(twoFactorService).verifyCurrentOtp(userId, "123456");
            when(sessionRepository.findActiveByIdAndUserId(sessionId, userId))
                    .thenReturn(Optional.of(session));
            when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            useCase.execute(sessionId, userId, myJti, "123456");

            // Assert
            verify(redisAdapter).addToBlacklist(eq(otherJti), any());
            verify(sessionRepository).save(argThat(s ->
                    s.getRevokeReason() == SessionRevocationReason.MANUAL));
            verify(auditLogService).log(eq("SESSION_REVOKED"), eq(userId), any());
        }
    }

    @Nested
    @DisplayName("error paths")
    class ErrorPaths {

        @Test
        @DisplayName("throws when session not found or not owned by user")
        void throwsWhenSessionNotFound() {
            // Arrange
            doNothing().when(twoFactorService).verifyCurrentOtp(any(), any());
            when(sessionRepository.findActiveByIdAndUserId(sessionId, userId))
                    .thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> useCase.execute(sessionId, userId, myJti, "123456"))
                    .isInstanceOf(SessionNotFoundException.class);
            verify(redisAdapter, never()).addToBlacklist(any(), any());
        }

        @Test
        @DisplayName("throws when trying to revoke current session")
        void throwsWhenRevokingCurrentSession() {
            // Arrange — la sesión tiene el mismo JTI que la sesión actual
            var currentSession = buildSession(sessionId, myJti);
            doNothing().when(twoFactorService).verifyCurrentOtp(any(), any());
            when(sessionRepository.findActiveByIdAndUserId(sessionId, userId))
                    .thenReturn(Optional.of(currentSession));

            // Act & Assert
            assertThatThrownBy(() -> useCase.execute(sessionId, userId, myJti, "123456"))
                    .isInstanceOf(CannotRevokeCurrentSessionException.class);
            verify(redisAdapter, never()).addToBlacklist(any(), any());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private UserSession buildSession(UUID id, String jti) {
        var device = new DeviceInfo("Windows", "Edge", "desktop", "ua");
        return new UserSession(id, userId, jti, "hash",
                device, "10.0.x.x",
                LocalDateTime.now().minusMinutes(30),
                LocalDateTime.now().minusMinutes(5));
    }
}
