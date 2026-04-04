package com.experis.sofia.bankportal.loan.domain.repository;

import com.experis.sofia.bankportal.loan.domain.model.Loan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

public interface LoanRepositoryPort {
    Page<Loan> findByUserId(UUID userId, Pageable pageable);
    Optional<Loan> findByIdAndUserId(UUID id, UUID userId);
    Loan save(Loan loan);
}
