package com.experis.sofia.bankportal.loan.application.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record LoanSummaryDTO(
        UUID id,
        String tipo,
        BigDecimal importeOriginal,
        BigDecimal importePendiente,
        BigDecimal cuotaMensual,
        BigDecimal tae,
        String estado,
        String proximaCuota
) {}
