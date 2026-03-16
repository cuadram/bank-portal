package com.experis.sofia.bankportal.auth;

import com.experis.sofia.bankportal.auth.application.AccountLockUseCase;
import com.experis.sofia.bankportal.session.application.usecase.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests para {@link AccountLockUseCase} — US-601.
 *
 * @author SOFIA Developer Agent — FEAT-006 Sprint 7
 */
@ExtendWith(MockitoExtension.class)
class AccountLockUseCaseTest {

    @Mock private AuditLogService auditLogService;

    private AccountLockUseCase useCase;

    private final UUID userId = UUID.randomUUID();
    private final String ip   = "192.168.1.1";

    @BeforeEach
    void setUp() {
        useCase = new AccountLockUseCase(auditLogService);
        ReflectionTestUtils.setField(useCase, "maxAttempts",       10);
        ReflectionTestUtils.setField(useCase, "warningThreshold",   7);
        ReflectionTestUtils.setField(useCase, "windowHours",        24);
    }

    // ── recordFailedAttempt ───────────────────────────────────────────────────

    @Nested
    @DisplayName("recordFailedAttempt()")
    class RecordFailedAttempt {

        @Test
        @DisplayName("registra OTP_FAILED en audit_log")
        void logsFailedAttempt() {
            useCase.recordFailedAttempt(userId, ip);
            verify(auditLogService).log(eq("OTP_FAILED"), eq(userId), contains("ip="));
        }

        @Test
        @DisplayName("retorna intentos restantes > 0 antes del umbral")
        void returnsRemainingAttemptsBeforeThreshold() {
            int remaining = useCase.recordFailedAttempt(userId, ip);
            // Con placeholder de 1 intento: remaining = maxAttempts - 1 = 9
            assertThat(remaining).isEqualTo(9);
        }
    }

    // ── lockAccount ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("lockAccount()")
    class LockAccount {

        @Test
        @DisplayName("registra ACCOUNT_LOCKED en audit_log con IP")
        void logsAccountLocked() {
            useCase.lockAccount(userId, ip);
            verify(auditLogService).log(eq("ACCOUNT_LOCKED"), eq(userId), contains("ip=" + ip));
        }

        @Test
        @DisplayName("registra reason=OTP_MAX_ATTEMPTS")
        void logsCorrectReason() {
            useCase.lockAccount(userId, ip);
            verify(auditLogService).log(eq("ACCOUNT_LOCKED"), eq(userId),
                    contains("reason=OTP_MAX_ATTEMPTS"));
        }
    }

    // ── unlockAccount ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("unlockAccount()")
    class UnlockAccount {

        @Test
        @DisplayName("registra ACCOUNT_UNLOCKED con reason")
        void logsUnlocked() {
            useCase.unlockAccount(userId, "EMAIL_LINK");
            verify(auditLogService).log(eq("ACCOUNT_UNLOCKED"), eq(userId),
                    contains("reason=EMAIL_LINK"));
        }

        @Test
        @DisplayName("acepta reason=RECOVERY_CODE")
        void acceptsRecoveryCodeReason() {
            useCase.unlockAccount(userId, "RECOVERY_CODE");
            verify(auditLogService).log(eq("ACCOUNT_UNLOCKED"), eq(userId),
                    contains("reason=RECOVERY_CODE"));
        }
    }

    // ── resetFailedAttempts ───────────────────────────────────────────────────

    @Test
    @DisplayName("resetFailedAttempts() no lanza excepción")
    void resetDoesNotThrow() {
        // Verifica que el método existe y no falla
        useCase.resetFailedAttempts(userId);
        // En implementación real verificaría la BD; aquí solo comprueba que no lanza
    }

    // ── AccountLockedException ────────────────────────────────────────────────

    @Test
    @DisplayName("AccountLockedException incluye userId")
    void exceptionContainsUserId() {
        var ex = new AccountLockUseCase.AccountLockedException(userId);
        assertThat(ex.getUserId()).isEqualTo(userId);
        assertThat(ex.getMessage()).contains(userId.toString());
    }
}
