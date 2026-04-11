package com.experis.sofia.bankportal.loan.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AmortizationRow(
        int n,
        LocalDate fecha,
        BigDecimal capital,
        BigDecimal intereses,
        BigDecimal cuotaTotal,
        BigDecimal saldoPendiente
) {}
