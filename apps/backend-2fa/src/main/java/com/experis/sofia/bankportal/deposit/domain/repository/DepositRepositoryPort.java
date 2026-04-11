package com.experis.sofia.bankportal.deposit.domain.repository;

import com.experis.sofia.bankportal.deposit.domain.model.Deposit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

public interface DepositRepositoryPort {
    Page<Deposit> findByUserId(UUID userId, Pageable pageable);
    Optional<Deposit> findById(UUID id);
    Deposit save(Deposit deposit);
    Deposit update(Deposit deposit);
}
