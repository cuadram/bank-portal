package com.experis.sofia.bankportal.loan.application.dto;

import com.experis.sofia.bankportal.loan.domain.model.AmortizationRow;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record LoanDetailDTO(
        UUID id,
        String tipo,
        BigDecimal importeOriginal,
        BigDecimal importePendiente,
        BigDecimal cuotaMensual,
        BigDecimal tae,
        String estado,
        int plazo,
        BigDecimal costeTotal,
        BigDecimal interesesTotales,
        String fechaInicio,
        String fechaFin,
        List<AmortizationRow> amortizacion
) {}
