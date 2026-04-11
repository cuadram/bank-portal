package com.experis.sofia.bankportal.deposit.domain.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Cálculo retención IRPF sobre rendimientos del capital mobiliario.
 * Art.25 Ley 35/2006 — tramos vigentes:
 *   19% si intereses brutos <= 6.000 €
 *   21% si intereses brutos <= 50.000 €
 *   23% si intereses brutos >  50.000 €
 * ADR-036: BigDecimal HALF_EVEN
 */
@Service
public class IrpfRetentionCalculator {

    private static final BigDecimal TRAMO_1_LIMITE = new BigDecimal("6000");
    private static final BigDecimal TRAMO_2_LIMITE = new BigDecimal("50000");
    private static final BigDecimal TASA_19 = new BigDecimal("0.19");
    private static final BigDecimal TASA_21 = new BigDecimal("0.21");
    private static final BigDecimal TASA_23 = new BigDecimal("0.23");

    public BigDecimal calcular(BigDecimal interesesBrutos) {
        BigDecimal rate = interesesBrutos.compareTo(TRAMO_1_LIMITE) <= 0 ? TASA_19
                        : interesesBrutos.compareTo(TRAMO_2_LIMITE) <= 0 ? TASA_21
                        : TASA_23;
        return interesesBrutos.multiply(rate).setScale(2, RoundingMode.HALF_EVEN);
    }
}
