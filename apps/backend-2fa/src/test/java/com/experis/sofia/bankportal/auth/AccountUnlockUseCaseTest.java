package com.experis.sofia.bankportal.auth;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.auth.application.AccountUnlockUseCase;
import com.experis.sofia.bankportal.auth.domain.UnlockToken;
import com.experis.sofia.bankportal.auth.domain.UnlockTokenRepository;
import com.experis.sofia.bankportal.auth.domain.UserAccount;
import com.experis.sofia.bankportal.auth.domain.UserAccountRepository;
import com.experis.sofia.bankportal.notification.domain.EmailNotificationService;
import org.junit.jupiter.api.BeforeEach;
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

import static com.experis.sofia.bankportal.auth.application.AccountUnlockUseCase.TOKEN_TTL_SECONDS;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — US-602 AccountUnlockUseCase.
 *
 * <p>Escenarios cubiertos:
 * <ol>
 *   <li>requestUnlock: email de cuenta LOCKED → genera token + envía email + audita</li>
 *   <li>requestUnlock: email no encontrado → no-op silencioso (anti-enumeration)</li>
 *   <li>requestUnlock: cuenta ACTIVE → no-op silencioso (anti-enumeration)</li>
 *   <li>requestUnlock: invalida tokens anteriores antes de crear nuevo</li>
 *   <li>unlockByToken: token válido → cuenta ACTIVE + token marcado usado + audita</li>
 *   <li>unlockByToken: token no encontrado → UnlockTokenException</li>
 *   <li>unlockByToken: token ya usado → UnlockTokenException</li>
 *   <li>unlockByToken: token expirado → UnlockTokenException</li>
 * </ol>
 *
 * @author SOFIA Developer Agent — FEAT-006 Sprint 7 Semana 2
 */
@ExtendWith(MockitoExtension.class)
class AccountUnlockUseCaseTest {

    @Mock UserAccountRepository    userAccountRepository;
    @Mock UnlockTokenRepository    unlockTokenRepository;
    @Mock EmailNotificationService emailNotificationService;
    @Mock AuditLogService          auditLogService;

    @InjectMocks AccountUnlockUseCase useCase;

    private static final UUID   USER_ID   = UUID.randomUUID();
    private static final String USER_EMAIL = "user@test.com";

    // ── requestUnlock ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("requestUnlock")
    class RequestUnlock {

        private UserAccount lockedUser;

        @BeforeEach
        void setUp() {
            lockedUser = new UserAccount();
            lockedUser.setId(USER_ID);
            lockedUser.setEmail(USER_EMAIL);
            lockedUser.setAccountStatus("LOCKED");
        }

        @Test
        @DisplayName("Cuenta LOCKED → genera token, envía email y audita")
        void lockedAccount_sendsEmail() {
            when(userAccountRepository.findByEmail(USER_EMAIL))
                    .thenReturn(Optional.of(lockedUser));

            useCase.requestUnlock(USER_EMAIL);

            verify(unlockTokenRepository).invalidateAllForUser(USER_ID);
            verify(unlockTokenRepository).save(any(UnlockToken.class));
            verify(emailNotificationService).sendUnlockLink(eq(USER_EMAIL), anyString());
            verify(auditLogService).log(eq("UNLOCK_LINK_SENT"), eq(USER_ID), anyString());
        }

        @Test
        @DisplayName("Email no encontrado → no-op (anti-enumeration R-SEC-004)")
        void emailNotFound_noOp() {
            when(userAccountRepository.findByEmail(USER_EMAIL))
                    .thenReturn(Optional.empty());

            assertThatNoException().isThrownBy(() -> useCase.requestUnlock(USER_EMAIL));

            verifyNoInteractions(unlockTokenRepository, emailNotificationService, auditLogService);
        }

        @Test
        @DisplayName("Cuenta ACTIVE → no-op (anti-enumeration R-SEC-004)")
        void activeAccount_noOp() {
            lockedUser.setAccountStatus("ACTIVE");
            when(userAccountRepository.findByEmail(USER_EMAIL))
                    .thenReturn(Optional.of(lockedUser));

            assertThatNoException().isThrownBy(() -> useCase.requestUnlock(USER_EMAIL));

            verifyNoInteractions(unlockTokenRepository, emailNotificationService, auditLogService);
        }

        @Test
        @DisplayName("Invalida tokens anteriores antes de crear nuevo")
        void invalidatesPreviousTokensFirst() {
            when(userAccountRepository.findByEmail(USER_EMAIL))
                    .thenReturn(Optional.of(lockedUser));

            useCase.requestUnlock(USER_EMAIL);

            var inOrder = inOrder(unlockTokenRepository);
            inOrder.verify(unlockTokenRepository).invalidateAllForUser(USER_ID);
            inOrder.verify(unlockTokenRepository).save(any(UnlockToken.class));
        }
    }

    // ── unlockByToken ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("unlockByToken")
    class UnlockByToken {

        private static final String RAW_TOKEN = "valid-token-uuid";

        private UnlockToken buildToken(boolean used, Instant expiresAt) {
            UnlockToken t = new UnlockToken();
            t.setUserId(USER_ID);
            t.setUsed(used);
            t.setExpiresAt(expiresAt);
            return t;
        }

        @Test
        @DisplayName("Token válido → cuenta ACTIVE, token marcado usado, audita")
        void validToken_unlocksAccount() {
            UnlockToken token = buildToken(false, Instant.now().plusSeconds(TOKEN_TTL_SECONDS));
            when(unlockTokenRepository.findByRawToken(RAW_TOKEN)).thenReturn(Optional.of(token));
            UserAccount user = new UserAccount();
            user.setId(USER_ID);
            user.setAccountStatus("LOCKED");
            when(userAccountRepository.findById(USER_ID)).thenReturn(Optional.of(user));

            useCase.unlockByToken(RAW_TOKEN);

            verify(userAccountRepository).save(argThat(u -> "ACTIVE".equals(u.getAccountStatus())));
            verify(unlockTokenRepository).save(argThat(UnlockToken::isUsed));
            verify(auditLogService).log(eq("ACCOUNT_UNLOCKED"), eq(USER_ID), anyString());
        }

        @Test
        @DisplayName("Token no encontrado → UnlockTokenException")
        void tokenNotFound_throws() {
            when(unlockTokenRepository.findByRawToken(RAW_TOKEN)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> useCase.unlockByToken(RAW_TOKEN))
                    .isInstanceOf(AccountUnlockUseCase.UnlockTokenException.class)
                    .hasMessageContaining("no encontrado");
        }

        @Test
        @DisplayName("Token ya usado → UnlockTokenException")
        void tokenAlreadyUsed_throws() {
            UnlockToken token = buildToken(true, Instant.now().plusSeconds(3600));
            when(unlockTokenRepository.findByRawToken(RAW_TOKEN)).thenReturn(Optional.of(token));
            assertThatThrownBy(() -> useCase.unlockByToken(RAW_TOKEN))
                    .isInstanceOf(AccountUnlockUseCase.UnlockTokenException.class)
                    .hasMessageContaining("ya utilizado");
        }

        @Test
        @DisplayName("Token expirado → UnlockTokenException")
        void tokenExpired_throws() {
            UnlockToken token = buildToken(false, Instant.now().minusSeconds(1));
            when(unlockTokenRepository.findByRawToken(RAW_TOKEN)).thenReturn(Optional.of(token));
            assertThatThrownBy(() -> useCase.unlockByToken(RAW_TOKEN))
                    .isInstanceOf(AccountUnlockUseCase.UnlockTokenException.class)
                    .hasMessageContaining("expirado");
        }
    }
}
