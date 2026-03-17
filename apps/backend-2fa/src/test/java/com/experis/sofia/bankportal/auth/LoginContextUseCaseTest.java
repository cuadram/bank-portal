package com.experis.sofia.bankportal.auth;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.auth.application.LoginContextUseCase;
import com.experis.sofia.bankportal.auth.domain.ContextConfirmToken;
import com.experis.sofia.bankportal.auth.domain.ContextConfirmTokenRepository;
import com.experis.sofia.bankportal.auth.domain.KnownSubnetRepository;
import com.experis.sofia.bankportal.notification.domain.EmailNotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — US-603 LoginContextUseCase.
 *
 * <p>Escenarios cubiertos:
 * <ol>
 *   <li>evaluateContext: subnet conocida → FullSession</li>
 *   <li>evaluateContext: subnet nueva → ContextPending + email enviado + auditoría</li>
 *   <li>ContextPending flags: isContextPending=true, isFullSession=false</li>
 *   <li>FullSession flags: isFullSession=true, isContextPending=false</li>
 *   <li>confirmContext: token válido → subnet registrada, token marcado, auditoría</li>
 *   <li>confirmContext: token no encontrado → ContextConfirmException</li>
 *   <li>confirmContext: token ya usado → ContextConfirmException</li>
 *   <li>confirmContext: token expirado → ContextConfirmException</li>
 *   <li>confirmContext: userId mismatch → ContextConfirmException</li>
 * </ol>
 *
 * @author SOFIA Developer Agent — FEAT-006 Sprint 7 Semana 2
 */
@ExtendWith(MockitoExtension.class)
class LoginContextUseCaseTest {

    @Mock KnownSubnetRepository         knownSubnetRepository;
    @Mock ContextConfirmTokenRepository confirmTokenRepository;
    @Mock EmailNotificationService      emailNotificationService;
    @Mock AuditLogService               auditLogService;

    @InjectMocks LoginContextUseCase useCase;

    private static final UUID   USER_ID    = UUID.randomUUID();
    private static final String USER_EMAIL = "user@test.com";
    private static final String SUBNET     = "192.168.1";
    private static final String RAW_TOKEN  = "valid-confirm-token";

    // ── evaluateContext ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("evaluateContext")
    class EvaluateContext {

        @Test
        @DisplayName("Subnet conocida → FullSession, no envía email")
        void knownSubnet_returnsFullSession() {
            when(knownSubnetRepository.existsByUserIdAndSubnet(USER_ID, SUBNET)).thenReturn(true);

            var result = useCase.evaluateContext(USER_ID, USER_EMAIL, SUBNET);

            assertThat(result.isFullSession()).isTrue();
            assertThat(result.isContextPending()).isFalse();
            verifyNoInteractions(emailNotificationService, confirmTokenRepository);
        }

        @Test
        @DisplayName("Subnet nueva → ContextPending + genera token + envía email + audita")
        void unknownSubnet_returnsContextPending_sendsEmail() {
            when(knownSubnetRepository.existsByUserIdAndSubnet(USER_ID, SUBNET)).thenReturn(false);

            var result = useCase.evaluateContext(USER_ID, USER_EMAIL, SUBNET);

            assertThat(result.isContextPending()).isTrue();
            assertThat(result.isFullSession()).isFalse();

            var cp = (LoginContextUseCase.ContextEvaluationResult.ContextPending) result;
            assertThat(cp.pendingSubnet()).isEqualTo(SUBNET);
            assertThat(cp.confirmToken()).isNotBlank();

            verify(confirmTokenRepository).save(any(ContextConfirmToken.class));
            verify(emailNotificationService).sendContextConfirmLink(eq(USER_EMAIL), anyString(), eq(SUBNET));
            verify(auditLogService).log(eq("LOGIN_NEW_CONTEXT_DETECTED"), eq(USER_ID), anyString());
        }
    }

    // ── ContextEvaluationResult sealed flags ─────────────────────────────────

    @Nested
    @DisplayName("ContextEvaluationResult sealed interface")
    class SealedInterfaceFlags {

        @Test
        @DisplayName("ContextPending.isContextPending() = true, isFullSession() = false")
        void contextPendingFlags() {
            var r = LoginContextUseCase.ContextEvaluationResult.contextPending("10.20.30", "tok");
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

    // ── confirmContext ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("confirmContext")
    class ConfirmContext {

        private ContextConfirmToken buildToken(boolean used, Instant expiresAt, UUID userId) {
            ContextConfirmToken t = new ContextConfirmToken();
            t.setUserId(userId);
            t.setUsed(used);
            t.setExpiresAt(expiresAt);
            t.setSubnet(SUBNET);
            return t;
        }

        @Test
        @DisplayName("Token válido → subnet registrada, token marcado usado, audita")
        void validToken_confirmsContext() {
            ContextConfirmToken token = buildToken(false, Instant.now().plusSeconds(1800), USER_ID);
            when(confirmTokenRepository.findByRawToken(RAW_TOKEN)).thenReturn(Optional.of(token));

            useCase.confirmContext(USER_ID, SUBNET, SUBNET, RAW_TOKEN);

            verify(knownSubnetRepository).save(any());
            verify(confirmTokenRepository).save(argThat(ContextConfirmToken::isUsed));
            verify(auditLogService).log(
                    eq("LOGIN_NEW_CONTEXT_CONFIRMED"), eq(USER_ID), contains("subnet=" + SUBNET));
        }

        @Test
        @DisplayName("Token no encontrado → ContextConfirmException")
        void tokenNotFound_throws() {
            when(confirmTokenRepository.findByRawToken(RAW_TOKEN)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> useCase.confirmContext(USER_ID, SUBNET, SUBNET, RAW_TOKEN))
                    .isInstanceOf(LoginContextUseCase.ContextConfirmException.class)
                    .hasMessageContaining("no encontrado");
        }

        @Test
        @DisplayName("Token ya usado → ContextConfirmException")
        void alreadyUsed_throws() {
            ContextConfirmToken token = buildToken(true, Instant.now().plusSeconds(1800), USER_ID);
            when(confirmTokenRepository.findByRawToken(RAW_TOKEN)).thenReturn(Optional.of(token));
            assertThatThrownBy(() -> useCase.confirmContext(USER_ID, SUBNET, SUBNET, RAW_TOKEN))
                    .isInstanceOf(LoginContextUseCase.ContextConfirmException.class)
                    .hasMessageContaining("ya utilizado");
        }

        @Test
        @DisplayName("Token expirado → ContextConfirmException")
        void expired_throws() {
            ContextConfirmToken token = buildToken(false, Instant.now().minusSeconds(1), USER_ID);
            when(confirmTokenRepository.findByRawToken(RAW_TOKEN)).thenReturn(Optional.of(token));
            assertThatThrownBy(() -> useCase.confirmContext(USER_ID, SUBNET, SUBNET, RAW_TOKEN))
                    .isInstanceOf(LoginContextUseCase.ContextConfirmException.class)
                    .hasMessageContaining("expirado");
        }

        @Test
        @DisplayName("UserId mismatch → ContextConfirmException")
        void userIdMismatch_throws() {
            UUID otherUser = UUID.randomUUID();
            ContextConfirmToken token = buildToken(false, Instant.now().plusSeconds(1800), otherUser);
            when(confirmTokenRepository.findByRawToken(RAW_TOKEN)).thenReturn(Optional.of(token));
            assertThatThrownBy(() -> useCase.confirmContext(USER_ID, SUBNET, SUBNET, RAW_TOKEN))
                    .isInstanceOf(LoginContextUseCase.ContextConfirmException.class)
                    .hasMessageContaining("no pertenece");
        }
    }
}
