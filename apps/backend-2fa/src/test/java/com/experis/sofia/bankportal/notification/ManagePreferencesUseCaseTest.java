package com.experis.sofia.bankportal.notification;

import com.experis.sofia.bankportal.notification.application.ManagePreferencesUseCase;
import com.experis.sofia.bankportal.notification.application.ManagePreferencesUseCase.PreferencePatchRequest;
import com.experis.sofia.bankportal.notification.domain.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios para {@link ManagePreferencesUseCase} — FEAT-014.
 * CMMI Level 3 — VER SP 1.1
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ManagePreferencesUseCase — gestión de preferencias de canal")
class ManagePreferencesUseCaseTest {

    @Mock NotificationPreferenceRepository repo;
    @InjectMocks ManagePreferencesUseCase useCase;

    @Nested
    @DisplayName("getPreferences — lazy defaults")
    class GetPreferencesTests {

        @Test
        @DisplayName("Sin filas en BD → retorna defaults para todos los event types")
        void noRows_returnsDefaultsForAllEventTypes() {
            UUID userId = UUID.randomUUID();
            when(repo.findByUserId(userId)).thenReturn(List.of());

            List<NotificationPreference> result = useCase.getPreferences(userId);

            assertThat(result).hasSize(NotificationEventType.values().length);
            assertThat(result).allMatch(p -> p.isEmailEnabled() && p.isPushEnabled()
                    && p.isInAppEnabled());
        }

        @Test
        @DisplayName("Con una fila existente → la usa y completa el resto con defaults")
        void oneRowExists_mergesWithDefaults() {
            UUID userId = UUID.randomUUID();
            var existing = new NotificationPreference();
            existing.setUserId(userId);
            existing.setEventType(NotificationEventType.TRANSFER_COMPLETED);
            existing.setPushEnabled(false);
            when(repo.findByUserId(userId)).thenReturn(List.of(existing));

            List<NotificationPreference> result = useCase.getPreferences(userId);

            assertThat(result).hasSize(NotificationEventType.values().length);

            // La existente respeta el push=false guardado
            var transferPref = result.stream()
                    .filter(p -> p.getEventType() == NotificationEventType.TRANSFER_COMPLETED)
                    .findFirst().orElseThrow();
            assertThat(transferPref.isPushEnabled()).isFalse();

            // Las demás tienen defaults activos
            result.stream()
                    .filter(p -> p.getEventType() != NotificationEventType.TRANSFER_COMPLETED)
                    .forEach(p -> assertThat(p.isPushEnabled()).isTrue());
        }
    }

    @Nested
    @DisplayName("updatePreference — PATCH parcial")
    class UpdatePreferenceTests {

        @Test
        @DisplayName("Fila existente → modifica solo los campos enviados")
        void existingPref_patchesOnlyProvidedFields() {
            UUID userId = UUID.randomUUID();
            var existing = NotificationPreference.defaults(userId,
                    NotificationEventType.TRANSFER_COMPLETED);
            when(repo.findByUserIdAndEventType(userId, NotificationEventType.TRANSFER_COMPLETED))
                    .thenReturn(Optional.of(existing));
            when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

            var req = new PreferencePatchRequest(
                    NotificationEventType.TRANSFER_COMPLETED,
                    null,       // emailEnabled → no cambiar
                    false,      // pushEnabled  → desactivar
                    null        // inAppEnabled → no cambiar
            );

            NotificationPreference result = useCase.updatePreference(userId, req);

            assertThat(result.isPushEnabled()).isFalse();
            assertThat(result.isEmailEnabled()).isTrue();   // sin cambio
            assertThat(result.isInAppEnabled()).isTrue();   // sin cambio
        }

        @Test
        @DisplayName("Sin fila existente → crea nueva con defaults y aplica patch")
        void noPrefRow_createsDefaultAndPatches() {
            UUID userId = UUID.randomUUID();
            when(repo.findByUserIdAndEventType(any(), any())).thenReturn(Optional.empty());

            var captor = ArgumentCaptor.forClass(NotificationPreference.class);
            when(repo.save(captor.capture())).thenAnswer(i -> i.getArgument(0));

            var req = new PreferencePatchRequest(
                    NotificationEventType.KYC_APPROVED,
                    false, false, false
            );

            useCase.updatePreference(userId, req);

            NotificationPreference saved = captor.getValue();
            assertThat(saved.isEmailEnabled()).isFalse();
            assertThat(saved.isPushEnabled()).isFalse();
            assertThat(saved.isInAppEnabled()).isFalse();
            assertThat(saved.getEventType()).isEqualTo(NotificationEventType.KYC_APPROVED);
        }

        @Test
        @DisplayName("Patch con todos null → no modifica ningún campo")
        void allNullPatch_noFieldsChanged() {
            UUID userId = UUID.randomUUID();
            var existing = NotificationPreference.defaults(userId,
                    NotificationEventType.BILL_PAID);
            existing.setPushEnabled(false); // estado previo
            when(repo.findByUserIdAndEventType(any(), any()))
                    .thenReturn(Optional.of(existing));
            when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

            var req = new PreferencePatchRequest(
                    NotificationEventType.BILL_PAID, null, null, null);
            NotificationPreference result = useCase.updatePreference(userId, req);

            assertThat(result.isPushEnabled()).isFalse(); // conserva el estado previo
        }
    }
}
