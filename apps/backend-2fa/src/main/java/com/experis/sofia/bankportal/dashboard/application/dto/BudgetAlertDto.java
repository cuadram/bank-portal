package com.experis.sofia.bankportal.dashboard.application.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** US-1005 — Alerta de presupuesto. @author SOFIA Developer Agent */
public record BudgetAlertDto(
        String type,
        int threshold,
        BigDecimal monthlyBudget,
        BigDecimal currentAmount,
        double usedPercent,
        LocalDateTime triggeredAt
) {}
