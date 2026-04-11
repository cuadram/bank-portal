package com.experis.sofia.bankportal.loan.application.dto;

import com.experis.sofia.bankportal.loan.domain.model.AmortizationRow;
import java.math.BigDecimal;
import java.util.List;

public record SimulationResponse(
        BigDecimal cuotaMensual,
        BigDecimal tae,
        BigDecimal costeTotal,
        BigDecimal interesesTotales,
        List<AmortizationRow> schedule
) {}
