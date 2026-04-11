package com.experis.sofia.bankportal.loan.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface LoanJpaRepository extends JpaRepository<LoanEntity, UUID> {
    Page<LoanEntity> findByUserId(UUID userId, Pageable pageable);
    Optional<LoanEntity> findByIdAndUserId(UUID id, UUID userId);
}
