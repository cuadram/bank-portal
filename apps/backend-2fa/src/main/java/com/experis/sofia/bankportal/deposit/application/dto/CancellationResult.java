package com.experis.sofia.bankportal.deposit.application.dto;

import java.math.BigDecimal;

public record CancellationResult(
    BigDecimal importeAbonado,
    BigDecimal penalizacion,
    BigDecimal interesesDevengados
) {}
