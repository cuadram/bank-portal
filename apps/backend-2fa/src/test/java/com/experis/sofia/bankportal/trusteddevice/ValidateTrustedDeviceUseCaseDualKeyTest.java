package com.experis.sofia.bankportal.trusteddevice;

import com.experis.sofia.bankportal.session.application.usecase.AuditLogService;
import com.experis.sofia.bankportal.session.domain.service.DeviceFingerprintService;
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
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Tests para {@link ValidateTrustedDeviceUseCase} con clave dual HMAC (DEBT-006 / ADR-009).
 *
 * Escenarios cubiertos:
 * - Token firmado con clave actual → aceptado
 * - Token firmado con clave anterior (en ventana de gracia) → aceptado + GRACE_VERIFY auditado
 * - Token con clave anterior sin clave anterior configurada → rechazado
 * - Ambas claves fallan → rechazado (OTP requerido)
 * - Sin cookie → rechazado
 * - IDOR: userId no coincide → rechazado
 * - Fingerprint cambiado → rechazado
 * - Dispositivo expirado → rechazado
 *
 * @author SOFIA Developer Agent — DEBT-006 Sprint 5
 */
@ExtendWith(MockitoExtension.class)
class ValidateTrustedDeviceUseCaseDualKeyTest {

    @Mock private TrustedDeviceRepository  deviceRepository;
    @Mock private DeviceFingerprintService fingerprintService;
    @Mock private AuditLogService          auditLogService;
    @Mock private HttpServletRequest       request;

    private ValidateTrustedDeviceUseCase useCase;

    private final String CURRENT_KEY  = "current-hmac-key-32bytes-for-tests!!";
    private final String PREVIOUS_KEY = "previous-hmac-key-32bytes-tests!!xx";

    private final UUID   userId      = UUID.randomUUID();
    private final UUID   deviceId    = UUID.randomUUID();
    private final String fingerprint = "fp-hash-xyz";
    private final String rawIp       = "192.168.1.1";
    private final String ua          = "Mozilla/5.0 Safari/605";

    @BeforeEach
    void setUp() {
        useCase = new ValidateTrustedDeviceUseCase(
                deviceRepository, fingerprintService, auditLogService);
    }

    // ── Clave actual ──────────────────────────────────────────────────────────

    @Nested
    @DisplayName("token signed with current key")
    class CurrentKey {

        @Test
        @DisplayName("validates and logs TRUSTED_DEVICE_LOGIN")
        void acceptsCurrentKey() throws Exception {
            // Arrange
            String token = generateToken(userId, fingerprint, CURRENT_KEY);
            setupRequest(token);
            setupDevice(userId, fingerprint, true);
            setKeys(CURRENT_KEY, "");

            // Act
            boolean result = useCase.validate(request, userId, rawIp);

            // Assert
            assertThat(result).isTrue();
            verify(auditLogService).log(eq("TRUSTED_DEVICE_LOGIN"), eq(userId), any());
            verify(auditLogService, never()).log(eq("TRUSTED_DEVICE_GRACE_VERIFY"), any(), any());
        }
    }

    // ── Clave anterior (ventana de gracia ADR-009) ────────────────────────────

    @Nested
    @DisplayName("token signed with previous key (grace window ADR-009)")
    class PreviousKey {

        @Test
        @DisplayName("accepts token from previous key and logs GRACE_VERIFY")
        void acceptsPreviousKey() throws Exception {
            // Arrange — token firmado con clave ANTERIOR
            String token = generateToken(userId, fingerprint, PREVIOUS_KEY);
            setupRequest(token);
            setupDevice(userId, fingerprint, true);
            setKeys(CURRENT_KEY, PREVIOUS_KEY);  // ambas claves activas

            // Act
            boolean result = useCase.validate(request, userId, rawIp);

            // Assert
            assertThat(result).isTrue();
            // Debe loguear GRACE_VERIFY, no TRUSTED_DEVICE_LOGIN
            verify(auditLogService).log(eq("TRUSTED_DEVICE_GRACE_VERIFY"), eq(userId), any());
            verify(auditLogService, never()).log(eq("TRUSTED_DEVICE_LOGIN"), any(), any());
        }

        @Test
        @DisplayName("rejects previous-key token when no previous key configured")
        void rejectsWhenNoPreviousKeyConfigured() throws Exception {
            // Arrange — token firmado con clave anterior, pero sin clave anterior configurada
            String token = generateToken(userId, fingerprint, PREVIOUS_KEY);
            setupRequest(token);
            setupDevice(userId, fingerprint, true);
            setKeys(CURRENT_KEY, "");  // clave anterior vacía

            // Act
            boolean result = useCase.validate(request, userId, rawIp);

            // Assert
            assertThat(result).isFalse();
            verify(auditLogService, never()).log(any(), any(), any());
        }

        @Test
        @DisplayName("rejects token when both keys fail")
        void rejectsBothKeysFail() throws Exception {
            // Arrange — token firmado con clave desconocida (ni current ni previous)
            String token = generateToken(userId, fingerprint, "unknown-key-completely-different!!");
            setupRequest(token);
            setupDevice(userId, fingerprint, true);
            setKeys(CURRENT_KEY, PREVIOUS_KEY);

            // Act
            boolean result = useCase.validate(request, userId, rawIp);

            // Assert
            assertThat(result).isFalse();
            verify(auditLogService, never()).log(any(), any(), any());
        }
    }

    // ── Casos de error base (regresión) ───────────────────────────────────────

    @Nested
    @DisplayName("base error cases (regression)")
    class BaseErrors {

        @Test
        @DisplayName("returns false when no cookie")
        void noCookie() {
            when(request.getCookies()).thenReturn(null);
            setKeys(CURRENT_KEY, "");
            assertThat(useCase.validate(request, userId, rawIp)).isFalse();
        }

        @Test
        @DisplayName("returns false when token not found in DB")
        void tokenNotFound() throws Exception {
            String token = generateToken(userId, fingerprint, CURRENT_KEY);
            setupRequest(token);
            when(request.getHeader("User-Agent")).thenReturn(ua);
            when(fingerprintService.extractIpSubnet(rawIp)).thenReturn("192.168");
            when(deviceRepository.findActiveByTokenHash(any())).thenReturn(Optional.empty());
            setKeys(CURRENT_KEY, "");

            assertThat(useCase.validate(request, userId, rawIp)).isFalse();
        }

        @Test
        @DisplayName("returns false when userId mismatch (IDOR)")
        void idorProtection() throws Exception {
            String token = generateToken(userId, fingerprint, CURRENT_KEY);
            setupRequest(token);
            when(request.getHeader("User-Agent")).thenReturn(ua);
            when(fingerprintService.extractIpSubnet(rawIp)).thenReturn("192.168");
            when(fingerprintService.computeHash(ua, "192.168")).thenReturn(fingerprint);

            // Device pertenece a OTRO usuario
            var otherUser = UUID.randomUUID();
            setupDevice(otherUser, fingerprint, true);
            setKeys(CURRENT_KEY, "");

            assertThat(useCase.validate(request, userId, rawIp)).isFalse();
        }

        @Test
        @DisplayName("returns false when fingerprint changed")
        void fingerprintChanged() throws Exception {
            String token = generateToken(userId, fingerprint, CURRENT_KEY);
            setupRequest(token);
            when(request.getHeader("User-Agent")).thenReturn(ua);
            when(fingerprintService.extractIpSubnet(rawIp)).thenReturn("192.168");
            // Fingerprint actual es diferente al almacenado
            when(fingerprintService.computeHash(ua, "192.168")).thenReturn("different-fp");
            setupDevice(userId, fingerprint, true);
            setKeys(CURRENT_KEY, "");

            assertThat(useCase.validate(request, userId, rawIp)).isFalse();
        }

        @Test
        @DisplayName("returns false when device expired")
        void deviceExpired() throws Exception {
            String token = generateToken(userId, fingerprint, CURRENT_KEY);
            setupRequest(token);
            when(request.getHeader("User-Agent")).thenReturn(ua);
            when(fingerprintService.extractIpSubnet(rawIp)).thenReturn("192.168");
            when(fingerprintService.computeHash(ua, "192.168")).thenReturn(fingerprint);
            setupDevice(userId, fingerprint, false);  // expirado
            setKeys(CURRENT_KEY, "");

            assertThat(useCase.validate(request, userId, rawIp)).isFalse();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void setKeys(String current, String previous) {
        ReflectionTestUtils.setField(useCase, "hmacKey", current);
        ReflectionTestUtils.setField(useCase, "hmacKeyPrevious", previous);
    }

    private void setupRequest(String tokenValue) {
        Cookie cookie = new Cookie("bp_trust", tokenValue);
        when(request.getCookies()).thenReturn(new Cookie[]{ cookie });
        when(request.getHeader("User-Agent")).thenReturn(ua);
        when(fingerprintService.extractIpSubnet(rawIp)).thenReturn("192.168");
        when(fingerprintService.computeHash(ua, "192.168")).thenReturn(fingerprint);
    }

    private void setupDevice(UUID uid, String fp, boolean active) {
        var expiresAt = active
                ? LocalDateTime.now().plusDays(25)
                : LocalDateTime.now().minusDays(1);
        var device = new TrustedDevice(deviceId, uid, "tokenHash", fp,
                "macOS", "Safari", "192.168.x.x",
                LocalDateTime.now().minusDays(5),
                LocalDateTime.now().minusHours(1), expiresAt);
        when(deviceRepository.findActiveByTokenHash(any())).thenReturn(Optional.of(device));
        if (active && uid.equals(userId)) {
            when(deviceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        }
    }

    private String generateToken(UUID uid, String fp, String key) throws Exception {
        String payload = uid + ":" + fp + ":" + System.currentTimeMillis();
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String sig = HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString((payload + ":" + sig).getBytes(StandardCharsets.UTF_8));
    }
}
