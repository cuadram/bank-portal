package com.experis.sofia.bankportal.deposit.application.dto;

import com.experis.sofia.bankportal.deposit.domain.model.DepositStatus;
import com.experis.sofia.bankportal.deposit.domain.model.RenewalInstruction;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record DepositDetailDTO(
    UUID id,
    UUID cuentaOrigenId,
    BigDecimal importe,
    int plazoMeses,
    BigDecimal tin,
    BigDecimal tae,
    BigDecimal interesesBrutos,
    BigDecimal retencionIrpf,
    BigDecimal interesesNetos,
    BigDecimal totalVencimiento,
    DepositStatus estado,
    RenewalInstruction renovacion,
    LocalDate fechaApertura,
    LocalDate fechaVencimiento,
    BigDecimal penalizacion,
    boolean fgdCovered
) {}
