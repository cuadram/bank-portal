package com.experis.sofia.bankportal.dashboard.application.dto;

import java.math.BigDecimal;

/** US-1004 — Comparativa mes actual vs anterior. @author SOFIA Developer Agent */
public record MonthComparisonDto(
        PeriodData currentMonth,
        PeriodData previousMonth,
        Double expensesVariationPercent,   // null si no hay mes anterior
        Double incomeVariationPercent      // null si no hay mes anterior
) {
    public record PeriodData(String period, BigDecimal totalIncome, BigDecimal totalExpenses) {}
}
