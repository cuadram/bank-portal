package com.experis.sofia.bankportal.directdebit.service;

import com.experis.sofia.bankportal.directdebit.domain.*;
import com.experis.sofia.bankportal.directdebit.dto.response.*;
import com.experis.sofia.bankportal.directdebit.exception.MandateNotFoundException;
import com.experis.sofia.bankportal.directdebit.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

/**
 * US-1702: Query service for mandates and debit records.
 * FEAT-017 Sprint 19
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DirectDebitQueryService {

    private final DebitMandateRepository mandateRepo;
    private final DirectDebitRepository debitRepo;

    public Page<MandateResponse> getMandates(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return mandateRepo.findByUserId(userId, pageable)
            .map(this::toMandateResponse);
    }

    public MandateResponse getMandate(UUID id, UUID userId) {
        return mandateRepo.findByIdAndUserId(id, userId)
            .map(this::toMandateResponse)
            .orElseThrow(() -> new MandateNotFoundException("Mandate not found: " + id));
    }

    public Page<DirectDebitResponse> getDebits(UUID userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), Sort.by("dueDate").descending());
        return debitRepo.findAllByUserId(userId, pageable)
            .map(this::toDebitResponse);
    }

    private MandateResponse toMandateResponse(DebitMandate m) {
        return MandateResponse.builder()
            .id(m.getId()).accountId(m.getAccountId())
            .creditorName(m.getCreditorName()).creditorIban(m.getCreditorIban())
            .mandateRef(m.getMandateRef()).mandateType(m.getMandateType())
            .status(m.getStatus()).signedAt(m.getSignedAt())
            .cancelledAt(m.getCancelledAt()).createdAt(m.getCreatedAt())
            .build();
    }

    private DirectDebitResponse toDebitResponse(DirectDebit d) {
        return DirectDebitResponse.builder()
            .id(d.getId()).mandateId(d.getMandateId())
            .amount(d.getAmount()).currency(d.getCurrency())
            .status(d.getStatus()).dueDate(d.getDueDate())
            .chargedAt(d.getChargedAt()).returnReason(d.getReturnReason())
            .build();
    }
}
