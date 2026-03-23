package com.experis.sofia.bankportal.bill.application.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO respuesta tras completar un pago de recibo o factura.
 * US-903/904 FEAT-009 Sprint 11.
 *
 * @author SOFIA Developer Agent
 */
public record PaymentResultDto(
        UUID paymentId,
        String status,
        LocalDateTime paidAt
) {}
