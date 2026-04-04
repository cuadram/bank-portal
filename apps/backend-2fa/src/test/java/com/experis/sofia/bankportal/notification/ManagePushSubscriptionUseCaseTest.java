package com.experis.sofia.bankportal.notification;

import com.experis.sofia.bankportal.notification.application.ManagePushSubscriptionUseCase;
import com.experis.sofia.bankportal.notification.application.ManagePushSubscriptionUseCase.PushSubscribeRequest;
import com.experis.sofia.bankportal.notification.application.ManagePushSubscriptionUseCase.PushSubscriptionLimitException;
import com.experis.sofia.bankportal.notification.domain.PushSubscription;
import com.experis.sofia.bankportal.notification.domain.PushSubscriptionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para {@link ManagePushSubscriptionUseCase} — FEAT-014.
 * Verifica: registro, idempotencia, límite de 5 suscripciones, baja.
 * CMMI Level 3 — VER SP 1.1
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ManagePushSubscriptionUseCase — gestión suscripciones Web Push")
class ManagePushSubscriptionUseCaseTest {

    @Mock PushSubscriptionRepository repo;
    @InjectMocks ManagePushSubscriptionUseCase useCase;

    private PushSubscribeRequest validRequest(String endpointSuffix) {
        return new PushSubscribeRequest(
                "https://push.example.com/sub/" + endpointSuffix,
                "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LfAk",
                "tBHItJI5svbpez7KI4CCXg==",
                "Mozilla/5.0 Chrome/120"
        );
    }

    @Nested
    @DisplayName("subscribe — registro")
    class SubscribeTests {

        @Test
        @DisplayName("Endpoint nuevo → crea suscripción y retorna su ID")
        void newEndpoint_createsSub() {
            UUID userId = UUID.randomUUID();
            UUID expectedId = UUID.randomUUID();
            when(repo.findByEndpoint(any())).thenReturn(Optional.empty());
            when(repo.countByUserId(userId)).thenReturn(0L);

            var savedSub = new PushSubscription(userId, "https://push.example.com/sub/1",
                    "p256dh", "auth", "UA");
            savedSub.setId(expectedId);
            when(repo.save(any())).thenReturn(savedSub);

            UUID result = useCase.subscribe(userId, validRequest("1"));

            assertThat(result).isEqualTo(expectedId);
            verify(repo).save(any(PushSubscription.class));
        }

        @Test
        @DisplayName("Endpoint ya existente → idempotente, retorna ID existente sin insertar")
        void existingEndpoint_idempotent_noInsert() {
            UUID userId = UUID.randomUUID();
            UUID existingId = UUID.randomUUID();

            var existing = new PushSubscription(userId, "https://push.example.com/sub/1",
                    "p256dh", "auth", "UA");
            existing.setId(existingId);
            when(repo.findByEndpoint(any())).thenReturn(Optional.of(existing));

            UUID result = useCase.subscribe(userId, validRequest("1"));

            assertThat(result).isEqualTo(existingId);
            verify(repo, never()).save(any());
            verify(repo, never()).countByUserId(any());
        }

        @Test
        @DisplayName("Usuario con 5 suscripciones → lanza PushSubscriptionLimitException")
        void fiveSubscriptions_throwsLimitException() {
            UUID userId = UUID.randomUUID();
            when(repo.findByEndpoint(any())).thenReturn(Optional.empty());
            when(repo.countByUserId(userId)).thenReturn(5L);

            assertThatThrownBy(() -> useCase.subscribe(userId, validRequest("new")))
                    .isInstanceOf(PushSubscriptionLimitException.class)
                    .hasMessageContaining(userId.toString());

            verify(repo, never()).save(any());
        }

        @Test
        @DisplayName("Usuario con 4 suscripciones → puede añadir una más")
        void fourSubscriptions_canAddOne() {
            UUID userId = UUID.randomUUID();
            when(repo.findByEndpoint(any())).thenReturn(Optional.empty());
            when(repo.countByUserId(userId)).thenReturn(4L);

            var sub = new PushSubscription(userId, "https://push.example.com/sub/5",
                    "p256dh", "auth", "UA");
            sub.setId(UUID.randomUUID());
            when(repo.save(any())).thenReturn(sub);

            assertThatCode(() -> useCase.subscribe(userId, validRequest("5")))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Subscription guardada tiene los campos correctos del request")
        void savedSub_hasCorrectFields() {
            UUID userId = UUID.randomUUID();
            when(repo.findByEndpoint(any())).thenReturn(Optional.empty());
            when(repo.countByUserId(userId)).thenReturn(0L);

            var captor = ArgumentCaptor.forClass(PushSubscription.class);
            when(repo.save(captor.capture())).thenAnswer(i -> {
                var s = (PushSubscription) i.getArgument(0);
                s.setId(UUID.randomUUID());
                return s;
            });

            var req = new PushSubscribeRequest(
                    "https://push.example.com/sub/test",
                    "p256dhValue", "authValue", "Chrome/120");

            useCase.subscribe(userId, req);

            PushSubscription saved = captor.getValue();
            assertThat(saved.getUserId()).isEqualTo(userId);
            assertThat(saved.getEndpoint()).isEqualTo("https://push.example.com/sub/test");
            assertThat(saved.getP256dh()).isEqualTo("p256dhValue");
            assertThat(saved.getAuth()).isEqualTo("authValue");
        }
    }

    @Nested
    @DisplayName("unsubscribe — baja")
    class UnsubscribeTests {

        @Test
        @DisplayName("Suscripción propia existente → la elimina")
        void ownSub_deletes() {
            UUID userId = UUID.randomUUID();
            UUID subId  = UUID.randomUUID();
            when(repo.deleteByIdAndUserId(subId, userId)).thenReturn(1);

            useCase.unsubscribe(userId, subId);

            verify(repo).deleteByIdAndUserId(subId, userId);
        }

        @Test
        @DisplayName("Suscripción inexistente → silencioso, no lanza excepción")
        void nonExistentSub_silent() {
            UUID userId = UUID.randomUUID();
            UUID subId  = UUID.randomUUID();
            when(repo.deleteByIdAndUserId(subId, userId)).thenReturn(0);

            assertThatCode(() -> useCase.unsubscribe(userId, subId))
                    .doesNotThrowAnyException();
        }
    }
}
