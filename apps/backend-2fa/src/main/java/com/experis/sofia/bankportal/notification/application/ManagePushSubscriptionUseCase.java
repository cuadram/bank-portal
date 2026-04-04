package com.experis.sofia.bankportal.notification.application;

import com.experis.sofia.bankportal.notification.domain.PushSubscription;
import com.experis.sofia.bankportal.notification.domain.PushSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Caso de uso: gestión de suscripciones Web Push — FEAT-014.
 *
 * <p>Límite de 5 suscripciones activas por usuario (multi-device).
 * La limpieza de endpoints inválidos (HTTP 410) la realiza {@link WebPushService}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ManagePushSubscriptionUseCase {

    private static final int MAX_SUBSCRIPTIONS_PER_USER = 5;

    private final PushSubscriptionRepository repo;

    /**
     * Registra una nueva suscripción. Si el endpoint ya existe, es idempotente.
     *
     * @return ID de la suscripción creada (o existente)
     * @throws PushSubscriptionLimitException si el usuario tiene ≥ 5 suscripciones
     */
    @Transactional
    public UUID subscribe(UUID userId, PushSubscribeRequest req) {
        // Idempotencia: si el endpoint ya existe para este usuario, retornar su ID
        return repo.findByEndpoint(req.endpoint())
                .map(PushSubscription::getId)
                .orElseGet(() -> {
                    long count = repo.countByUserId(userId);
                    if (count >= MAX_SUBSCRIPTIONS_PER_USER) {
                        throw new PushSubscriptionLimitException(userId, count);
                    }
                    var sub = new PushSubscription(
                            userId, req.endpoint(), req.p256dh(), req.auth(), req.userAgent());
                    return repo.save(sub).getId();
                });
    }

    /** Cancela una suscripción propia. Silencioso si no existe. */
    @Transactional
    public void unsubscribe(UUID userId, UUID subscriptionId) {
        int deleted = repo.deleteByIdAndUserId(subscriptionId, userId);
        log.debug("[Push] unsubscribed userId={} subscriptionId={} deleted={}",
                userId, subscriptionId, deleted);
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public record PushSubscribeRequest(
            String endpoint,
            String p256dh,
            String auth,
            String userAgent
    ) {}

    public static class PushSubscriptionLimitException extends RuntimeException {
        public PushSubscriptionLimitException(UUID userId, long count) {
            super("User " + userId + " has reached max push subscriptions (" + count + ")");
        }
    }
}
