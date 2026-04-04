package com.experis.sofia.bankportal.privacy;

import com.experis.sofia.bankportal.privacy.application.ConsentManagementService;
import com.experis.sofia.bankportal.privacy.application.dto.ConsentResponse;
import com.experis.sofia.bankportal.privacy.application.dto.ConsentUpdateRequest;
import com.experis.sofia.bankportal.privacy.domain.ConsentHistory;
import com.experis.sofia.bankportal.privacy.domain.ConsentType;
import com.experis.sofia.bankportal.privacy.infrastructure.ConsentHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — ConsentManagementService.
 * FEAT-019 Sprint 21 — RF-019-04.
 * RN-F019-15: SECURITY no es toggleable → HTTP 422.
 * RN-F019-16: cada cambio inserta registro inmutable.
 *
 * @author SOFIA QA Agent — FEAT-019 Sprint 21
 */
@ExtendWith(MockitoExtension.class)
class ConsentManagementServiceTest {

    @Mock  ConsentHistoryRepository consentRepo;
    @InjectMocks ConsentManagementService service;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
    }

    @Test
    @DisplayName("getCurrentConsents — repositorio vacío devuelve defaults")
    void getCurrentConsents_empty_returnsDefaults() {
        when(consentRepo.findCurrentConsents(userId)).thenReturn(List.of());

        List<ConsentResponse> result = service.getCurrentConsents(userId);

        assertThat(result).hasSize(4);
        assertThat(result).anyMatch(c -> c.tipo() == ConsentType.SECURITY && c.activo());
        assertThat(result).anyMatch(c -> c.tipo() == ConsentType.ANALYTICS && !c.activo());
    }

    @Test
    @DisplayName("getCurrentConsents — devuelve estado persistido del repositorio")
    void getCurrentConsents_returnsPersistedState() {
        ConsentHistory mkt = ConsentHistory.builder()
            .userId(userId).tipo(ConsentType.MARKETING)
            .valorAnterior(null).valorNuevo(false)
            .createdAt(LocalDateTime.now()).build();
        when(consentRepo.findCurrentConsents(userId)).thenReturn(List.of(mkt));

        List<ConsentResponse> result = service.getCurrentConsents(userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).tipo()).isEqualTo(ConsentType.MARKETING);
        assertThat(result.get(0).activo()).isFalse();
    }

    @Test
    @DisplayName("RN-F019-15 — SECURITY no puede desactivarse → HTTP 422")
    void updateConsent_security_throws422() {
        var dto = new ConsentUpdateRequest(ConsentType.SECURITY, false);

        assertThatThrownBy(() -> service.updateConsent(userId, dto, "127.0.0.1"))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("CONSENT_NOT_TOGGLEABLE");

        verify(consentRepo, never()).save(any());
    }

    @Test
    @DisplayName("RN-F019-16 — actualizar Marketing inserta registro inmutable con valor anterior")
    void updateConsent_marketing_insertsHistory() {
        ConsentHistory previous = ConsentHistory.builder()
            .userId(userId).tipo(ConsentType.MARKETING)
            .valorNuevo(true).createdAt(LocalDateTime.now()).build();
        when(consentRepo.findLatest(userId, ConsentType.MARKETING))
            .thenReturn(Optional.of(previous));

        var dto = new ConsentUpdateRequest(ConsentType.MARKETING, false);
        var captor = ArgumentCaptor.forClass(ConsentHistory.class);

        ConsentResponse result = service.updateConsent(userId, dto, "192.168.1.1");

        verify(consentRepo).save(captor.capture());
        ConsentHistory saved = captor.getValue();
        assertThat(saved.getTipo()).isEqualTo(ConsentType.MARKETING);
        assertThat(saved.getValorAnterior()).isTrue();   // valor anterior capturado
        assertThat(saved.isValorNuevo()).isFalse();       // nuevo valor
        assertThat(saved.getIpOrigen()).isEqualTo("192.168.1.1");
        assertThat(result.activo()).isFalse();
    }

    @Test
    @DisplayName("RN-F019-16 — primera vez (sin historial previo) valorAnterior es null")
    void updateConsent_firstTime_valorAnteriorIsNull() {
        when(consentRepo.findLatest(userId, ConsentType.ANALYTICS))
            .thenReturn(Optional.empty());

        var dto = new ConsentUpdateRequest(ConsentType.ANALYTICS, true);
        var captor = ArgumentCaptor.forClass(ConsentHistory.class);

        service.updateConsent(userId, dto, "10.0.0.1");

        verify(consentRepo).save(captor.capture());
        assertThat(captor.getValue().getValorAnterior()).isNull();
    }

    @Test
    @DisplayName("COMMUNICATIONS se puede activar y desactivar")
    void updateConsent_communications_toggleable() {
        when(consentRepo.findLatest(userId, ConsentType.COMMUNICATIONS))
            .thenReturn(Optional.empty());

        var dto = new ConsentUpdateRequest(ConsentType.COMMUNICATIONS, false);
        ConsentResponse result = service.updateConsent(userId, dto, "10.0.0.1");

        assertThat(result.tipo()).isEqualTo(ConsentType.COMMUNICATIONS);
        assertThat(result.activo()).isFalse();
    }
}
