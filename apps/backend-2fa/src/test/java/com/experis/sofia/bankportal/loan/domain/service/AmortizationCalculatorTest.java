package com.experis.sofia.bankportal.loan.domain.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * TC-LOAN-001 a TC-LOAN-006 — AmortizationCalculator
 * ADR-034: método francés, BigDecimal HALF_EVEN, escala 10.
 */
class AmortizationCalculatorTest {

    private AmortizationCalculator calculator;

    @BeforeEach
    void setUp() { calculator = new AmortizationCalculator(); }

    @Test
    @DisplayName("TC-LOAN-001: cuota 10000€ 12m TAE 6.5% = 861.35€ aprox")
    void calcularCuota_produceCuotaCorrecta() {
        BigDecimal cuota = calculator.calcularCuota(
                new BigDecimal("10000"), 12, new BigDecimal("6.50"));
        // cuota esperada: 861.35 ± 0.01
        assertThat(cuota).isBetween(new BigDecimal("861.00"), new BigDecimal("862.00"));
    }

    @Test
    @DisplayName("TC-LOAN-002: cuota escala exactamente 2 decimales")
    void calcularCuota_tieneEscala2() {
        BigDecimal cuota = calculator.calcularCuota(
                new BigDecimal("15000"), 36, new BigDecimal("6.50"));
        assertThat(cuota.scale()).isEqualTo(2);
    }

    @Test
    @DisplayName("TC-LOAN-003: cuadro amortización genera N filas igual al plazo")
    void generarCuadro_generaFilasCorrectas() {
        var rows = calculator.generarCuadro(
                new BigDecimal("10000"), 24, new BigDecimal("6.50"));
        assertThat(rows).hasSize(24);
    }

    @Test
    @DisplayName("TC-LOAN-004: última fila tiene saldo pendiente = 0")
    void generarCuadro_ultimaFilaSaldoCero() {
        var rows = calculator.generarCuadro(
                new BigDecimal("10000"), 12, new BigDecimal("6.50"));
        assertThat(rows.get(rows.size() - 1).saldoPendiente())
                .isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("TC-LOAN-005: suma capital amortizado ≈ importe original ±0.10€")
    void generarCuadro_sumaCapitalIgualImporte() {
        BigDecimal importe = new BigDecimal("10000");
        var rows = calculator.generarCuadro(importe, 12, new BigDecimal("6.50"));
        BigDecimal sumCapital = rows.stream()
                .map(r -> r.capital())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(sumCapital).isBetween(
                importe.subtract(new BigDecimal("0.10")),
                importe.add(new BigDecimal("0.10")));
    }

    @Test
    @DisplayName("TC-LOAN-006: calcularCosteTotal = cuota * plazo")
    void calcularCosteTotal_esCuotaPorPlazo() {
        BigDecimal cuota = new BigDecimal("861.35");
        BigDecimal total = calculator.calcularCosteTotal(cuota, 12);
        assertThat(total).isEqualByComparingTo(cuota.multiply(BigDecimal.valueOf(12))
                .setScale(2, RoundingMode.HALF_EVEN));
    }
}
