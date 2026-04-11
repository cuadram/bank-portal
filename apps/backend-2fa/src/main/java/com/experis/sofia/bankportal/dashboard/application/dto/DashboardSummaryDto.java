package com.experis.sofia.bankportal.dashboard.application.dto;

import java.math.BigDecimal;

/** US-1001 — Resumen financiero de un período. @author SOFIA Developer Agent */
public record DashboardSummaryDto(
        String period,
        BigDecimal totalIncome,
        BigDecimal totalExpenses,
        BigDecimal netBalance,
        int transactionCount
) {}
