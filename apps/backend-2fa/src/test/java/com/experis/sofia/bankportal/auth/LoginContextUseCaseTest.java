package com.experis.sofia.bankportal.auth;

import com.experis.sofia.bankportal.auth.application.LoginContextUseCase;
import com.experis.sofia.bankportal.session.application.usecase.AuditLogService;
import com.experis.sofia.bankportal.session.domain.service.DeviceFingerprintService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests para {@link LoginContextUseCase} — US-603.
 *
 * @author SOFIA Developer Agent — FEAT-006 Sprint 7
 */
@ExtendWith(MockitoExtension.class)
class LoginContextUseCaseTest {

    @Mock private DeviceFingerprintService fingerprintService;
    @Mock private AuditLogService          auditLogService;

    private LoginContextUseCase useCase;

    private final UUID   userId = UUID.randomUUID();
    private final String rawIp  = "192.168.1.1";

    @BeforeEach
    void setUp() {
        useCase = new LoginContextUseCase(fingerprintService, auditLogService);
        ReflectionTestUtils.setField(useCase, "confirmHmacKey",   "test-confirm-key-32bytes!!");
        ReflectionTestUtils.setField(useCase, "contextCheckEnabled", true);
        ReflectionTestUtils.setField(useCase, "confirmTtlMinutes", 15);
        when(fingerprintService.extractIpSubnet(rawIp)).thenReturn("192.168");
    }

    // ── evaluate() ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("evaluate() — detección de contexto")
    class Evaluate {

        @Test
        @DisplayName("subnet nueva → context-pending con subnet y confirmToken")
        void newSubnetReturnsContextPending() {
            var result = useCase.evaluate(userId, rawIp);

            assertThat(result.isContextPending()).isTrue();
            var cp = (LoginContextUseCase.ContextEvaluationResult.ContextPending) result;
            assertThat(cp.subnet()).isEqualTo("192.168");
            assertThat(cp.confirmToken()).isNotBlank();
            verify(auditLogService).log(eq("LOGIN_NEW_CONTEXT_DETECTED"), eq(userId), anyString());
        }

        @Test
        @DisplayName("contextCheckEnabled=false → siempre full-session")
        void disabledContextCheck() {
            ReflectionTestUtils.setField(useCase, "contextCheckEnabled", false);
            var result = useCase.evaluate(userId, rawIp);
            assertThat(result.isFullSession()).isTrue();
            verify(auditLogService, never()).log(any(), any(), any());
        }
    }

    // ── confirmContext() ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("confirmContext() — validación de confirmación")
    class ConfirmContext {

        @Test
        @DisplayName("subnet mismatch → ContextConfirmException SUBNET_MISMATCH")
        void subnetMismatchThrows() {
            assertThatThrownBy(() ->
                useCase.confirmContext(userId, "192.168", "10.20", "any-token")
            )
            .isInstanceOf(LoginContextUseCase.ContextConfirmException.class)
            .extracting("code").isEqualTo("SUBNET_MISMATCH");
        }

        @Test
        @DisplayName("token inválido (null) → ContextConfirmException TOKEN_INVALID")
        void nullTokenThrows() {
            assertThatThrownBy(() ->
                useCase.confirmContext(userId, "192.168", "192.168", null)
            )
            .isInstanceOf(LoginContextUseCase.ContextConfirmException.class)
            .extracting("code").isEqualTo("TOKEN_INVALID");
        }

        @Test
        @DisplayName("confirmación válida → registra LOGIN_NEW_CONTEXT_CONFIRMED")
        void validConfirmationLogsEvent() {
            // token válido (no blank) + subnets coinciden
            useCase.confirmContext(userId, "192.168", "192.168", "valid-token");
            verify(auditLogService).log(
                eq("LOGIN_NEW_CONTEXT_CONFIRMED"), eq(userId), contains("subnet=192.168"));
        }
    }

    // ── ContextEvaluationResult sealed ────────────────────────────────────────

    @Test
    @DisplayName("ContextPending.isContextPending() = true, isFullSession() = false")
    void contextPendingFlags() {
        var r = LoginContextUseCase.ContextEvaluationResult.contextPending("10.20", "tok");
        assertThat(r.isContextPending()).isTrue();
        assertThat(r.isFullSession()).isFalse();
    }

    @Test
    @DisplayName("FullSession.isFullSession() = true, isContextPending() = false")
    void fullSessionFlags() {
        var r = LoginContextUseCase.ContextEvaluationResult.fullSession();
        assertThat(r.isFullSession()).isTrue();
        assertThat(r.isContextPending()).isFalse();
    }
}
