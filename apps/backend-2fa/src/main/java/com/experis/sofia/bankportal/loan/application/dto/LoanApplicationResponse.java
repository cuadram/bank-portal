package com.experis.sofia.bankportal.loan.application.dto;

import java.util.UUID;

public record LoanApplicationResponse(
        UUID id,
        String estado,
        String mensaje
) {}
