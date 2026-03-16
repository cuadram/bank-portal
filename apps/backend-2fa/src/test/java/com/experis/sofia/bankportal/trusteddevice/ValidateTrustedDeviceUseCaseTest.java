package com.experis.sofia.bankportal.trusteddevice;

import com.experis.sofia.bankportal.session.application.usecase.AuditLogService;
import com.experis.sofia.bankportal.session.domain.model.DeviceInfo;
import com.experis.sofia.bankportal.session.domain.service.DeviceFingerprintService;
import com.experis.sofia.bankportal.session.domain.service.SessionDomainService;
import com.experis.sofia.bankportal.trusteddevice.application.ValidateTrustedDeviceUseCase;
import com.experis.sofia.bankportal.trusteddevice.domain.TrustedDevice;
import com.experis.sofia.bankportal.trusteddevice.domain.TrustedDeviceRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para {@link ValidateTrustedDeviceUseCase}.
 * Cubre US-203: login sin OTP desde dispositivo de confianza.
 *
 * @author SOFIA Developer Agent — FEAT-003 Sprint 4
 */
@ExtendWith(MockitoExtension.class)
class ValidateTrustedDeviceUseCaseTest {

    @Mock private TrustedDeviceRepository  deviceRepository;
    @Mock private DeviceFingerprintService fingerprintService;
    @Mock private AuditLogService          auditLogService;
    @Mock private HttpServletRequest       request;

    private ValidateTrustedDeviceUseCase useCase;

    private final UUID   userId      = UUID.randomUUID();
    private final UUID   deviceId    = UUID.randomUUID();
    private final String rawToken    = "valid-trust-token";
    private final String tokenHash   = sha256(rawToken);
    private final String fingerprint = "fp-hash-abc";
    private final String rawIp       = "192.168.1.1";
    private final String ua          = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36";

    @BeforeEach
    void setUp() {
        useCase = new ValidateTrustedDeviceUseCase(
                deviceRepository, fingerprintService, auditLogService);
    }

    // ── Happy path ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("happy path — valid trusted device")
    class HappyPath {

        @Test
        @DisplayName("returns true and logs audit event when device is trusted and fingerprint matches")
        void returnsTrueForValidDevice() {
            // Arrange
            setupCookie(rawToken);
            when(request.getHeader("User-Agent")).thenReturn(ua);
            when(fingerprintService.extractIpSubnet(rawIp)).thenReturn("192.168");
            when(fingerprintService.computeHash(ua, "192.168")).thenReturn(fingerprint);

            var device = buildDevice(userId, fingerprint, true);
            when(deviceRepository.findActiveByTokenHash(any())).thenReturn(Optional.of(device));
            when(deviceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            boolean result = useCase.validate(request, userId, rawIp);

            // Assert
            assertThat(result).isTrue();
            verify(auditLogService).log(eq("TRUSTED_DEVICE_LOGIN"), eq(userId), any());
            verify(deviceRepository).save(device);
        }
    }

    // ── Error paths ───────────────────────────────────────────────────────────

    @Nested
    @DisplayName("error paths")
    class ErrorPaths {

        @Test
        @DisplayName("returns false when no cookie present")
        void returnsFalseWhenNoCookie() {
            when(request.getCookies()).thenReturn(null);
            assertThat(useCase.validate(request, userId, rawIp)).isFalse();
            verifyNoInteractions(deviceRepository);
        }

        @Test
        @DisplayName("returns false when token not found in DB")
        void returnsFalseWhenTokenNotFound() {
            setupCookie(rawToken);
            when(request.getHeader("User-Agent")).thenReturn(ua);
            when(fingerprintService.extractIpSubnet(rawIp)).thenReturn("192.168");
            when(deviceRepository.findActiveByTokenHash(any())).thenReturn(Optional.empty());

            assertThat(useCase.validate(request, userId, rawIp)).isFalse();
            verify(auditLogService, never()).log(any(), any(), any());
        }

        @Test
        @DisplayName("returns false when device belongs to different user (IDOR)")
        void returnsFalseForWrongUser() {
            setupCookie(rawToken);
            when(request.getHeader("User-Agent")).thenReturn(ua);
            when(fingerprintService.extractIpSubnet(rawIp)).thenReturn("192.168");
            when(fingerprintService.computeHash(ua, "192.168")).thenReturn(fingerprint);

            // Device pertenece a otro usuario
            var otherUserId = UUID.randomUUID();
            var device = buildDevice(otherUserId, fingerprint, true);
            when(deviceRepository.findActiveByTokenHash(any())).thenReturn(Optional.of(device));

            assertThat(useCase.validate(request, userId, rawIp)).isFalse();
            verify(auditLogService, never()).log(any(), any(), any());
        }

        @Test
        @DisplayName("returns false when device fingerprint has changed")
        void returnsFalseWhenFingerprintChanged() {
            setupCookie(rawToken);
            when(request.getHeader("User-Agent")).thenReturn(ua);
            when(fingerprintService.extractIpSubnet(rawIp)).thenReturn("192.168");
            when(fingerprintService.computeHash(ua, "192.168")).thenReturn("different-fingerprint");

            var device = buildDevice(userId, fingerprint, true);  // fingerprint original
            when(deviceRepository.findActiveByTokenHash(any())).thenReturn(Optional.of(device));

            assertThat(useCase.validate(request, userId, rawIp)).isFalse();
        }

        @Test
        @DisplayName("returns false when device is expired")
        void returnsFalseWhenExpired() {
            setupCookie(rawToken);
            when(request.getHeader("User-Agent")).thenReturn(ua);
            when(fingerprintService.extractIpSubnet(rawIp)).thenReturn("192.168");
            when(fingerprintService.computeHash(ua, "192.168")).thenReturn(fingerprint);

            var expiredDevice = buildDevice(userId, fingerprint, false);  // expirado
            when(deviceRepository.findActiveByTokenHash(any())).thenReturn(Optional.of(expiredDevice));

            assertThat(useCase.validate(request, userId, rawIp)).isFalse();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void setupCookie(String tokenValue) {
        Cookie cookie = new Cookie("bp_trust", tokenValue);
        when(request.getCookies()).thenReturn(new Cookie[]{ cookie });
    }

    private TrustedDevice buildDevice(UUID uid, String fp, boolean active) {
        var expiresAt = active
                ? LocalDateTime.now().plusDays(25)
                : LocalDateTime.now().minusDays(1);
        return new TrustedDevice(deviceId, uid, tokenHash, fp,
                "macOS", "Safari", "192.168.x.x",
                LocalDateTime.now().minusDays(5),
                LocalDateTime.now().minusHours(1), expiresAt);
    }

    private static String sha256(String input) {
        try {
            var digest = java.security.MessageDigest.getInstance("SHA-256");
            return java.util.HexFormat.of().formatHex(
                    digest.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (Exception e) { throw new RuntimeException(e); }
    }
}
