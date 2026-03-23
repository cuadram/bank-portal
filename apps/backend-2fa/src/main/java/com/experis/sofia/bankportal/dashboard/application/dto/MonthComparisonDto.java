package com.experis.sofia.bankportal.dashboard.application.dto;
import java.math.BigDecimal;
public record MonthComparisonDto(PeriodData currentMonth, PeriodData previousMonth, Double expensesVariationPercent, Double incomeVariationPercent) {
    public record PeriodData(String period, BigDecimal totalIncome, BigDecimal totalExpenses) {}
}
