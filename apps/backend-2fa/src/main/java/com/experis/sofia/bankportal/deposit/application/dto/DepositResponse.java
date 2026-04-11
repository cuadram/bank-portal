package com.experis.sofia.bankportal.deposit.application.dto;

import com.experis.sofia.bankportal.deposit.domain.model.DepositStatus;
import com.experis.sofia.bankportal.deposit.domain.model.RenewalInstruction;
import java.time.LocalDate;
import java.util.UUID;
import java.math.BigDecimal;

public record DepositResponse(
    UUID id,
    DepositStatus estado,
    BigDecimal importe,
    int plazoMeses,
    BigDecimal tin,
    BigDecimal tae,
    RenewalInstruction renovacion,
    LocalDate fechaApertura,
    LocalDate fechaVencimiento
) {}
