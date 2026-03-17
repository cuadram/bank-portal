package com.experis.sofia.bankportal.auth.api;

import com.experis.sofia.bankportal.auth.application.AccountUnlockUseCase;
import com.experis.sofia.bankportal.auth.application.LoginContextUseCase;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.UUID;

/**
 * Endpoints para desbloqueo de cuenta (US-602) y confirmación de contexto (US-603).
 *
 * <p>Rutas:
 * <pre>
 *   POST /api/v1/account/unlock           → solicitar enlace de desbloqueo (público)
 *   GET  /api/v1/account/unlock/{token}   → desbloquear desde email (público)
 *   POST /api/v1/auth/confirm-context     → confirmar subnet nueva (scope=context-pending)
 * </pre>
 *
 * <p>Seguridad:
 * <ul>
 *   <li>/account/unlock* → permitAll (usuario no tiene JWT — cuenta bloqueada)</li>
 *   <li>/auth/confirm-context → hasAuthority("SCOPE_context-pending") (ADR-011)</li>
 * </ul>
 *
 * @author SOFIA Developer Agent — FEAT-006 Sprint 7 Semana 2
 */
@RestController
@RequiredArgsConstructor
public class AccountAndContextController {

    private final AccountUnlockUseCase  accountUnlockUseCase;
    private final LoginContextUseCase   loginContextUseCase;

    // ─────────────────────────────────────────────────────────────────────────
    // US-602: Desbloqueo por email
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Solicitar enlace de desbloqueo.
     * Siempre devuelve 204 para no revelar si el email existe (R-SEC-004).
     */
    @PostMapping("/api/v1/account/unlock")
    public ResponseEntity<Void> requestUnlock(
            @Valid @RequestBody RequestUnlockRequest request) {
        accountUnlockUseCase.requestUnlock(request.email());
        return ResponseEntity.noContent().build();
    }

    /**
     * Desbloquear cuenta desde deep-link de email.
     * Redirige a /login?reason=account-unlocked si ok, 400 si token inválido.
     */
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

    // ─────────────────────────────────────────────────────────────────────────
    // US-603: Confirmación de contexto
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Confirmar acceso desde subnet nueva.
     *
     * <p>Requiere JWT scope=context-pending (ADR-011). El filtro JWT ya validó que
     * el claim {@code pendingSubnet} coincide con la subnet de la request actual.
     * Este endpoint completa el flujo: valida token, persiste subnet, devuelve 204.
     * El cliente debe obtener un nuevo JWT full-session después de la confirmación.
     */
    @PostMapping("/api/v1/auth/confirm-context")
    public ResponseEntity<Void> confirmContext(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ConfirmContextRequest request) {

        UUID userId       = UUID.fromString(jwt.getSubject());
        String pendingSub = jwt.getClaimAsString("pendingSubnet");
        String currentSub = request.currentSubnet();

        try {
            loginContextUseCase.confirmContext(userId, pendingSub, currentSub, request.confirmToken());
            return ResponseEntity.noContent().build();
        } catch (LoginContextUseCase.ContextConfirmException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DTOs
    // ─────────────────────────────────────────────────────────────────────────

    record RequestUnlockRequest(@Email @NotBlank String email) {}

    record ConfirmContextRequest(
            @NotBlank String confirmToken,
            @NotBlank String currentSubnet
    ) {}
}
