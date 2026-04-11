package com.experis.sofia.bankportal.scheduled.application.usecase;

import org.springframework.stereotype.Service;

import com.experis.sofia.bankportal.scheduled.domain.*;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

/**
 * US-1504: Lógica de ejecución de una transferencia programada.
 * Invocado por ScheduledTransferJobService y por el reintento diferido.
 *
 * Garantías:
 *   - Idempotente: si ya existe una ejecución para (transferId, today) → omite.
 *   - Flujo SUCCESS → incrementa contador, calcula nextDate, notifica.
 *   - Flujo INSUFFICIENT_FUNDS → guarda FAILED_RETRYING, programa reintento 2h.
 *   - Flujo ERROR_GENERAL → guarda FAILED, marca transferencia FAILED si era ONCE.
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
@Service
public class ExecuteScheduledTransferUseCase {

    private final ScheduledTransferRepository          transferRepo;
    private final ScheduledTransferExecutionRepository executionRepo;
    private final NextExecutionDateCalculator          calculator;
    private final CoreTransferPort                     coreTransferPort;
    private final RetrySchedulerPort                   retrySchedulerPort;
    private final ScheduledTransferNotificationPort    notificationPort;

    public ExecuteScheduledTransferUseCase(
            ScheduledTransferRepository transferRepo,
            ScheduledTransferExecutionRepository executionRepo,
            NextExecutionDateCalculator calculator,
            CoreTransferPort coreTransferPort,
            RetrySchedulerPort retrySchedulerPort,
            ScheduledTransferNotificationPort notificationPort) {
        this.transferRepo      = transferRepo;
        this.executionRepo     = executionRepo;
        this.calculator        = calculator;
        this.coreTransferPort  = coreTransferPort;
        this.retrySchedulerPort = retrySchedulerPort;
        this.notificationPort  = notificationPort;
    }

    /**
     * @param transferId  ID del ScheduledTransfer a ejecutar
     * @param today       Fecha de ejecución (inyectada para testabilidad)
     * @param isRetry     true si es un reintento programado
     */
    public void execute(UUID transferId, LocalDate today, boolean isRetry) {

        ScheduledTransfer transfer = transferRepo.findById(transferId)
                .orElseThrow(() -> new ScheduledTransferNotFoundException(transferId));

        // ── Idempotencia: verificar ejecución previa del día ───────────────────
        Optional<ScheduledTransferExecution> existing =
                executionRepo.findByTransferIdAndScheduledDate(transferId, today);
        if (existing.isPresent() && existing.get().getStatus() == ExecutionStatus.SUCCESS) {
            return; // ya ejecutada con éxito hoy — no duplicar
        }

        // ── Skip si pausada ───────────────────────────────────────────────────
        if (transfer.getStatus() == ScheduledTransferStatus.PAUSED) {
            executionRepo.save(new ScheduledTransferExecution(
                    transferId, null, today,
                    ExecutionStatus.SKIPPED, transfer.getAmount(),
                    "Transferencia pausada", false));
            return;
        }

        // ── Ejecutar en core bancario ─────────────────────────────────────────
        CoreTransferResult result = coreTransferPort.execute(
                transfer.getSourceAccountId(),
                transfer.getDestinationIban(),
                transfer.getAmount(),
                transfer.getConcept() + " [auto " + today + "]"
        );

        if (result.success()) {
            LocalDate nextDate = calculator.calculate(transfer, today);
            transfer.incrementExecutions(nextDate);
            transferRepo.save(transfer);

            executionRepo.save(new ScheduledTransferExecution(
                    transferId, result.transferId(), today,
                    ExecutionStatus.SUCCESS, transfer.getAmount(), null, isRetry));

            notificationPort.notifySuccess(transfer, today);

        } else if (result.isInsufficientFunds() && !isRetry) {
            // Primer intento fallido — programar reintento en 2h
            executionRepo.save(new ScheduledTransferExecution(
                    transferId, null, today,
                    ExecutionStatus.FAILED_RETRYING, transfer.getAmount(),
                    "Saldo insuficiente — reintento en 2h", false));

            retrySchedulerPort.scheduleRetry(transferId, today, 2);
            notificationPort.notifyFailure(transfer, today, "Saldo insuficiente — se reintentará en 2 horas");

        } else {
            // Reintento fallido o error general → FAILED definitivo
            executionRepo.save(new ScheduledTransferExecution(
                    transferId, null, today,
                    ExecutionStatus.SKIPPED, transfer.getAmount(),
                    result.failureReason(), true));

            if (transfer.getType() == ScheduledTransferType.ONCE) {
                transfer.markFailed();
                transferRepo.save(transfer);
            }
            notificationPort.notifyFailure(transfer, today, result.failureReason() + " (definitivo)");
        }
    }
}
