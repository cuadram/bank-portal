package com.experis.sofia.bankportal.deposit.application.dto;

import java.math.BigDecimal;

public record SimulationResponse(
    BigDecimal tin,
    BigDecimal tae,
    BigDecimal interesesBrutos,
    BigDecimal retencionIrpf,
    BigDecimal interesesNetos,
    BigDecimal totalVencimiento
) {}
