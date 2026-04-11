package com.experis.sofia.bankportal.deposit.domain.repository;

import com.experis.sofia.bankportal.deposit.domain.model.DepositApplication;

import java.util.Optional;
import java.util.UUID;

public interface DepositApplicationRepositoryPort {
    DepositApplication save(DepositApplication application);
    Optional<DepositApplication> findByIdAndUserId(UUID id, UUID userId);
}
