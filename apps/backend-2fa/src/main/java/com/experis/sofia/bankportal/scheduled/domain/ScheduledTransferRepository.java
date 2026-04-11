package com.experis.sofia.bankportal.scheduled.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Puerto de salida — persistencia de ScheduledTransfer.
 * DEBT-030 Sprint 18: findDueTransfers ahora retorna Page para paginación en batches.
 *
 * @author SOFIA Developer Agent — FEAT-016 Sprint 18
 */
public interface ScheduledTransferRepository {

    ScheduledTransfer save(ScheduledTransfer transfer);

    Optional<ScheduledTransfer> findById(UUID id);

    Optional<ScheduledTransfer> findByIdAndUserId(UUID id, UUID userId);

    List<ScheduledTransfer> findByUserId(UUID userId);

    List<ScheduledTransfer> findByUserIdAndStatus(UUID userId, ScheduledTransferStatus status);

    /**
     * Para el scheduler: PENDING/ACTIVE con nextExecutionDate <= today.
     * DEBT-030: paginado en batches de 500 para evitar OOM con > 10k registros.
     */
    Page<ScheduledTransfer> findDueTransfers(LocalDate today, Pageable pageable);
}
