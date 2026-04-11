package com.experis.sofia.bankportal.scheduled.application.usecase;

import org.springframework.stereotype.Service;

import com.experis.sofia.bankportal.scheduled.application.dto.CreateScheduledTransferRequest;
import com.experis.sofia.bankportal.scheduled.application.dto.ScheduledTransferResponse;
import com.experis.sofia.bankportal.scheduled.domain.*;

import java.util.UUID;

/**
 * US-1501 / US-1502: Crear transferencia programada o recurrente.
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17 (NC-017-03 fix)
 */
@Service
public class CreateScheduledTransferUseCase {

    private final ScheduledTransferRepository repository;
    private final NextExecutionDateCalculator calculator;
    private final AccountOwnershipPort        accountOwnershipPort;

    public CreateScheduledTransferUseCase(ScheduledTransferRepository repository,
                                          NextExecutionDateCalculator calculator,
                                          AccountOwnershipPort accountOwnershipPort) {
        this.repository           = repository;
        this.calculator           = calculator;
        this.accountOwnershipPort = accountOwnershipPort;
    }

    public ScheduledTransferResponse execute(UUID userId, CreateScheduledTransferRequest req) {
        if (!accountOwnershipPort.belongsToUser(req.sourceAccountId(), userId))
            throw new AccountNotOwnedByUserException(req.sourceAccountId(), userId);

        ScheduledTransfer transfer = new ScheduledTransfer(
                userId, req.sourceAccountId(),
                req.destinationIban(), req.destinationAccountName(),
                req.amount(), req.currency(), req.concept(),
                req.type(), req.scheduledDate(), req.endDate(), req.maxExecutions()
        );

        return ScheduledTransferResponse.from(repository.save(transfer));
    }
}
