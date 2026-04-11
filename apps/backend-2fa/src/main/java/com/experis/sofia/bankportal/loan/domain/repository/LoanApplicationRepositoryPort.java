package com.experis.sofia.bankportal.loan.domain.repository;

import com.experis.sofia.bankportal.loan.domain.model.LoanApplication;

import java.util.Optional;
import java.util.UUID;

public interface LoanApplicationRepositoryPort {
    Optional<LoanApplication> findByIdAndUserId(UUID id, UUID userId);
    Optional<LoanApplication> findPendingByUserId(UUID userId);
    LoanApplication save(LoanApplication application);
}
