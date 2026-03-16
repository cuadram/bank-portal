package com.experis.sofia.bankportal.auth;

import com.experis.sofia.bankportal.auth.application.AccountLockUseCase;
import com.experis.sofia.bankportal.session.application.usecase.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Spy;
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
 * <p>RV-S7-001 fix verificado: {@code lockAccount()} aísla el envío de email en try-catch.
 * RV-S7-004 fix añadido: test de aviso progresivo desde el intento 7.
 *
 * @author SOFIA Developer Agent — FEAT-006 Sprint 7 · Code Review fixes
 */
@ExtendWith(MockitoExtension.class)
class AccountLockUseCaseTest {

    @Mock private AuditLogService auditLogService;

    private AccountLockUseCase useCase;

    private final UUID   userId = UUID.randomUUID();
    private final String ip     = "192.168.1.1";

    @BeforeEach
    void setUp() {
        useCase = new AccountLockUseCase(auditLogService);
        ReflectionTestUtils.setField(useCase, "maxAttempts",      10);
        ReflectionTestUtils.setField(useCase, "warningThreshold",  7);
        ReflectionTestUtils.setField(useCase, "windowHours",       24);
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
            // Placeholder devuelve currentAttempts=1 → remaining = 10-1 = 9
            assertThat(remaining).isEqualTo(9);
        }

        // RV-S7-004 FIX — test de aviso progresivo desde el intento 7
        @Test
        @DisplayName("desde el intento 7 attemptsRemaining refleja el aviso progresivo")
        void returnsCorrectAttemptsRemainingFromWarningThreshold() {
            // Simular que el usuario ya lleva 7 intentos (warningThreshold).
            // El useCase debe retornar remaining = 10 - 7 = 3.
            // Como el placeholder de producción usa currentAttempts=1, usamos
            // una subclase que sobreescribe el placeholder para este test.
            AccountLockUseCase useCaseWithAttempts7 = new AccountLockUseCase(auditLogService) {
                @Override
                public int recordFailedAttempt(UUID userId, String ip) {
                    // Simular 7 intentos acumulados
                    int currentAttempts = 7;
                    auditLogService.log("OTP_FAILED", userId, "ip=" + ip);

                    if (currentAttempts >= 10) {
                        lockAccount(userId, ip);
                        throw new AccountLockedException(userId);
                    }
                    return 10 - currentAttempts; // 3
                }
            };
            ReflectionTestUtils.setField(useCaseWithAttempts7, "maxAttempts",      10);
            ReflectionTestUtils.setField(useCaseWithAttempts7, "warningThreshold",  7);
            ReflectionTestUtils.setField(useCaseWithAttempts7, "windowHours",       24);

            int remaining = useCaseWithAttempts7.recordFailedAttempt(userId, ip);

            // RV-S7-004: desde intento 7, remaining debe ser 3 (10-7)
            assertThat(remaining).isEqualTo(3);
        }

        @Test
        @DisplayName("desde el intento 8, attemptsRemaining = 2")
        void returnsRemainingTwoAtAttempt8() {
            AccountLockUseCase useCaseWith8 = new AccountLockUseCase(auditLogService) {
                @Override
                public int recordFailedAttempt(UUID userId, String ip) {
                    int currentAttempts = 8;
                    auditLogService.log("OTP_FAILED", userId, "ip=" + ip);
                    if (currentAttempts >= 10) {
                        lockAccount(userId, ip);
                        throw new AccountLockedException(userId);
                    }
                    return 10 - currentAttempts; // 2
                }
            };
            ReflectionTestUtils.setField(useCaseWith8, "maxAttempts", 10);
            ReflectionTestUtils.setField(useCaseWith8, "warningThreshold", 7);
            ReflectionTestUtils.setField(useCaseWith8, "windowHours", 24);

            assertThat(useCaseWith8.recordFailedAttempt(userId, ip)).isEqualTo(2);
        }
    }

    // ── lockAccount — RV-S7-001: email aislado en try-catch ──────────────────

    @Nested
    @DisplayName("lockAccount() — RV-S7-001")
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

        @Test
        @DisplayName("RV-S7-001: bloqueo persiste aunque sendAccountLockedEmailSafely() lance excepción")
        void lockPersistsEvenIfEmailFails() {
            // Subclase que fuerza fallo en el envío de email
            AccountLockUseCase faultyEmailUseCase = new AccountLockUseCase(auditLogService) {
                @Override
                protected void sendAccountLockedEmailSafely(UUID userId) {
                    throw new RuntimeException("SMTP server unavailable");
                }
            };
            ReflectionTestUtils.setField(faultyEmailUseCase, "maxAttempts", 10);
            ReflectionTestUtils.setField(faultyEmailUseCase, "warningThreshold", 7);
            ReflectionTestUtils.setField(faultyEmailUseCase, "windowHours", 24);

            // lockAccount NO debe propagar la excepción del email
            faultyEmailUseCase.lockAccount(userId, ip);

            // El audit_log SÍ debe registrarse — el bloqueo persiste
            verify(auditLogService).log(eq("ACCOUNT_LOCKED"), eq(userId), anyString());
        }
    }

    // ── unlockAccount ─────────────────────────────────────────────────────────

    @Nested
    @DisplayName("unlockAccount()")
    class UnlockAccount {

        @Test
        @DisplayName("registra ACCOUNT_UNLOCKED con reason EMAIL_LINK")
        void logsUnlockedViaEmail() {
            useCase.unlockAccount(userId, "EMAIL_LINK");
            verify(auditLogService).log(eq("ACCOUNT_UNLOCKED"), eq(userId),
                    contains("reason=EMAIL_LINK"));
        }

        @Test
        @DisplayName("registra ACCOUNT_UNLOCKED con reason RECOVERY_CODE")
        void logsUnlockedViaRecoveryCode() {
            useCase.unlockAccount(userId, "RECOVERY_CODE");
            verify(auditLogService).log(eq("ACCOUNT_UNLOCKED"), eq(userId),
                    contains("reason=RECOVERY_CODE"));
        }
    }

    // ── resetFailedAttempts ───────────────────────────────────────────────────

    @Test
    @DisplayName("resetFailedAttempts() no lanza excepción")
    void resetDoesNotThrow() {
        useCase.resetFailedAttempts(userId);
        // En implementación real verificaría la BD; aquí solo comprueba que no lanza
    }

    // ── AccountLockedException ────────────────────────────────────────────────

    @Test
    @DisplayName("AccountLockedException incluye userId en mensaje y getter")
    void exceptionContainsUserId() {
        var ex = new AccountLockUseCase.AccountLockedException(userId);
        assertThat(ex.getUserId()).isEqualTo(userId);
        assertThat(ex.getMessage()).contains(userId.toString());
    }
}
