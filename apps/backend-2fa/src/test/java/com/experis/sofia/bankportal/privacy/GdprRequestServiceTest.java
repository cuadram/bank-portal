package com.experis.sofia.bankportal.privacy;

import com.experis.sofia.bankportal.privacy.application.GdprRequestService;
import com.experis.sofia.bankportal.privacy.application.dto.GdprRequestResponse;
import com.experis.sofia.bankportal.privacy.domain.GdprRequest;
import com.experis.sofia.bankportal.privacy.domain.GdprRequestStatus;
import com.experis.sofia.bankportal.privacy.domain.GdprRequestType;
import com.experis.sofia.bankportal.privacy.infrastructure.GdprRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — GdprRequestService.
 * FEAT-019 Sprint 21 — RF-019-07.
 * RN-F019-34: SLA 30 días.
 * RN-F019-35: alerta automática SLA < 5 días.
 *
 * @author SOFIA QA Agent — FEAT-019 Sprint 21
 */
@ExtendWith(MockitoExtension.class)
class GdprRequestServiceTest {

    @Mock  GdprRequestRepository gdprRepo;
    @InjectMocks GdprRequestService service;

    private UUID userId;

    @BeforeEach
    void setUp() { userId = UUID.randomUUID(); }

    @Test
    @DisplayName("getRequests — devuelve página mapeada a DTO")
    void getRequests_returnsMappedPage() {
        GdprRequest r = GdprRequest.builder()
            .id(UUID.randomUUID()).userId(userId)
            .tipo(GdprRequestType.EXPORT)
            .estado(GdprRequestStatus.PENDING)
            .createdAt(LocalDateTime.now())
            .slaDeadline(LocalDateTime.now().plusDays(30))
            .build();
        Page<GdprRequest> page = new PageImpl<>(List.of(r));
        when(gdprRepo.findByFilters(any(), any(), any(), any(), any())).thenReturn(page);

        var pageable = PageRequest.of(0, 20);
        Page<GdprRequestResponse> result = service.getRequests(
            null, null, null, null, pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).tipo()).isEqualTo(GdprRequestType.EXPORT);
        assertThat(result.getContent().get(0).estado()).isEqualTo(GdprRequestStatus.PENDING);
    }

    @Test
    @DisplayName("getRequests — página vacía cuando no hay resultados")
    void getRequests_emptyPage() {
        when(gdprRepo.findByFilters(any(), any(), any(), any(), any()))
            .thenReturn(Page.empty());

        var result = service.getRequests(null, null, null, null, PageRequest.of(0, 20));

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    @DisplayName("RN-F019-35 — checkSlaAlerts marca slaAlertSent=true en solicitudes próximas")
    void checkSlaAlerts_setsAlertSent() {
        GdprRequest expiring = GdprRequest.builder()
            .id(UUID.randomUUID()).userId(userId)
            .tipo(GdprRequestType.DELETION)
            .estado(GdprRequestStatus.PENDING)
            .slaDeadline(LocalDateTime.now().plusDays(3))
            .slaAlertSent(false)
            .build();
        when(gdprRepo.findExpiringSoon(any())).thenReturn(List.of(expiring));

        service.checkSlaAlerts();

        verify(gdprRepo).save(argThat(r -> r.isSlaAlertSent()));
    }

    @Test
    @DisplayName("checkSlaAlerts — sin solicitudes próximas no guarda nada")
    void checkSlaAlerts_noExpiring_savesNothing() {
        when(gdprRepo.findExpiringSoon(any())).thenReturn(List.of());

        service.checkSlaAlerts();

        verify(gdprRepo, never()).save(any());
    }

    @Test
    @DisplayName("GdprRequestResponse.from — calcula diasRestantes correctamente")
    void gdprRequestResponse_diasRestantes() {
        GdprRequest r = GdprRequest.builder()
            .id(UUID.randomUUID()).userId(userId)
            .tipo(GdprRequestType.EXPORT)
            .estado(GdprRequestStatus.PENDING)
            .createdAt(LocalDateTime.now())
            .slaDeadline(LocalDateTime.now().plusDays(28))
            .build();

        GdprRequestResponse dto = GdprRequestResponse.from(r);

        assertThat(dto.diasRestantes()).isBetween(27L, 28L);
    }
}
