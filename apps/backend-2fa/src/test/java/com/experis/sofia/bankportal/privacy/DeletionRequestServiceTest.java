package com.experis.sofia.bankportal.privacy;

import com.experis.sofia.bankportal.privacy.application.DeletionRequestService;
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
 * Tests unitarios — DeletionRequestService.
 * FEAT-019 Sprint 21 — RF-019-06.
 * RN-F019-27: cuenta suspendida inmediatamente.
 * ADR-032: soft delete en dos fases.
 *
 * @author SOFIA QA Agent — FEAT-019 Sprint 21
 */
@ExtendWith(MockitoExtension.class)
class DeletionRequestServiceTest {

    @Mock  GdprRequestRepository gdprRepo;
    @InjectMocks DeletionRequestService service;

    private UUID userId;

    @BeforeEach
    void setUp() { userId = UUID.randomUUID(); }

    @Test
    @DisplayName("initiateDeletion — crea solicitud PENDING")
    void initiateDeletion_createsPendingRequest() {
        when(gdprRepo.findActiveByUserIdAndTipo(userId, GdprRequestType.DELETION))
            .thenReturn(Optional.empty());
        GdprRequest saved = GdprRequest.builder()
            .id(UUID.randomUUID()).userId(userId)
            .tipo(GdprRequestType.DELETION)
            .estado(GdprRequestStatus.PENDING)
            .build();
        when(gdprRepo.save(any())).thenReturn(saved);

        GdprRequest result = service.initiateDeletion(userId);

        assertThat(result.getUserId()).isEqualTo(userId);
        var captor = ArgumentCaptor.forClass(GdprRequest.class);
        verify(gdprRepo).save(captor.capture());
        assertThat(captor.getValue().getTipo()).isEqualTo(GdprRequestType.DELETION);
        assertThat(captor.getValue().getEstado()).isEqualTo(GdprRequestStatus.PENDING);
    }

    @Test
    @DisplayName("initiateDeletion — ya existe solicitud activa → HTTP 409")
    void initiateDeletion_activeExists_throws409() {
        GdprRequest active = GdprRequest.builder()
            .userId(userId).tipo(GdprRequestType.DELETION)
            .estado(GdprRequestStatus.PENDING).build();
        when(gdprRepo.findActiveByUserIdAndTipo(userId, GdprRequestType.DELETION))
            .thenReturn(Optional.of(active));

        assertThatThrownBy(() -> service.initiateDeletion(userId))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("DELETION_ALREADY_REQUESTED");

        verify(gdprRepo, never()).save(any());
    }

    @Test
    @DisplayName("confirmDeletion — PENDING → IN_PROGRESS")
    void confirmDeletion_pendingToInProgress() {
        UUID requestId = UUID.randomUUID();
        GdprRequest pending = GdprRequest.builder()
            .id(requestId).userId(userId)
            .tipo(GdprRequestType.DELETION)
            .estado(GdprRequestStatus.PENDING)
            .build();
        when(gdprRepo.findById(requestId)).thenReturn(Optional.of(pending));

        service.confirmDeletion(requestId);

        var captor = ArgumentCaptor.forClass(GdprRequest.class);
        verify(gdprRepo).save(captor.capture());
        assertThat(captor.getValue().getEstado()).isEqualTo(GdprRequestStatus.IN_PROGRESS);
    }

    @Test
    @DisplayName("confirmDeletion — token ya usado (no PENDING) → HTTP 410 Gone")
    void confirmDeletion_alreadyProcessed_throws410() {
        UUID requestId = UUID.randomUUID();
        GdprRequest processed = GdprRequest.builder()
            .id(requestId).userId(userId)
            .tipo(GdprRequestType.DELETION)
            .estado(GdprRequestStatus.COMPLETED)
            .build();
        when(gdprRepo.findById(requestId)).thenReturn(Optional.of(processed));

        assertThatThrownBy(() -> service.confirmDeletion(requestId))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("TOKEN_ALREADY_USED");
    }

    @Test
    @DisplayName("confirmDeletion — requestId inexistente → HTTP 404")
    void confirmDeletion_notFound_throws404() {
        UUID requestId = UUID.randomUUID();
        when(gdprRepo.findById(requestId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.confirmDeletion(requestId))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("404");
    }
}
