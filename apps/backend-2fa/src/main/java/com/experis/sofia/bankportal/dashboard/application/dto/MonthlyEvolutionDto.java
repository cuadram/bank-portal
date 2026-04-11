package com.experis.sofia.bankportal.dashboard.application.dto;

import java.math.BigDecimal;

/** US-1003 — Punto de evolución mensual. @author SOFIA Developer Agent */
public record MonthlyEvolutionDto(
        int year,
        int month,
        BigDecimal totalIncome,
        BigDecimal totalExpenses,
        BigDecimal netBalance
) {}
