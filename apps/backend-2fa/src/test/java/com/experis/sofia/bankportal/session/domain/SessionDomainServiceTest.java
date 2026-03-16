package com.experis.sofia.bankportal.session.domain;

import com.experis.sofia.bankportal.session.domain.model.DeviceInfo;
import com.experis.sofia.bankportal.session.domain.model.SessionRevocationReason;
import com.experis.sofia.bankportal.session.domain.model.UserSession;
import com.experis.sofia.bankportal.session.domain.service.SessionDomainService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests unitarios para {@link SessionDomainService} y {@link UserSession}.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
class SessionDomainServiceTest {

    private SessionDomainService service;

    @BeforeEach
    void setUp() { service = new SessionDomainService(); }

    // ── UserSession ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("UserSession.isActive()")
    class IsActive {

        @Test
        @DisplayName("session is active when not revoked")
        void activeWhenNotRevoked() {
            var session = buildSession(LocalDateTime.now());
            assertThat(session.isActive()).isTrue();
        }

        @Test
        @DisplayName("session is inactive after revocation")
        void inactiveAfterRevoke() {
            var session = buildSession(LocalDateTime.now());
            session.revoke(SessionRevocationReason.MANUAL);
            assertThat(session.isActive()).isFalse();
        }

        @Test
        @DisplayName("cannot revoke an already revoked session")
        void cannotRevokeAlreadyRevoked() {
            var session = buildSession(LocalDateTime.now());
            session.revoke(SessionRevocationReason.MANUAL);
            assertThatThrownBy(() -> session.revoke(SessionRevocationReason.ADMIN))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Cannot revoke already revoked session");
        }
    }

    @Nested
    @DisplayName("UserSession.isExpiredByInactivity()")
    class IsExpiredByInactivity {

        @Test
        @DisplayName("not expired when lastActivity is recent")
        void notExpiredWhenRecent() {
            var session = buildSession(LocalDateTime.now().minusMinutes(10));
            assertThat(session.isExpiredByInactivity(30)).isFalse();
        }

        @Test
        @DisplayName("expired when lastActivity exceeds timeout")
        void expiredWhenOld() {
            var session = buildSession(LocalDateTime.now().minusMinutes(61));
            assertThat(session.isExpiredByInactivity(60)).isTrue();
        }
    }

    // ── SessionDomainService ──────────────────────────────────────────────────

    @Nested
    @DisplayName("findLruSession()")
    class FindLruSession {

        @Test
        @DisplayName("returns session with oldest lastActivity")
        void returnsOldest() {
            // Arrange
            var old    = buildSession(LocalDateTime.now().minusHours(5));
            var recent = buildSession(LocalDateTime.now().minusMinutes(10));
            var newest = buildSession(LocalDateTime.now().minusMinutes(2));

            // Act
            var lru = service.findLruSession(List.of(recent, old, newest));

            // Assert
            assertThat(lru.getLastActivity()).isEqualTo(old.getLastActivity());
        }

        @Test
        @DisplayName("throws when session list is empty")
        void throwsOnEmpty() {
            assertThatThrownBy(() -> service.findLruSession(List.of()))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Cannot find LRU in empty session list");
        }
    }

    @Nested
    @DisplayName("validateTimeout()")
    class ValidateTimeout {

        @Test
        @DisplayName("accepts valid timeout values")
        void acceptsValidValues() {
            assertThatCode(() -> service.validateTimeout(5)).doesNotThrowAnyException();
            assertThatCode(() -> service.validateTimeout(30)).doesNotThrowAnyException();
            assertThatCode(() -> service.validateTimeout(60)).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("rejects timeout below minimum")
        void rejectsBelowMin() {
            assertThatThrownBy(() -> service.validateTimeout(4))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("SESSION_TIMEOUT_EXCEEDS_POLICY");
        }

        @Test
        @DisplayName("rejects timeout above maximum")
        void rejectsAboveMax() {
            assertThatThrownBy(() -> service.validateTimeout(61))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("SESSION_TIMEOUT_EXCEEDS_POLICY");
        }
    }

    @Nested
    @DisplayName("maskIp()")
    class MaskIp {

        @Test
        @DisplayName("masks last two octets of IPv4")
        void masksCorrectly() {
            assertThat(service.maskIp("192.168.10.55")).isEqualTo("192.168.x.x");
            assertThat(service.maskIp("10.0.1.100")).isEqualTo("10.0.x.x");
        }

        @Test
        @DisplayName("handles null IP gracefully")
        void handlesNull() {
            assertThat(service.maskIp(null)).isEqualTo("unknown");
        }

        @Test
        @DisplayName("handles blank IP gracefully")
        void handlesBlank() {
            assertThat(service.maskIp("")).isEqualTo("unknown");
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private UserSession buildSession(LocalDateTime lastActivity) {
        var deviceInfo = new DeviceInfo("macOS", "Chrome", "desktop", "Mozilla/5.0");
        return new UserSession(
                UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID().toString(), "hash123",
                deviceInfo, "192.168.x.x",
                LocalDateTime.now(), lastActivity
        );
    }
}
