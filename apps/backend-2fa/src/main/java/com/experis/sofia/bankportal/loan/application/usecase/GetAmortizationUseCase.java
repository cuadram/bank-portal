package com.experis.sofia.bankportal.loan.application.usecase;

import com.experis.sofia.bankportal.loan.domain.exception.LoanAccessDeniedException;
import com.experis.sofia.bankportal.loan.domain.model.AmortizationRow;
import com.experis.sofia.bankportal.loan.domain.model.Loan;
import com.experis.sofia.bankportal.loan.domain.repository.LoanRepositoryPort;
import com.experis.sofia.bankportal.loan.domain.service.AmortizationCalculator;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class GetAmortizationUseCase {

    private final LoanRepositoryPort loanRepository;
    private final AmortizationCalculator calculator;

    public GetAmortizationUseCase(LoanRepositoryPort loanRepository, AmortizationCalculator calculator) {
        this.loanRepository = loanRepository;
        this.calculator = calculator;
    }

    /** RN-F020-17: cuadro calculado dinámicamente, no persistido */
    public List<AmortizationRow> execute(UUID loanId, UUID userId) {
        Loan loan = loanRepository.findByIdAndUserId(loanId, userId)
                .orElseThrow(() -> new LoanAccessDeniedException(loanId.toString()));
        return calculator.generarCuadro(loan.getImporteOriginal(), loan.getPlazo(), loan.getTae());
    }
}
