package com.experis.sofia.bankportal.beneficiary.application.dto;

import java.util.UUID;

public record CreateBeneficiaryCommand(
        UUID   userId,
        String alias,
        String iban,
        String holderName,
        String otpCode
) {}
