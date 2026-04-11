package com.experis.sofia.bankportal.beneficiary.application.dto;

import com.experis.sofia.bankportal.beneficiary.domain.Beneficiary;

import java.time.LocalDateTime;
import java.util.UUID;

public record BeneficiaryDto(
        UUID          id,
        String        alias,
        String        ibanMasked,
        String        holderName,
        LocalDateTime createdAt
) {
    public static BeneficiaryDto from(Beneficiary b) {
        return new BeneficiaryDto(b.getId(), b.getAlias(),
                b.getMaskedIban(), b.getHolderName(), b.getCreatedAt());
    }
}
