package com.experis.sofia.bankportal.bill.domain;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad de dominio — Recibo domiciliado del usuario.
 * US-903 FEAT-009 Sprint 11.
 *
 * @author SOFIA Developer Agent
 */
public record Bill(
        UUID id,
        UUID userId,
        String issuer,
        String concept,
        BigDecimal amount,
        LocalDate dueDate,
        BillStatus status,
        LocalDateTime createdAt
) {}
