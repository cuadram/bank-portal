package com.experis.sofia.bankportal.auth.api;

import com.experis.sofia.bankportal.auth.application.AccountUnlockUseCase;
import com.experis.sofia.bankportal.auth.application.LoginContextUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.UUID;

/**
 * Controllers para bloqueo de cuenta (US-601/602) y autenticación contextual (US-603).
 *
 * Endpoints:
 *   POST /api/v1/account/unlock          → solicitar enlace de desbloqueo (US-602, público)
 *   GET  /api/v1/account/unlock/{token}  → desbloquear cuenta (US-602, público)
 *   POST /api/v1/auth/confirm-context    → confirmar subnet nueva (US-603, context-pending JWT)
 *
 * RV-S7-002 fix: eliminado import no usado {@code AccountLockUseCase}.
 *
 * @author SOFIA Developer Agent — FEAT-006 Sprint 7
 */
@RestController
@RequiredArgsConstructor
public class AccountAndContextController {

    private final AccountUnlockUseCase accountUnlockUseCase;
    private final LoginContextUseCase  loginContextUseCase;

    /** US-602 — Solicitar enlace de desbloqueo. Respuesta 204 neutra (evita user enumeration). */
    @PostMapping("/api/v1/account/unlock")
    public ResponseEntity<Void> requestUnlock(@RequestBody RequestUnlockRequest request) {
        accountUnlockUseCase.requestUnlock(request.email());
        return ResponseEntity.noContent().build();
    }

    /** US-602 — Desbloquear cuenta desde enlace de email. Redirect a /login?reason=account-unlocked. */
    @GetMapping("/api/v1/account/unlock/{token}")
    public ResponseEntity<Void> unlockByToken(@PathVariable String token) {
        try {
            accountUnlockUseCase.unlockByToken(token);
            return ResponseEntity.status(302)
                    .location(URI.create("/login?reason=account-unlocked"))
                    .build();
        } catch (AccountUnlockUseCase.UnlockTokenException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * US-603 — Confirmar acceso desde subnet nueva.
     * Requiere JWT scope=context-pending (ADR-011). Extrae pendingSubnet del claim JWT.
     */
    @PostMapping("/api/v1/auth/confirm-context")
    public ResponseEntity<ConfirmContextResponse> confirmContext(
            @RequestBody ConfirmContextRequest request,
            @AuthenticationPrincipal Jwt jwt,
            jakarta.servlet.http.HttpServletRequest httpRequest) {

        UUID   userId        = UUID.fromString(jwt.getSubject());
        String pendingSubnet = jwt.getClaim("pendingSubnet");
        String currentSubnet = extractSubnet(httpRequest.getRemoteAddr());

        try {
            loginContextUseCase.confirmContext(
                    userId, pendingSubnet, currentSubnet, request.confirmationToken());
            // TODO(impl): jwtService.blacklist(jwt.getId()) + jwtService.issueFullSession(userId)
            return ResponseEntity.ok(new ConfirmContextResponse("full-session-jwt-placeholder"));
        } catch (LoginContextUseCase.ContextConfirmException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Extrae los dos primeros octetos de la IP (subnet /16).
     * TODO(SUG-S7-001): delegar en DeviceFingerprintService.extractIpSubnet() para evitar duplicación.
     */
    private String extractSubnet(String rawIp) {
        if (rawIp == null) return "";
        String[] parts = rawIp.split("\\.");
        return parts.length >= 2 ? parts[0] + "." + parts[1] : rawIp;
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public record RequestUnlockRequest(String email) {}

    public record ConfirmContextRequest(String confirmationToken) {}

    public record ConfirmContextResponse(String accessToken) {}
}
