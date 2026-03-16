package com.experis.sofia.bankportal.trusteddevice;

import com.experis.sofia.bankportal.session.application.usecase.AuditLogService;
import com.experis.sofia.bankportal.session.domain.service.DeviceFingerprintService;
import com.experis.sofia.bankportal.session.domain.service.SessionDomainService;
import com.experis.sofia.bankportal.trusteddevice.application.ManageTrustedDevicesUseCase;
import com.experis.sofia.bankportal.trusteddevice.application.ManageTrustedDevicesUseCase.TrustedDeviceNotFoundException;
import com.experis.sofia.bankportal.trusteddevice.domain.TrustedDevice;
import com.experis.sofia.bankportal.trusteddevice.domain.TrustedDeviceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para {@link ManageTrustedDevicesUseCase}.
 * Cubre US-202 (listar/revocar) y US-204 (cleanup).
 *
 * @author SOFIA Developer Agent — FEAT-003 Sprint 4
 */
@ExtendWith(MockitoExtension.class)
class ManageTrustedDevicesUseCaseTest {

    @Mock private TrustedDeviceRepository deviceRepository;
    @Mock private AuditLogService         auditLogService;

    private ManageTrustedDevicesUseCase useCase;

    private final UUID userId   = UUID.randomUUID();
    private final UUID deviceId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        useCase = new ManageTrustedDevicesUseCase(deviceRepository, auditLogService);
    }

    // ── listActive ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("listActive()")
    class ListActive {

        @Test
        @DisplayName("returns active devices for user")
        void returnsActiveDevices() {
            var device = buildDevice(deviceId, userId, true);
            when(deviceRepository.findAllActiveByUserId(userId)).thenReturn(List.of(device));

            var result = useCase.listActive(userId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getId()).isEqualTo(deviceId);
        }

        @Test
        @DisplayName("returns empty list when no active devices")
        void returnsEmptyWhenNone() {
            when(deviceRepository.findAllActiveByUserId(userId)).thenReturn(List.of());
            assertThat(useCase.listActive(userId)).isEmpty();
        }
    }

    // ── revokeOne ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("revokeOne()")
    class RevokeOne {

        @Test
        @DisplayName("revokes device and logs audit event")
        void revokesSuccessfully() {
            var device = buildDevice(deviceId, userId, true);
            when(deviceRepository.findAllActiveByUserId(userId)).thenReturn(List.of(device));
            when(deviceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            useCase.revokeOne(deviceId, userId);

            var captor = ArgumentCaptor.forClass(TrustedDevice.class);
            verify(deviceRepository).save(captor.capture());
            assertThat(captor.getValue().getRevokeReason()).isEqualTo("MANUAL");
            verify(auditLogService).log(eq("TRUSTED_DEVICE_REVOKED"), eq(userId), any());
        }

        @Test
        @DisplayName("throws when device not found for user")
        void throwsWhenNotFound() {
            when(deviceRepository.findAllActiveByUserId(userId)).thenReturn(List.of());

            assertThatThrownBy(() -> useCase.revokeOne(deviceId, userId))
                    .isInstanceOf(TrustedDeviceNotFoundException.class);
            verify(deviceRepository, never()).save(any());
        }

        @Test
        @DisplayName("cannot revoke device belonging to another user (IDOR protection)")
        void cannotRevokeOtherUsersDevice() {
            // El device pertenece a otro userId
            var otherUserId = UUID.randomUUID();
            var device = buildDevice(deviceId, otherUserId, true);
            // findAllActiveByUserId devuelve lista vacía para el userId del atacante
            when(deviceRepository.findAllActiveByUserId(userId)).thenReturn(List.of());

            assertThatThrownBy(() -> useCase.revokeOne(deviceId, userId))
                    .isInstanceOf(TrustedDeviceNotFoundException.class);
        }
    }

    // ── revokeAll ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("revokeAll()")
    class RevokeAll {

        @Test
        @DisplayName("revokes all active devices and logs audit event with count")
        void revokesAll() {
            var d1 = buildDevice(UUID.randomUUID(), userId, true);
            var d2 = buildDevice(UUID.randomUUID(), userId, true);
            when(deviceRepository.findAllActiveByUserId(userId)).thenReturn(List.of(d1, d2));
            when(deviceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            useCase.revokeAll(userId);

            verify(deviceRepository, times(2)).save(any());
            verify(auditLogService).log(eq("TRUSTED_DEVICE_REVOKE_ALL"), eq(userId),
                    contains("revoked=2"));
        }

        @Test
        @DisplayName("handles empty list gracefully")
        void handlesEmpty() {
            when(deviceRepository.findAllActiveByUserId(userId)).thenReturn(List.of());
            assertThatCode(() -> useCase.revokeAll(userId)).doesNotThrowAnyException();
            verify(deviceRepository, never()).save(any());
        }
    }

    // ── TrustedDevice entity ──────────────────────────────────────────────────

    @Nested
    @DisplayName("TrustedDevice entity")
    class TrustedDeviceEntity {

        @Test
        @DisplayName("isActive() is true when not revoked and not expired")
        void activeWhenValid() {
            var device = buildDevice(deviceId, userId, true);
            assertThat(device.isActive()).isTrue();
        }

        @Test
        @DisplayName("isExpired() is true when expiresAt is in the past")
        void expiredWhenPast() {
            var device = new TrustedDevice(deviceId, userId, "hash", "fp",
                    "macOS", "Safari", "192.168.x.x",
                    LocalDateTime.now().minusDays(31),
                    LocalDateTime.now().minusDays(1),
                    LocalDateTime.now().minusSeconds(1));  // expiresAt en el pasado
            assertThat(device.isExpired()).isTrue();
            assertThat(device.isActive()).isFalse();
        }

        @Test
        @DisplayName("revoke() sets revokedAt and revokeReason")
        void revokeSetFields() {
            var device = buildDevice(deviceId, userId, true);
            device.revoke("MANUAL");
            assertThat(device.getRevokedAt()).isNotNull();
            assertThat(device.getRevokeReason()).isEqualTo("MANUAL");
        }

        @Test
        @DisplayName("revoke() throws when device is already revoked")
        void cannotRevokeAlreadyRevoked() {
            var device = buildDevice(deviceId, userId, true);
            device.revoke("MANUAL");
            assertThatThrownBy(() -> device.revoke("ADMIN"))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private TrustedDevice buildDevice(UUID id, UUID uid, boolean active) {
        var expiresAt = active
                ? LocalDateTime.now().plusDays(30)
                : LocalDateTime.now().minusDays(1);
        return new TrustedDevice(id, uid, "tokenHash", "fingerprint",
                "macOS", "Safari", "192.168.x.x",
                LocalDateTime.now().minusDays(5),
                LocalDateTime.now().minusHours(2), expiresAt);
    }
}
