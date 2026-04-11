package com.experis.sofia.bankportal.privacy;

import com.experis.sofia.bankportal.privacy.application.DataExportService;
import com.experis.sofia.bankportal.privacy.application.dto.DataExportResponse;
import com.experis.sofia.bankportal.privacy.domain.GdprRequest;
import com.experis.sofia.bankportal.privacy.domain.GdprRequestStatus;
import com.experis.sofia.bankportal.privacy.domain.GdprRequestType;
import com.experis.sofia.bankportal.privacy.infrastructure.GdprRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — DataExportService.
 * FEAT-019 Sprint 21 — RF-019-05.
 * RN-F019-19: solo un export activo por usuario → HTTP 409.
 * RN-F019-20: responde 202 inmediatamente (async).
 *
 * @author SOFIA QA Agent — FEAT-019 Sprint 21
 */
@ExtendWith(MockitoExtension.class)
class DataExportServiceTest {

    @Mock  GdprRequestRepository gdprRepo;
    @InjectMocks DataExportService service;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
    }

    @Test
    @DisplayName("requestExport — crea solicitud PENDING y responde inmediatamente")
    void requestExport_createsRequest_returnsPending() {
        when(gdprRepo.findActiveByUserIdAndTipo(userId, GdprRequestType.EXPORT))
            .thenReturn(Optional.empty());

        GdprRequest saved = GdprRequest.builder()
            .id(UUID.randomUUID()).userId(userId)
            .tipo(GdprRequestType.EXPORT)
            .estado(GdprRequestStatus.PENDING)
            .build();
        when(gdprRepo.save(any())).thenReturn(saved);

        DataExportResponse response = service.requestExport(userId);

        assertThat(response.estado()).isEqualTo(GdprRequestStatus.PENDING);
        var captor = ArgumentCaptor.forClass(GdprRequest.class);
        verify(gdprRepo).save(captor.capture());
        assertThat(captor.getValue().getTipo()).isEqualTo(GdprRequestType.EXPORT);
        assertThat(captor.getValue().getUserId()).isEqualTo(userId);
    }

    @Test
    @DisplayName("RN-F019-19 — export activo existente → HTTP 409 Conflict")
    void requestExport_activeExists_throws409() {
        GdprRequest active = GdprRequest.builder()
            .userId(userId).tipo(GdprRequestType.EXPORT)
            .estado(GdprRequestStatus.IN_PROGRESS).build();
        when(gdprRepo.findActiveByUserIdAndTipo(userId, GdprRequestType.EXPORT))
            .thenReturn(Optional.of(active));

        assertThatThrownBy(() -> service.requestExport(userId))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("EXPORT_ALREADY_ACTIVE");

        verify(gdprRepo, never()).save(any());
    }

    @Test
    @DisplayName("getExportStatus — sin solicitud activa → HTTP 404")
    void getExportStatus_noActive_throws404() {
        when(gdprRepo.findActiveByUserIdAndTipo(userId, GdprRequestType.EXPORT))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getExportStatus(userId))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("404");
    }

    @Test
    @DisplayName("getExportStatus — solicitud activa devuelve estado correcto")
    void getExportStatus_active_returnsStatus() {
        GdprRequest active = GdprRequest.builder()
            .id(UUID.randomUUID()).userId(userId)
            .tipo(GdprRequestType.EXPORT)
            .estado(GdprRequestStatus.IN_PROGRESS)
            .build();
        when(gdprRepo.findActiveByUserIdAndTipo(userId, GdprRequestType.EXPORT))
            .thenReturn(Optional.of(active));

        DataExportResponse response = service.getExportStatus(userId);

        assertThat(response.estado()).isEqualTo(GdprRequestStatus.IN_PROGRESS);
    }
}
