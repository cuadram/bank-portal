package com.experis.sofia.bankportal.directdebit.repository;

import com.experis.sofia.bankportal.directdebit.domain.DebitMandate;
import com.experis.sofia.bankportal.directdebit.domain.MandateStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

/** FEAT-017 Sprint 19 */
@Repository
public interface DebitMandateRepository extends JpaRepository<DebitMandate, UUID> {

    Page<DebitMandate> findByUserId(UUID userId, Pageable pageable);

    Page<DebitMandate> findByUserIdAndStatus(UUID userId, MandateStatus status, Pageable pageable);

    Optional<DebitMandate> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByUserIdAndCreditorIbanAndStatus(UUID userId, String creditorIban, MandateStatus status);

    @Query("SELECT COUNT(m) > 0 FROM DebitMandate m WHERE m.userId = :userId AND m.creditorIban = :iban AND m.status = 'ACTIVE'")
    boolean hasDuplicateActive(UUID userId, String iban);
}
