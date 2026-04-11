package com.experis.sofia.bankportal.scheduled.domain;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Puerto de salida — persistencia de ejecuciones.
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
public interface ScheduledTransferExecutionRepository {

    ScheduledTransferExecution save(ScheduledTransferExecution execution);

    /** Idempotencia: ¿ya se ejecutó esta transferencia hoy? */
    Optional<ScheduledTransferExecution> findByTransferIdAndScheduledDate(
            UUID scheduledTransferId, LocalDate scheduledDate);

    List<ScheduledTransferExecution> findByScheduledTransferId(UUID scheduledTransferId);
}
