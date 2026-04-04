package com.experis.sofia.bankportal.loan.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface LoanApplicationJpaRepository extends JpaRepository<LoanApplicationEntity, UUID> {
    Optional<LoanApplicationEntity> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT a FROM LoanApplicationEntity a WHERE a.userId = :userId AND a.estado = 'PENDING'")
    Optional<LoanApplicationEntity> findPendingByUserId(UUID userId);
}
