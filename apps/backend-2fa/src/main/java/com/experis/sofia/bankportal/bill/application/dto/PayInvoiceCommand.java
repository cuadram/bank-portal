package com.experis.sofia.bankportal.bill.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Comando para pago de factura con referencia (sin domiciliación).
 * US-904 FEAT-009 Sprint 11.
 *
 * @author SOFIA Developer Agent
 */
public record PayInvoiceCommand(
        @NotBlank @Pattern(regexp = "\\d{20}", message = "La referencia debe tener exactamente 20 dígitos")
        String reference,

        @NotNull UUID sourceAccountId,

        @NotNull @DecimalMin("0.01") BigDecimal amount,

        @NotBlank @Pattern(regexp = "\\d{6}") String otpCode
) {}
