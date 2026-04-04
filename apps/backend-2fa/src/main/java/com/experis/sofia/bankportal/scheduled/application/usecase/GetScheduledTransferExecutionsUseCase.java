package com.experis.sofia.bankportal.scheduled.application.usecase;

import org.springframework.stereotype.Service;

import com.experis.sofia.bankportal.scheduled.application.dto.ScheduledTransferExecutionResponse;
import com.experis.sofia.bankportal.scheduled.domain.*;

import java.util.List;
import java.util.UUID;

/**
 * Consulta del historial de ejecuciones de una transferencia programada.
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
@Service
public class GetScheduledTransferExecutionsUseCase {

    private final ScheduledTransferRepository          transferRepo;
    private final ScheduledTransferExecutionRepository executionRepo;

    public GetScheduledTransferExecutionsUseCase(ScheduledTransferRepository transferRepo,
                                                  ScheduledTransferExecutionRepository executionRepo) {
        this.transferRepo  = transferRepo;
        this.executionRepo = executionRepo;
    }

    public List<ScheduledTransferExecutionResponse> getExecutions(UUID userId, UUID transferId) {
        // Verificar propiedad antes de exponer historial
        transferRepo.findByIdAndUserId(transferId, userId)
                .orElseThrow(() -> new ScheduledTransferNotFoundException(transferId));

        return executionRepo.findByScheduledTransferId(transferId)
                .stream()
                .map(ScheduledTransferExecutionResponse::from)
                .toList();
    }
}
