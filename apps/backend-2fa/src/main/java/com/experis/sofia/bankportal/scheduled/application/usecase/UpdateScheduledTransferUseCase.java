package com.experis.sofia.bankportal.scheduled.application.usecase;

import org.springframework.stereotype.Service;

import com.experis.sofia.bankportal.scheduled.application.dto.ScheduledTransferResponse;
import com.experis.sofia.bankportal.scheduled.domain.*;

import java.util.UUID;

/**
 * US-1503 (pause/resume/cancel): Gestión de ciclo de vida.
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
@Service
public class UpdateScheduledTransferUseCase {

    private final ScheduledTransferRepository repository;

    public UpdateScheduledTransferUseCase(ScheduledTransferRepository repository) {
        this.repository = repository;
    }

    public ScheduledTransferResponse pause(UUID userId, UUID transferId) {
        ScheduledTransfer t = findOwned(userId, transferId);
        t.pause();
        return ScheduledTransferResponse.from(repository.save(t));
    }

    public ScheduledTransferResponse resume(UUID userId, UUID transferId) {
        ScheduledTransfer t = findOwned(userId, transferId);
        t.resume();
        return ScheduledTransferResponse.from(repository.save(t));
    }

    public ScheduledTransferResponse cancel(UUID userId, UUID transferId) {
        ScheduledTransfer t = findOwned(userId, transferId);
        t.cancel();
        return ScheduledTransferResponse.from(repository.save(t));
    }

    private ScheduledTransfer findOwned(UUID userId, UUID transferId) {
        return repository.findByIdAndUserId(transferId, userId)
                .orElseThrow(() -> new ScheduledTransferNotFoundException(transferId));
    }
}
