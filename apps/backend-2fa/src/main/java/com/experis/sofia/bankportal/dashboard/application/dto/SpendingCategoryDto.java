package com.experis.sofia.bankportal.dashboard.application.dto;

import java.math.BigDecimal;

/** US-1002 — Gasto por categoría. @author SOFIA Developer Agent */
public record SpendingCategoryDto(
        String category,
        BigDecimal amount,
        double percentage,
        int count
) {}
