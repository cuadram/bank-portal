package com.experis.sofia.bankportal.directdebit.service;

import com.experis.sofia.bankportal.directdebit.domain.*;
import com.experis.sofia.bankportal.directdebit.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * US-1705: Handle debit lifecycle events (CHARGED/RETURNED/REJECTED).
 * Called by SimulaCobroJob scheduler.
 * FEAT-017 Sprint 19
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DebitEventHandler {

    private final DirectDebitRepository debitRepo;
    private final DebitMandateRepository mandateRepo;

    @Transactional
    public void processCharged(DirectDebit debit) {
        debit.markCharged();
        debitRepo.save(debit);
        log.info("[DEBIT_CHARGED] debitId={} mandateId={} amount={}{}",
            debit.getId(), debit.getMandateId(), debit.getAmount(), debit.getCurrency());
    }

    @Transactional
    public void processReturned(DirectDebit debit, String returnReason) {
        debit.markReturned(returnReason);
        debitRepo.save(debit);
        log.info("[DEBIT_RETURNED] debitId={} reason={}", debit.getId(), returnReason);
    }

    @Transactional
    public void processRejected(DirectDebit debit) {
        debit.markRejected();
        debitRepo.save(debit);
        log.warn("[DEBIT_REJECTED] debitId={} mandateId={}", debit.getId(), debit.getMandateId());
    }
}
