package com.experis.sofia.bankportal.deposit.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record SimulateDepositRequest(
    @NotNull @Min(1000) BigDecimal importe,
    @NotNull int plazoMeses
) {}
