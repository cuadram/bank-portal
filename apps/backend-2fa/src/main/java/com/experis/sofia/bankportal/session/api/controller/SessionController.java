package com.experis.sofia.bankportal.session.api.controller;

import com.experis.sofia.bankportal.session.application.dto.SessionResponse;
import com.experis.sofia.bankportal.session.application.dto.UpdateTimeoutRequest;
import com.experis.sofia.bankportal.session.application.usecase.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller REST para gestión de sesiones activas (FEAT-002).
 *
 * <p>Endpoints:
 * <ul>
 *   <li>GET  /api/v1/sessions             → lista sesiones activas (US-101)</li>
 *   <li>DELETE /api/v1/sessions/{id}      → revoca sesión individual (US-102)</li>
 *   <li>DELETE /api/v1/sessions           → revoca todas excepto la actual (US-102)</li>
 *   <li>PUT  /api/v1/sessions/timeout     → actualiza timeout (US-103)</li>
 *   <li>GET  /api/v1/sessions/deny/{tok}  → deniega sesión desde email (US-105)</li>
 * </ul>
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final ListActiveSessionsUseCase  listSessions;
    private final RevokeSessionUseCase       revokeSession;
    private final RevokeAllSessionsUseCase   revokeAll;
    private final UpdateSessionTimeoutUseCase updateTimeout;
    private final DenySessionByLinkUseCase   denyByLink;

    /**
     * US-101 — Lista sesiones activas del usuario autenticado.
     */
    @GetMapping
    public ResponseEntity<List<SessionResponse>> listActiveSessions(
            @AuthenticationPrincipal Jwt jwt) {

        UUID   userId     = UUID.fromString(jwt.getSubject());
        String currentJti = jwt.getId();
        return ResponseEntity.ok(listSessions.execute(userId, currentJti));
    }

    /**
     * US-102 — Revoca una sesión individual.
     * OTP requerido en header {@code X-OTP-Code}.
     */
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> revokeOne(
            @PathVariable UUID sessionId,
            @RequestHeader("X-OTP-Code") String otpCode,
            @AuthenticationPrincipal Jwt jwt) {

        UUID   userId     = UUID.fromString(jwt.getSubject());
        String currentJti = jwt.getId();
        revokeSession.execute(sessionId, userId, currentJti, otpCode);
        return ResponseEntity.noContent().build();
    }

    /**
     * US-102 — Revoca todas las sesiones excepto la actual.
     * OTP requerido en header {@code X-OTP-Code}.
     */
    @DeleteMapping
    public ResponseEntity<Void> revokeAllOthers(
            @RequestHeader("X-OTP-Code") String otpCode,
            @AuthenticationPrincipal Jwt jwt) {

        UUID   userId     = UUID.fromString(jwt.getSubject());
        String currentJti = jwt.getId();
        revokeAll.execute(userId, currentJti, otpCode);
        return ResponseEntity.noContent().build();
    }

    /**
     * US-103 — Actualiza el timeout de inactividad.
     */
    @PutMapping("/timeout")
    public ResponseEntity<UpdateTimeoutResponse> updateTimeout(
            @Valid @RequestBody UpdateTimeoutRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        int  saved  = updateTimeout.execute(userId, request);
        return ResponseEntity.ok(new UpdateTimeoutResponse(saved));
    }

    /**
     * US-105 — Deniega sesión desde enlace de email (sin autenticación).
     * Redirige al login tras revocar.
     */
    @GetMapping("/deny/{token}")
    public ResponseEntity<Void> denyByEmailLink(@PathVariable String token) {
        denyByLink.execute(token);
        return ResponseEntity
                .status(302)
                .header("Location", "/login?reason=session-denied")
                .build();
    }

    // ── DTO local de respuesta ────────────────────────────────────────────────
    public record UpdateTimeoutResponse(int timeoutMinutes) {}
}
