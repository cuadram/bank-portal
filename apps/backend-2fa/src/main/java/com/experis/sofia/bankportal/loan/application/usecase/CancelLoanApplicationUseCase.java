package com.experis.sofia.bankportal.loan.application.usecase;

import com.experis.sofia.bankportal.loan.domain.exception.LoanAccessDeniedException;
import com.experis.sofia.bankportal.loan.domain.exception.LoanApplicationNotCancellableException;
import com.experis.sofia.bankportal.loan.domain.model.LoanApplication;
import com.experis.sofia.bankportal.loan.domain.model.LoanStatus;
import com.experis.sofia.bankportal.loan.domain.repository.LoanApplicationRepositoryPort;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class CancelLoanApplicationUseCase {

    private final LoanApplicationRepositoryPort applicationRepository;

    public CancelLoanApplicationUseCase(LoanApplicationRepositoryPort applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    /** RN-F020-15: solo PENDING puede cancelarse. RN-F020-16: propietario. */
    public void execute(UUID applicationId, UUID userId) {
        LoanApplication app = applicationRepository.findByIdAndUserId(applicationId, userId)
                .orElseThrow(() -> new LoanAccessDeniedException(applicationId.toString()));

        if (app.getEstado() != LoanStatus.PENDING) {
            throw new LoanApplicationNotCancellableException(
                    applicationId.toString(), app.getEstado().name());
        }
        app.setEstado(LoanStatus.CANCELLED);
        applicationRepository.save(app);
    }
}
