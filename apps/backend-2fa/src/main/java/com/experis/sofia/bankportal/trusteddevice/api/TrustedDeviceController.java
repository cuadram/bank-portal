package com.experis.sofia.bankportal.trusteddevice.api;

import com.experis.sofia.bankportal.trusteddevice.application.ManageTrustedDevicesUseCase;
import com.experis.sofia.bankportal.trusteddevice.domain.TrustedDevice;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Controller REST para gestión de dispositivos de confianza (FEAT-003).
 *
 * Endpoints:
 * GET    /api/v1/trusted-devices          → lista dispositivos confiables (US-202)
 * DELETE /api/v1/trusted-devices/{id}     → revoca dispositivo individual (US-202)
 * DELETE /api/v1/trusted-devices          → revoca todos (US-202)
 *
 * La creación (US-201) se gestiona en el AuthController tras login 2FA exitoso.
 *
 * @author SOFIA Developer Agent — FEAT-003 Sprint 4
 */
@RestController
@RequestMapping("/api/v1/trusted-devices")
@RequiredArgsConstructor
public class TrustedDeviceController {

    private final ManageTrustedDevicesUseCase manageDevices;

    /** US-202 — Lista dispositivos de confianza activos. */
    @GetMapping
    public ResponseEntity<List<TrustedDeviceResponse>> listTrustedDevices(
            HttpServletRequest request) {

        UUID userId = (UUID) request.getAttribute("authenticatedUserId");
        List<TrustedDeviceResponse> response = manageDevices.listActive(userId)
                .stream().map(TrustedDeviceResponse::from).toList();
        return ResponseEntity.ok(response);
    }

    /** US-202 — Revoca un dispositivo de confianza individual. */
    @DeleteMapping("/{deviceId}")
    public ResponseEntity<Void> revokeOne(
            @PathVariable UUID deviceId,
            HttpServletRequest request) {

        UUID userId = (UUID) request.getAttribute("authenticatedUserId");
        manageDevices.revokeOne(deviceId, userId);
        return ResponseEntity.noContent().build();
    }

    /** US-202 — Revoca todos los dispositivos de confianza del usuario. */
    @DeleteMapping
    public ResponseEntity<Void> revokeAll(HttpServletRequest request) {
        UUID userId = (UUID) request.getAttribute("authenticatedUserId");
        manageDevices.revokeAll(userId);
        return ResponseEntity.noContent().build();
    }

    // ── DTO de respuesta ──────────────────────────────────────────────────────

    public record TrustedDeviceResponse(
            String deviceId,
            String os,
            String browser,
            String ipMasked,
            LocalDateTime createdAt,
            LocalDateTime lastUsedAt,
            LocalDateTime expiresAt
    ) {
        public static TrustedDeviceResponse from(TrustedDevice d) {
            return new TrustedDeviceResponse(
                    d.getId().toString(), d.getDeviceOs(), d.getDeviceBrowser(),
                    d.getIpMasked(), d.getCreatedAt(), d.getLastUsedAt(), d.getExpiresAt()
            );
        }
    }
}
