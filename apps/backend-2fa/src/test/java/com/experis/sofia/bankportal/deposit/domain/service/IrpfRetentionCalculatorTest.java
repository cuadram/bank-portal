package com.experis.sofia.bankportal.deposit.domain.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TC-DEPOSIT-001..004 — IrpfRetentionCalculator
 * Art.25 Ley 35/2006: tramos 19%/21%/23%
 * ADR-036: BigDecimal HALF_EVEN
 */
class IrpfRetentionCalculatorTest {

    private final IrpfRetentionCalculator calculator = new IrpfRetentionCalculator();

    @ParameterizedTest(name = "{0} EUR => retencion {1} EUR (tramo {2}%)")
    @CsvSource({
        "500.00,   95.00, 19",    // TC-DEPOSIT-001: tramo <= 6000
        "6000.00, 1140.00, 19",   // TC-DEPOSIT-002: limite tramo 1 exacto
        "6001.00, 1260.21, 21",   // TC-DEPOSIT-003: primer euro tramo 2
        "50001.00, 11500.23, 23"  // TC-DEPOSIT-004: tramo 3
    })
    @DisplayName("TC-DEPOSIT-001..004 — Calculo retencion IRPF por tramos")
    void calculaRetencionPorTramo(String brutos, String esperada, int pct) {
        BigDecimal resultado = calculator.calcular(new BigDecimal(brutos));
        assertThat(resultado).isEqualByComparingTo(new BigDecimal(esperada));
    }

    @Test
    @DisplayName("TC-DEPOSIT-005 — Importe cero produce retencion cero")
    void importeCeroProduceRetencionCero() {
        assertThat(calculator.calcular(BigDecimal.ZERO))
            .isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("TC-DEPOSIT-006 — Escala resultado siempre 2 decimales")
    void resultadoSiempreDosDecimales() {
        BigDecimal resultado = calculator.calcular(new BigDecimal("333.33"));
        assertThat(resultado.scale()).isEqualTo(2);
    }
}
