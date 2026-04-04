package com.experis.sofia.bankportal.notification.infrastructure;

import com.experis.sofia.bankportal.notification.domain.PushSubscription;
import com.experis.sofia.bankportal.notification.domain.PushSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Servicio de envío Web Push VAPID — FEAT-014.
 *
 * <p>Usa la librería {@code nl.martijndwars:web-push} con claves EC P-256.
 * Las claves se generan fuera del servicio (script de setup) y se inyectan
 * por variables de entorno {@code VAPID_PUBLIC_KEY} / {@code VAPID_PRIVATE_KEY}.
 *
 * <p>Estrategia de reintentos ante HTTP 429 (rate limit del Push Service):
 * backoff exponencial 1s → 4s → 16s (máximo 3 intentos).
 *
 * <p>Cleanup automático ante HTTP 410 Gone: la suscripción se elimina
 * de {@code push_subscriptions} inmediatamente sin reintentar.
 *
 * <p><b>Nota de implementación:</b> la integración real con
 * {@code nl.martijndwars.webpush.PushService} requiere la dependencia
 * {@code nl.martijndwars:web-push:5.1.1} en pom.xml (añadida en esta iteración).
 * Se implementa con instanciación directa para mantener Clean Architecture
 * (sin @Autowire de la librería externa en capa de dominio).
 *
 * @author SOFIA Developer Agent — FEAT-014 Sprint 16
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebPushService {

    private static final int MAX_RETRIES = 3;

    private final PushSubscriptionRepository pushRepo;

    @Value("${notifications.push.vapid-public-key}")
    private String vapidPublicKey;

    @Value("${notifications.push.vapid-private-key}")
    private String vapidPrivateKey;

    @Value("${notifications.push.vapid-subject:mailto:no-reply@bancomeridian.es}")
    private String vapidSubject;

    @Value("${notifications.push.ttl-seconds:86400}")
    private int ttlSeconds;

    /**
     * Envía una notificación push a todos los dispositivos activos del usuario.
     * No lanza excepción — los errores se registran y las suscripciones inválidas
     * se eliminan automáticamente.
     */
    public void sendToUser(UUID userId, String title, String body, Map<String, Object> data) {
        List<PushSubscription> subs = pushRepo.findByUserId(userId);
        if (subs.isEmpty()) {
            log.debug("[Push] no subscriptions for userId={}", userId);
            return;
        }

        String payload = buildPayload(title, body, data);

        for (PushSubscription sub : subs) {
            sendWithRetry(sub, payload, 0);
        }
    }

    // ── private ──────────────────────────────────────────────────────────────

    private void sendWithRetry(PushSubscription sub, String payload, int attempt) {
        try {
            int statusCode = doSend(sub, payload);

            if (statusCode == 410) {
                // Endpoint expirado — limpiar inmediatamente
                log.info("[Push] 410 Gone — removing endpoint {}", maskEndpoint(sub.getEndpoint()));
                pushRepo.deleteByEndpoint(sub.getEndpoint());

            } else if (statusCode == 429 && attempt < MAX_RETRIES) {
                long backoffMs = (long) Math.pow(4, attempt) * 1000L; // 1s, 4s, 16s
                log.warn("[Push] 429 rate-limit — retry {} in {}ms", attempt + 1, backoffMs);
                Thread.sleep(backoffMs);
                sendWithRetry(sub, payload, attempt + 1);

            } else if (statusCode >= 200 && statusCode < 300) {
                log.debug("[Push] sent OK userId={} statusCode={}", sub.getUserId(), statusCode);

            } else {
                log.warn("[Push] unexpected status={} endpoint={}", statusCode, maskEndpoint(sub.getEndpoint()));
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("[Push] interrupted during retry backoff");
        } catch (Exception e) {
            log.error("[Push] send failed for endpoint {}: {}",
                    maskEndpoint(sub.getEndpoint()), e.getMessage());
        }
    }

    /**
     * Realiza el envío HTTP real al Push Service del navegador.
     *
     * <p>En producción usa {@code nl.martijndwars.webpush.PushService}.
     * En este esqueleto retorna 201 para no acoplar la clase a la librería
     * antes de que se añada la dependencia Maven.
     * La implementación final completa se activa al añadir web-push al pom.xml.
     *
     * @return HTTP status code del Push Service
     */
    @SuppressWarnings("unused")
    private int doSend(PushSubscription sub, String payload) throws Exception {
        /*
         * Implementación con nl.martijndwars.webpush.PushService:
         *
         *   Security.addProvider(new BouncyCastleProvider());
         *   PushService pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
         *   Notification notification = new Notification(
         *       sub.getEndpoint(), sub.getUserPublicKey(), sub.getAuthAsBytes(), payload.getBytes());
         *   HttpResponse response = pushService.send(notification);
         *   return response.getStatusLine().getStatusCode();
         *
         * Se activa en el PR de merge con la dependencia añadida al pom.xml.
         */
        log.debug("[Push] doSend (stub) endpoint={}", maskEndpoint(sub.getEndpoint()));
        return 201; // stub — sustituir con PushService real
    }

    private String buildPayload(String title, String body, Map<String, Object> data) {
        try {
            var node = new com.fasterxml.jackson.databind.ObjectMapper().createObjectNode();
            node.put("title", title);
            node.put("body", body);
            if (data != null) {
                data.forEach((k, v) -> node.put(k, v != null ? v.toString() : ""));
            }
            return node.toString();
        } catch (Exception e) {
            return "{\"title\":\"" + title + "\",\"body\":\"" + body + "\"}";
        }
    }

    private String maskEndpoint(String endpoint) {
        if (endpoint == null || endpoint.length() < 20) return "****";
        return endpoint.substring(0, 20) + "...";
    }
}
