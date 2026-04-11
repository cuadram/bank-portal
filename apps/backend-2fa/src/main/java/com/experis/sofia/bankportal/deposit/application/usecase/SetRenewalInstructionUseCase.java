package com.experis.sofia.bankportal.deposit.application.usecase;

import com.experis.sofia.bankportal.deposit.application.dto.DepositResponse;
import com.experis.sofia.bankportal.deposit.domain.exception.DepositAccessDeniedException;
import com.experis.sofia.bankportal.deposit.domain.exception.DepositNotFoundException;
import com.experis.sofia.bankportal.deposit.domain.exception.DepositNotCancellableException;
import com.experis.sofia.bankportal.deposit.domain.model.Deposit;
import com.experis.sofia.bankportal.deposit.domain.model.DepositStatus;
import com.experis.sofia.bankportal.deposit.domain.model.RenewalInstruction;
import com.experis.sofia.bankportal.deposit.domain.repository.DepositRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SetRenewalInstructionUseCase {

    private final DepositRepositoryPort depositRepo;

    public DepositResponse execute(UUID depositId, UUID userId, RenewalInstruction instruction) {
        Deposit d = depositRepo.findById(depositId)
            .orElseThrow(() -> new DepositNotFoundException(depositId.toString()));
        if (!d.getUserId().equals(userId)) throw new DepositAccessDeniedException();
        if (d.getEstado() != DepositStatus.ACTIVE)
            throw new DepositNotCancellableException("Solo depósitos ACTIVE pueden modificar instrucción");

        d.setRenovacion(instruction);
        Deposit updated = depositRepo.update(d);

        return new DepositResponse(
            updated.getId(), updated.getEstado(), updated.getImporte(), updated.getPlazoMeses(),
            updated.getTin(), updated.getTae(), updated.getRenovacion(),
            updated.getFechaApertura(), updated.getFechaVencimiento()
        );
    }
}
