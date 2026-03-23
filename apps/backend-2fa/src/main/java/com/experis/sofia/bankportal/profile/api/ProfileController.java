package com.experis.sofia.bankportal.profile.api;

import com.experis.sofia.bankportal.profile.application.*;
import com.experis.sofia.bankportal.profile.application.dto.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.UUID;

/**
 * REST API — Gestión de perfil de usuario.
 * FEAT-012-A Sprint 14 — US-1201 / US-1202 / US-1203 / US-1205
 *
 * userId, jti y expiresAt extraídos de atributos de request
 * inyectados por JwtAuthenticationFilter (DEBT-022/023).
 *
 * @author SOFIA Developer Agent — Sprint 14
 */
@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final GetProfileUseCase    getProfile;
    private final UpdateProfileUseCase updateProfile;
    private final ChangePasswordUseCase changePassword;
    private final ManageSessionsUseCase manageSessions;

    // ── Helpers ──────────────────────────────────────────────────────────────
    private UUID   userId(HttpServletRequest req)     { return (UUID)    req.getAttribute("authenticatedUserId"); }
    private String jti(HttpServletRequest req)         { return (String)  req.getAttribute("authenticatedJti"); }
    private Instant expiresAt(HttpServletRequest req)  { return (Instant) req.getAttribute("jwtExpiresAt"); }
    private String  ip(HttpServletRequest req)         { return req.getRemoteAddr(); }

    // ── US-1201 — Ver perfil ──────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(HttpServletRequest req) {
        return ResponseEntity.ok(getProfile.execute(userId(req)));
    }

    // ── US-1202 — Actualizar datos personales ─────────────────────────────────
    @PatchMapping
    public ResponseEntity<ProfileResponse> updateProfile(
            @RequestBody UpdateProfileRequest body, HttpServletRequest req) {
        return ResponseEntity.ok(updateProfile.execute(userId(req), body, ip(req)));
    }

    // ── US-1203 — Cambiar contraseña ──────────────────────────────────────────
    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(
            @RequestBody ChangePasswordRequest body, HttpServletRequest req) {
        changePassword.execute(userId(req), jti(req), body);
        return ResponseEntity.noContent().build();
    }

    // ── US-1205 — Revocar sesión ──────────────────────────────────────────────
    @DeleteMapping("/sessions/{jtiToRevoke}")
    public ResponseEntity<Void> revokeSession(
            @PathVariable String jtiToRevoke, HttpServletRequest req) {
        manageSessions.revoke(userId(req), jtiToRevoke, jti(req), expiresAt(req));
        return ResponseEntity.noContent().build();
    }
}
