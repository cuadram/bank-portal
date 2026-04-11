package com.experis.sofia.bankportal.notification.api;

import com.experis.sofia.bankportal.notification.application.ManagePushSubscriptionUseCase;
import com.experis.sofia.bankportal.notification.application.ManagePushSubscriptionUseCase.PushSubscribeRequest;
import com.experis.sofia.bankportal.notification.application.ManagePushSubscriptionUseCase.PushSubscriptionLimitException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * POST/DELETE /api/v1/notifications/push/subscribe — FEAT-014.
 *
 * <p>Gestiona las suscripciones Web Push VAPID del usuario.
 * El límite de 5 suscripciones activas por usuario se enforcea en
 * {@link ManagePushSubscriptionUseCase}.
 *
 * @author SOFIA Developer Agent — FEAT-014 Sprint 16
 */
@RestController
@RequestMapping("/api/v1/notifications/push")
@RequiredArgsConstructor
public class PushSubscriptionController {

    private final ManagePushSubscriptionUseCase useCase;

    /** POST /api/v1/notifications/push/subscribe */
    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(
            HttpServletRequest request,
            @Valid @RequestBody PushSubscribeRequestDto req) {
        UUID userId = (UUID) request.getAttribute("authenticatedUserId");
        try {
            UUID subscriptionId = useCase.subscribe(userId,
                    new PushSubscribeRequest(req.endpoint(), req.p256dh(),
                            req.auth(), req.userAgent()));
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("subscriptionId", subscriptionId.toString()));
        } catch (PushSubscriptionLimitException e) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                    .body(Map.of("error", "SUBSCRIPTION_LIMIT_REACHED",
                            "message", "Maximum 5 active subscriptions per user"));
        }
    }

    /** DELETE /api/v1/notifications/push/subscribe/{subscriptionId} */
    @DeleteMapping("/subscribe/{subscriptionId}")
    public ResponseEntity<Void> unsubscribe(
            HttpServletRequest request,
            @PathVariable UUID subscriptionId) {
        UUID userId = (UUID) request.getAttribute("authenticatedUserId");
        useCase.unsubscribe(userId, subscriptionId);
        return ResponseEntity.noContent().build();
    }

    // ── DTO ──────────────────────────────────────────────────────────────────

    public record PushSubscribeRequestDto(
            @NotBlank String endpoint,
            @NotBlank String p256dh,
            @NotBlank String auth,
            String userAgent
    ) {}
}
