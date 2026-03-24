package com.experis.sofia.bankportal.profile.api;

import com.experis.sofia.bankportal.profile.application.*;
import com.experis.sofia.bankportal.profile.application.dto.*;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * REST API — Gestión de perfil de usuario.
 * FEAT-012-A Sprint 14 — US-1201/1202/1203/1205
 * SAST-002 fix (Sprint 15): rate limiting en POST /profile/password — máx 5/10min por userId.
 *
 * @author SOFIA Developer Agent — Sprint 14/15
 */
@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final GetProfileUseCase     getProfile;
    private final UpdateProfileUseCase  updateProfile;
    private final ChangePasswordUseCase changePassword;
    private final ManageSessionsUseCase manageSessions;

    // SAST-002: Bucket4j — rate limiter por userId para cambio de contraseña
    private final Map<UUID, Bucket> passwordBuckets = new ConcurrentHashMap<>();

    private UUID    userId(HttpServletRequest req)    { return (UUID)    req.getAttribute("authenticatedUserId"); }
    private String  jti(HttpServletRequest req)       { return (String)  req.getAttribute("authenticatedJti"); }
    private Instant expiresAt(HttpServletRequest req) { return (Instant) req.getAttribute("jwtExpiresAt"); }
    private String  ip(HttpServletRequest req)        { return req.getRemoteAddr(); }

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(HttpServletRequest req) {
        return ResponseEntity.ok(getProfile.execute(userId(req)));
    }

    @PatchMapping
    public ResponseEntity<ProfileResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest body, HttpServletRequest req) {
        return ResponseEntity.ok(updateProfile.execute(userId(req), body, ip(req)));
    }

    /** SAST-002: máx 5 intentos de cambio de contraseña por usuario cada 10 minutos. */
    @PostMapping("/password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest body, HttpServletRequest req) {
        UUID uid = userId(req);
        Bucket bucket = passwordBuckets.computeIfAbsent(uid, id ->
                Bucket.builder()
                      .addLimit(Bandwidth.builder()
                              .capacity(5)
                              .refillIntervally(5, Duration.ofMinutes(10))
                              .build())
                      .build());

        if (!bucket.tryConsume(1))
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "RATE_LIMIT_EXCEEDED",
                                 "retryAfterMinutes", 10));

        changePassword.execute(uid, jti(req), body);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/sessions/{jtiToRevoke}")
    public ResponseEntity<Void> revokeSession(
            @PathVariable String jtiToRevoke, HttpServletRequest req) {
        manageSessions.revoke(userId(req), jtiToRevoke, jti(req), expiresAt(req));
        return ResponseEntity.noContent().build();
    }
}
