package com.experis.sofia.bankportal.pfm;

import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import com.experis.sofia.bankportal.pfm.domain.model.Budget;
import com.experis.sofia.bankportal.pfm.domain.model.Budget.Status;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * TC-F023-005..010 — Presupuestos mensuales.
 * US-F023-02 · RN-F023-04/05/06/07.
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
class BudgetDomainTest {

    private Budget budget(BigDecimal limit, int threshold) {
        return new Budget(UUID.randomUUID(), UUID.randomUUID(),
            SpendingCategory.ALIMENTACION, limit, threshold,
            YearMonth.now(), Instant.now(), Instant.now());
    }

    @Test @DisplayName("TC-F023-005 — Presupuesto OK: semáforo GREEN por debajo del umbral")
    void greenBelowThreshold() {
        var b = budget(new BigDecimal("300.00"), 80);
        assertThat(b.status(new BigDecimal("200.00"))).isEqualTo(Status.GREEN);
        assertThat(b.percentConsumed(new BigDecimal("200.00"))).isEqualTo(67);
    }

    @Test @DisplayName("TC-F023-006 — Presupuesto 81%: semáforo ORANGE")
    void orangeAboveThreshold() {
        var b = budget(new BigDecimal("300.00"), 80);
        assertThat(b.status(new BigDecimal("245.00"))).isEqualTo(Status.ORANGE);
        assertThat(b.isAboveThreshold(new BigDecimal("245.00"))).isTrue();
    }

    @Test @DisplayName("TC-F023-007 — Presupuesto excedido: semáforo RED")
    void redExceeded() {
        var b = budget(new BigDecimal("300.00"), 80);
        assertThat(b.status(new BigDecimal("315.00"))).isEqualTo(Status.RED);
        assertThat(b.isExceeded(new BigDecimal("315.00"))).isTrue();
    }

    @Test @DisplayName("TC-F023-008 — percentConsumed usa HALF_EVEN (ADR-034)")
    void halfEvenRounding() {
        var b = budget(new BigDecimal("300.00"), 80);
        // 245/300 = 81.666... → HALF_EVEN → 82
        assertThat(b.percentConsumed(new BigDecimal("245.00"))).isEqualTo(82);
    }

    @Test @DisplayName("TC-F023-009 — Presupuesto exactamente en umbral: ORANGE")
    void exactlyAtThreshold() {
        var b = budget(new BigDecimal("300.00"), 80);
        assertThat(b.status(new BigDecimal("240.00"))).isEqualTo(Status.ORANGE);
    }

    @Test @DisplayName("TC-F023-010 — NOMINA es ingreso: isIngreso true")
    void nominaIsIngreso() {
        assertThat(SpendingCategory.NOMINA.isIngreso()).isTrue();
        assertThat(SpendingCategory.TRANSFERENCIAS.isIngreso()).isTrue();
        assertThat(SpendingCategory.ALIMENTACION.isIngreso()).isFalse();
    }
}
