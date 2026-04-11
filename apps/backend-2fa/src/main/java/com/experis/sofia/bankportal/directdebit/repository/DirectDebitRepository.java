package com.experis.sofia.bankportal.directdebit.repository;

import com.experis.sofia.bankportal.directdebit.domain.DirectDebit;
import com.experis.sofia.bankportal.directdebit.domain.DebitStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** FEAT-017 Sprint 19 */
@Repository
public interface DirectDebitRepository extends JpaRepository<DirectDebit, UUID> {

    Page<DirectDebit> findByMandateId(UUID mandateId, Pageable pageable);

    List<DirectDebit> findByStatusAndDueDateLessThanEqual(DebitStatus status, LocalDate date);

    /** PSD2 D-2 rule: check pending debits within cutoff date */
    @Query("SELECT COUNT(d) > 0 FROM DirectDebit d " +
           "WHERE d.mandateId = :mandateId AND d.status = 'PENDING' AND d.dueDate <= :cutoffDate")
    boolean hasPendingDebitBeforeCutoff(UUID mandateId, LocalDate cutoffDate);

    @Query("SELECT d FROM DirectDebit d WHERE d.mandateId IN " +
           "(SELECT m.id FROM DebitMandate m WHERE m.userId = :userId) " +
           "ORDER BY d.dueDate DESC")
    Page<DirectDebit> findAllByUserId(UUID userId, Pageable pageable);
}
