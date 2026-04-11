package com.experis.sofia.bankportal.loan.application.usecase;

import com.experis.sofia.bankportal.loan.application.dto.LoanDetailDTO;
import com.experis.sofia.bankportal.loan.domain.exception.LoanAccessDeniedException;
import com.experis.sofia.bankportal.loan.domain.model.AmortizationRow;
import com.experis.sofia.bankportal.loan.domain.model.Loan;
import com.experis.sofia.bankportal.loan.domain.repository.LoanRepositoryPort;
import com.experis.sofia.bankportal.loan.domain.service.AmortizationCalculator;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class GetLoanDetailUseCase {

    private final LoanRepositoryPort loanRepository;
    private final AmortizationCalculator calculator;

    public GetLoanDetailUseCase(LoanRepositoryPort loanRepository, AmortizationCalculator calculator) {
        this.loanRepository = loanRepository;
        this.calculator = calculator;
    }

    public LoanDetailDTO execute(UUID id, UUID userId) {
        Loan loan = loanRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new LoanAccessDeniedException(id.toString()));
        return toDto(loan);
    }

    private LoanDetailDTO toDto(Loan loan) {
        List<AmortizationRow> schedule = calculator.generarCuadro(
                loan.getImporteOriginal(), loan.getPlazo(), loan.getTae());
        BigDecimal costeTotal = calculator.calcularCosteTotal(loan.getCuotaMensual(), loan.getPlazo());
        BigDecimal intereses = costeTotal.subtract(loan.getImporteOriginal());
        return new LoanDetailDTO(
                loan.getId(), loan.getTipo(),
                loan.getImporteOriginal(), loan.getImportePendiente(),
                loan.getCuotaMensual(), loan.getTae(), loan.getEstado().name(),
                loan.getPlazo(), costeTotal, intereses,
                loan.getFechaInicio() != null ? loan.getFechaInicio().toString() : null,
                loan.getFechaFin() != null ? loan.getFechaFin().toString() : null,
                schedule
        );
    }
}
