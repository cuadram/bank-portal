package com.experis.sofia.bankportal.bill.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.UUID;

/**
 * Comando para pago de recibo domiciliado.
 * US-903 FEAT-009 Sprint 11.
 *
 * @author SOFIA Developer Agent
 */
public record PayBillCommand(
        @NotNull UUID sourceAccountId,
        @NotBlank @Pattern(regexp = "\\d{6}") String otpCode
) {}
