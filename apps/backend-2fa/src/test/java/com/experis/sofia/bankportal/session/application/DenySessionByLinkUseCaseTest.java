package com.experis.sofia.bankportal.session.application;

import com.experis.sofia.bankportal.session.application.usecase.AuditLogService;
import com.experis.sofia.bankportal.session.application.usecase.DenySessionByLinkUseCase;
import com.experis.sofia.bankportal.session.application.usecase.DenySessionByLinkUseCase.InvalidDenyTokenException;
import com.experis.sofia.bankportal.session.domain.model.DeviceInfo;
import com.experis.sofia.bankportal.session.domain.model.SessionRevocationReason;
import com.experis.sofia.bankportal.session.domain.model.UserSession;
import com.experis.sofia.bankportal.session.domain.repository.UserSessionRepository;
import com.experis.sofia.bankportal.session.infrastructure.cache.SessionRedisAdapter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para {@link DenySessionByLinkUseCase} — FEAT-002 cierre US-105b.
 * Verifica el ciclo completo HMAC: generación → verificación → revocación.
 *
 * @author SOFIA Developer Agent — FEAT-003 Sprint 4
 */
@ExtendWith(MockitoExtension.class)
class DenySessionByLinkUseCaseTest {

    @Mock private UserSessionRepository sessionRepository;
    @Mock private SessionRedisAdapter   redisAdapter;
    @Mock private AuditLogService       auditLogService;

    private DenySessionByLinkUseCase useCase;

    private final String testHmacKey = "test-hmac-key-32-bytes-for-testing!!";
    private final UUID   userId      = UUID.randomUUID();
    private final String jti         = UUID.randomUUID().toString();

    @BeforeEach
    void setUp() {
        useCase = new DenySessionByLinkUseCase(sessionRepository, redisAdapter, auditLogService);
        ReflectionTestUtils.setField(useCase, "hmacKey", testHmacKey);
        ReflectionTestUtils.setField(useCase, "ttlHours", 24);
    }

    // ── Generación + ejecución ────────────────────────────────────────────────

    @Nested
    @DisplayName("happy path — valid token")
    class HappyPath {

        @Test
        @DisplayName("generates token and executes denial — revokes session")
        void generateAndExecute() {
            // Arrange
            String token = useCase.generateDenyToken(jti, userId);
            when(redisAdapter.hasKey(any())).thenReturn(false);
            when(sessionRepository.findActiveByJti(jti))
                    .thenReturn(Optional.of(buildSession(jti)));
            when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            assertThatCode(() -> useCase.execute(token)).doesNotThrowAnyException();

            // Assert: sesión revocada con DENY_LINK
            verify(sessionRepository).save(argThat(s ->
                    s.getRevokeReason() == SessionRevocationReason.DENY_LINK));
            verify(redisAdapter).addToBlacklist(eq(jti), any());
            verify(auditLogService).log(eq("SESSION_DENIED_BY_USER"), eq(userId), any());
        }

        @Test
        @DisplayName("one-time use: second execution throws TOKEN_ALREADY_USED")
        void oneTimeUse() {
            String token = useCase.generateDenyToken(jti, userId);
            when(redisAdapter.hasKey(any())).thenReturn(true);  // ya usado

            assertThatThrownBy(() -> useCase.execute(token))
                    .isInstanceOf(InvalidDenyTokenException.class)
                    .hasMessageContaining("TOKEN_ALREADY_USED");
        }
    }

    // ── Tokens inválidos ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("error paths — invalid tokens")
    class ErrorPaths {

        @Test
        @DisplayName("rejects tampered token (invalid HMAC)")
        void rejectsTamperedToken() {
            String valid = useCase.generateDenyToken(jti, userId);
            String tampered = valid.substring(0, valid.length() - 4) + "XXXX";

            assertThatThrownBy(() -> useCase.execute(tampered))
                    .isInstanceOf(InvalidDenyTokenException.class)
                    .hasMessageContaining("TOKEN_INVALID");
        }

        @Test
        @DisplayName("rejects malformed token")
        void rejectsMalformed() {
            assertThatThrownBy(() -> useCase.execute("not-a-valid-base64-token!!"))
                    .isInstanceOf(InvalidDenyTokenException.class);
        }

        @Test
        @DisplayName("no session revocation when session is already inactive")
        void gracefulWhenSessionNotFound() {
            String token = useCase.generateDenyToken(jti, userId);
            when(redisAdapter.hasKey(any())).thenReturn(false);
            when(sessionRepository.findActiveByJti(jti)).thenReturn(Optional.empty());

            // No lanza excepción — la sesión ya no existe (puede haber sido revocada antes)
            assertThatCode(() -> useCase.execute(token)).doesNotThrowAnyException();
            verify(sessionRepository, never()).save(any());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private UserSession buildSession(String jti) {
        var device = new DeviceInfo("macOS", "Safari", "desktop", "ua");
        return new UserSession(UUID.randomUUID(), userId, jti, "hash",
                device, "192.168.x.x",
                LocalDateTime.now().minusMinutes(30),
                LocalDateTime.now().minusMinutes(5));
    }
}
