package com.experis.sofia.bankportal.deposit.application.dto;

import com.experis.sofia.bankportal.deposit.domain.model.RenewalInstruction;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record OpenDepositRequest(
    @NotNull @Min(1000) BigDecimal importe,
    @NotNull int plazoMeses,
    @NotNull UUID cuentaOrigenId,
    @NotNull RenewalInstruction renovacion,
    @NotBlank String otp
) {}
