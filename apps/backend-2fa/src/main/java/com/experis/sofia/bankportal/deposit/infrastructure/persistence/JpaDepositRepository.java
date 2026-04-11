package com.experis.sofia.bankportal.deposit.infrastructure.persistence;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface JpaDepositRepository extends JpaRepository<DepositEntity, UUID> {
    Page<DepositEntity> findByUserId(UUID userId, Pageable pageable);
}
