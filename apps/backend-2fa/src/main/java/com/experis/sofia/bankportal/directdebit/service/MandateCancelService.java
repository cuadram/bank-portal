package com.experis.sofia.bankportal.directdebit.service;

import com.experis.sofia.bankportal.directdebit.config.HolidayCalendarService;
import com.experis.sofia.bankportal.directdebit.exception.*;
import com.experis.sofia.bankportal.directdebit.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.UUID;

/**
 * US-1704: Cancel SEPA DD mandate with PSD2 D-2 rule enforcement.
 * FEAT-017 Sprint 19
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MandateCancelService {

    private final DebitMandateRepository mandateRepo;
    private final DirectDebitRepository debitRepo;
    private final HolidayCalendarService calendar;

    @Transactional
    public void cancelMandate(UUID mandateId, UUID userId) {
        // 1. Find mandate and verify ownership
        var mandate = mandateRepo.findByIdAndUserId(mandateId, userId)
            .orElseThrow(() -> new MandateNotFoundException("Mandate not found or access denied"));

        // 2. Check active status
        if (!mandate.isActive()) {
            throw new IllegalStateException("Mandate is not ACTIVE: " + mandate.getStatus());
        }

        // 3. PSD2 D-2 rule: block if pending debit within 2 business days
        LocalDate cutoffDate = calendar.getBusinessDayCutoff(LocalDate.now(), 2);
        if (debitRepo.hasPendingDebitBeforeCutoff(mandateId, cutoffDate)) {
            // Find the blocking debit due date to return in exception
            debitRepo.findByMandateId(mandateId,
                org.springframework.data.domain.PageRequest.of(0, 1))
                .stream().findFirst()
                .ifPresent(d -> {
                    throw new MandateCancellationBlockedPsd2Exception(d.getDueDate());
                });
        }

        // 4. Cancel mandate
        mandate.cancel();
        mandateRepo.save(mandate);

        log.info("[MANDATE_CANCELLED] userId={} mandateId={} creditor={}",
            userId, mandateId, mandate.getCreditorName());
    }
}
