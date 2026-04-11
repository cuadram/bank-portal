package com.experis.sofia.bankportal.scheduled.application.usecase;

import org.springframework.stereotype.Service;

import com.experis.sofia.bankportal.scheduled.application.dto.ScheduledTransferResponse;
import com.experis.sofia.bankportal.scheduled.domain.*;

import java.util.List;
import java.util.UUID;

/**
 * Consultas de transferencias programadas por usuario.
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
@Service
public class GetScheduledTransfersUseCase {

    private final ScheduledTransferRepository repository;

    public GetScheduledTransfersUseCase(ScheduledTransferRepository repository) {
        this.repository = repository;
    }

    public List<ScheduledTransferResponse> getAll(UUID userId) {
        return repository.findByUserId(userId)
                .stream()
                .map(ScheduledTransferResponse::from)
                .toList();
    }

    public List<ScheduledTransferResponse> getByStatus(UUID userId, ScheduledTransferStatus status) {
        return repository.findByUserIdAndStatus(userId, status)
                .stream()
                .map(ScheduledTransferResponse::from)
                .toList();
    }

    public ScheduledTransferResponse getById(UUID userId, UUID transferId) {
        return repository.findByIdAndUserId(transferId, userId)
                .map(ScheduledTransferResponse::from)
                .orElseThrow(() -> new ScheduledTransferNotFoundException(transferId));
    }
}
