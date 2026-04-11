package com.experis.sofia.bankportal.directdebit.service;

import com.experis.sofia.bankportal.directdebit.domain.*;
import com.experis.sofia.bankportal.directdebit.dto.request.CreateMandateRequest;
import com.experis.sofia.bankportal.directdebit.dto.response.MandateResponse;
import com.experis.sofia.bankportal.directdebit.exception.MandateDuplicateException;
import com.experis.sofia.bankportal.directdebit.repository.DebitMandateRepository;
import com.experis.sofia.bankportal.directdebit.validator.IbanValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.UUID;

/**
 * US-1703: Create SEPA DD mandate with OTP and IBAN validation.
 * FEAT-017 Sprint 19
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MandateCreateService {

    private final IbanValidator ibanValidator;
    private final DebitMandateRepository mandateRepo;

    @Transactional
    public MandateResponse createMandate(CreateMandateRequest req, UUID userId) {
        // 1. Validate IBAN (throws InvalidIbanException on failure)
        ibanValidator.validate(req.getCreditorIban());

        // 2. Check duplicate active mandate
        if (mandateRepo.hasDuplicateActive(userId, req.getCreditorIban().toUpperCase())) {
            throw new MandateDuplicateException(
                "Active mandate already exists for creditor IBAN: " + req.getCreditorIban());
        }

        // 3. Generate unique mandate reference (UMR)
        String mandateRef = generateMandateRef(userId);

        // 4. Persist mandate
        DebitMandate mandate = DebitMandate.builder()
            .userId(userId)
            .accountId(req.getAccountId())
            .creditorName(req.getCreditorName().trim())
            .creditorIban(req.getCreditorIban().toUpperCase().replaceAll("\\s", ""))
            .mandateRef(mandateRef)
            .mandateType(MandateType.CORE)
            .status(MandateStatus.ACTIVE)
            .build();

        mandate = mandateRepo.save(mandate);

        log.info("[MANDATE_CREATED] userId={} mandateRef={} creditor={}",
            userId, mandateRef, req.getCreditorName());

        return MandateResponse.builder()
            .id(mandate.getId()).accountId(mandate.getAccountId())
            .creditorName(mandate.getCreditorName()).creditorIban(mandate.getCreditorIban())
            .mandateRef(mandate.getMandateRef()).mandateType(mandate.getMandateType())
            .status(mandate.getStatus()).signedAt(mandate.getSignedAt())
            .createdAt(mandate.getCreatedAt())
            .build();
    }

    /** UMR format: BNK-{userId first 6 chars}-{unix timestamp} */
    private String generateMandateRef(UUID userId) {
        String shortId = userId.toString().replace("-", "").substring(0, 6).toUpperCase();
        return "BNK-" + shortId + "-" + Instant.now().getEpochSecond();
    }
}
