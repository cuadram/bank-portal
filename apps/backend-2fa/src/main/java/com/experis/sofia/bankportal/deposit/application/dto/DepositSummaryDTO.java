package com.experis.sofia.bankportal.deposit.application.dto;

import com.experis.sofia.bankportal.deposit.domain.model.DepositStatus;
import com.experis.sofia.bankportal.deposit.domain.model.RenewalInstruction;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DepositSummaryDTO(
    UUID id,
    BigDecimal importe,
    int plazoMeses,
    BigDecimal tin,
    BigDecimal tae,
    DepositStatus estado,
    RenewalInstruction renovacion,
    LocalDate fechaApertura,
    LocalDate fechaVencimiento,
    boolean fgdCovered
) {}
