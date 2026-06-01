package com.experis.sofia.bankportal.pfm;

import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import com.experis.sofia.bankportal.pfm.domain.model.Budget;
import com.experis.sofia.bankportal.pfm.domain.repository.BudgetRepository;
import com.experis.sofia.bankportal.pfm.domain.repository.PfmTransactionReadRepository;
import com.experis.sofia.bankportal.pfm.domain.service.BudgetService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * TC-F023-BUGPO001 — Regresión BUG-PO-001 (importe firmado negativo en caché).
 * El gasto consumido debe ser magnitud positiva para que percentConsumed/status
 * (semáforo) sean correctos. Antes del fix la caché negativa daba % negativo → siempre GREEN.
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 27 (saneamiento)
 */
@ExtendWith(MockitoExtension.class)
class BudgetServiceSpentTest {

    @Mock BudgetRepository             budgetRepo;
    @Mock PfmTransactionReadRepository txRepo;
    @InjectMocks BudgetService         service;

    private final UUID userId = UUID.randomUUID();
    private final YearMonth month = YearMonth.of(2026, 6);

    @Test @DisplayName("getSpent devuelve MAGNITUD positiva aunque la caché almacene negativo")
    void getSpentDevuelveMagnitudPositiva() {
        when(txRepo.sumCargosByCategory(userId, month, "ALIMENTACION"))
            .thenReturn(new BigDecimal("-360.00"));   // caché firmada (CARGO)
        BigDecimal spent = service.getSpent(userId, SpendingCategory.ALIMENTACION, month);
        assertThat(spent).isEqualByComparingTo("360.00");   // positivo
    }

    @Test @DisplayName("Con gasto negativo en caché, el semáforo del Budget ya NO es siempre GREEN")
    void semaforoCorrectoTrasAbs() {
        when(txRepo.sumCargosByCategory(userId, month, "OCIO"))
            .thenReturn(new BigDecimal("-195.48"));   // > límite 100 → debe ser RED
        BigDecimal spent = service.getSpent(userId, SpendingCategory.OCIO, month);
        // Budget OCIO límite 100, umbral 90
        Budget ocio = new Budget(UUID.randomUUID(), userId, SpendingCategory.OCIO,
                                 new BigDecimal("100.00"), 90, month, Instant.now(), Instant.now());
        assertThat(spent).isEqualByComparingTo("195.48");
        assertThat(ocio.percentConsumed(spent)).isGreaterThanOrEqualTo(100);
        assertThat(ocio.status(spent)).isEqualTo(Budget.Status.RED);
    }
}
