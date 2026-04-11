package com.experis.sofia.bankportal.bill.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO respuesta para GET /api/v1/bills
 * US-903 FEAT-009 Sprint 11.
 *
 * @author SOFIA Developer Agent
 */
public record BillDto(
        UUID id,
        String issuer,
        String concept,
        BigDecimal amount,
        LocalDate dueDate,
        String status
) {}
