package com.experis.sofia.bankportal.dashboard.application.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** US-1005 — Alerta de presupuesto. @author SOFIA Developer Agent */
public record BudgetAlertDto(
        String type,
        int threshold,
        BigDecimal monthlyBudget,
        BigDecimal currentAmount,
        double usedPercent,
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        LocalDateTime triggeredAt
) {}
