package com.experis.sofia.bankportal.loan.application.usecase;

import com.experis.sofia.bankportal.loan.application.dto.LoanSummaryDTO;
import com.experis.sofia.bankportal.loan.domain.model.Loan;
import com.experis.sofia.bankportal.loan.domain.repository.LoanRepositoryPort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ListLoansUseCase {

    private final LoanRepositoryPort loanRepository;

    public ListLoansUseCase(LoanRepositoryPort loanRepository) {
        this.loanRepository = loanRepository;
    }

    public Page<LoanSummaryDTO> execute(UUID userId, Pageable pageable) {
        return loanRepository.findByUserId(userId, pageable)
                .map(this::toDto);
    }

    private LoanSummaryDTO toDto(Loan loan) {
        return new LoanSummaryDTO(
                loan.getId(),
                loan.getTipo(),
                loan.getImporteOriginal(),
                loan.getImportePendiente(),
                loan.getCuotaMensual(),
                loan.getTae(),
                loan.getEstado().name(),
                loan.getFechaFin() != null ? loan.getFechaFin().toString() : null
        );
    }
}
