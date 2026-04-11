package com.experis.sofia.bankportal.loan.domain.service;

import com.experis.sofia.bankportal.loan.domain.model.AmortizationRow;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Cálculo de cuota método francés con BigDecimal escala 10.
 * ADR-034: RoundingMode.HALF_EVEN (banquero) para precisión regulatoria.
 */
@Service
public class AmortizationCalculator {

    private static final int SCALE = 10;
    private static final RoundingMode RM = RoundingMode.HALF_EVEN;

    /**
     * Calcula la cuota mensual fija (método francés).
     * @param importe   Capital del préstamo
     * @param plazo     Número de cuotas (meses)
     * @param taeAnual  TAE en porcentaje (ej: 6.5 para 6.5%)
     */
    public BigDecimal calcularCuota(BigDecimal importe, int plazo, BigDecimal taeAnual) {
        // r = TAE_anual / 12 / 100
        BigDecimal r = taeAnual.divide(BigDecimal.valueOf(1200L), SCALE, RM);
        // (1+r)^n
        BigDecimal factor = BigDecimal.ONE.add(r).pow(plazo);
        // cuota = P * r * (1+r)^n / ((1+r)^n - 1)
        BigDecimal num = importe.multiply(r).multiply(factor).setScale(SCALE, RM);
        BigDecimal den = factor.subtract(BigDecimal.ONE).setScale(SCALE, RM);
        return num.divide(den, 2, RM);
    }

    /**
     * Genera el cuadro de amortización completo.
     */
    public List<AmortizationRow> generarCuadro(BigDecimal importe, int plazo, BigDecimal taeAnual) {
        BigDecimal r = taeAnual.divide(BigDecimal.valueOf(1200L), SCALE, RM);
        BigDecimal cuota = calcularCuota(importe, plazo, taeAnual);
        BigDecimal saldo = importe;
        List<AmortizationRow> rows = new ArrayList<>(plazo);
        LocalDate fecha = LocalDate.now().plusMonths(1).withDayOfMonth(1);

        for (int n = 1; n <= plazo; n++) {
            BigDecimal intereses = saldo.multiply(r).setScale(2, RM);
            BigDecimal capital = cuota.subtract(intereses).setScale(2, RM);
            saldo = saldo.subtract(capital).max(BigDecimal.ZERO).setScale(2, RM);
            rows.add(new AmortizationRow(n, fecha, capital, intereses, cuota, saldo));
            fecha = fecha.plusMonths(1);
        }
        return rows;
    }

    /**
     * Calcula el coste total del préstamo (suma de cuotas).
     */
    public BigDecimal calcularCosteTotal(BigDecimal cuota, int plazo) {
        return cuota.multiply(BigDecimal.valueOf(plazo)).setScale(2, RM);
    }
}
