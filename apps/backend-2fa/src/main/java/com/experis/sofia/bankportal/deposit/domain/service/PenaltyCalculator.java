package com.experis.sofia.bankportal.deposit.domain.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Cálculo de penalización por cancelación anticipada.
 * DEBT-044: penaltyRate desde application.yml
 */
@Service
public class PenaltyCalculator {

    @Value("${bank.products.deposit.penalty-rate:0.25}")
    private BigDecimal penaltyRate;

    public BigDecimal calcular(BigDecimal interesesDevengados) {
        return interesesDevengados.multiply(penaltyRate).setScale(2, RoundingMode.HALF_EVEN);
    }
}
