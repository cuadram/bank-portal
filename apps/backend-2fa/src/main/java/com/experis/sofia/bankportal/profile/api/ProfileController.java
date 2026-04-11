package com.experis.sofia.bankportal.profile.api;

import com.experis.sofia.bankportal.notification.application.ManageNotificationsUseCase;
import com.experis.sofia.bankportal.notification.domain.UserNotification;
import com.experis.sofia.bankportal.profile.application.*;
import com.experis.sofia.bankportal.profile.application.dto.*;
import com.experis.sofia.bankportal.session.application.dto.SessionResponse;
import com.experis.sofia.bankportal.session.application.usecase.ListActiveSessionsUseCase;
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
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * REST API — Gestión de perfil de usuario.
 * FEAT-012-A Sprint 14 — US-1201/1202/1203/1205
 * DEBT-043 Sprint 22: añadido GET /notifications (RN-F020-19)
 * SAST-002 fix (Sprint 15): rate limiting en POST /profile/password — máx 5/10min por userId.
 *
 * @author SOFIA Developer Agent — Sprint 14/15/22
 */
@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final GetProfileUseCase          getProfile;
    private final UpdateProfileUseCase       updateProfile;
    private final ChangePasswordUseCase      changePassword;
    private final ManageSessionsUseCase      manageSessions;
    private final ListActiveSessionsUseCase  listSessions;
    private final ManageNotificationsUseCase manageNotifications;   // DEBT-043

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

    /**
     * GET /api/v1/profile/notifications — últimas 20 notificaciones del usuario.
     * DEBT-043 / RN-F020-19: SIEMPRE HTTP 200 + [] si vacío — NUNCA 404.
     * LA-STG-001: catchError devuelve of([]) en el frontend — compatible.
     */
    @GetMapping("/notifications")
    public ResponseEntity<List<UserNotification>> getNotifications(HttpServletRequest req) {
        List<UserNotification> notifications = manageNotifications
                .listNotifications(userId(req), null, 0, 20)
                .getContent();
        return ResponseEntity.ok(notifications);
    }

    /**
     * GET /api/v1/profile/sessions — lista sesiones activas del usuario.
     * RF-019-03: el usuario puede ver y revocar sesiones abiertas desde el perfil.
     */
    @GetMapping("/sessions")
    public ResponseEntity<List<SessionResponse>> listSessions(HttpServletRequest req) {
        return ResponseEntity.ok(listSessions.execute(userId(req), jti(req)));
    }

    @DeleteMapping("/sessions/{jtiToRevoke}")
    public ResponseEntity<Void> revokeSession(
            @PathVariable String jtiToRevoke, HttpServletRequest req) {
        manageSessions.revoke(userId(req), jtiToRevoke, jti(req), expiresAt(req));
        return ResponseEntity.noContent().build();
    }
}
