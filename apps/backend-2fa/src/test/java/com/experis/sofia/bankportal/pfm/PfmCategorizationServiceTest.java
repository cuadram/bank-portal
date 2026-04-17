package com.experis.sofia.bankportal.pfm;

import com.experis.sofia.bankportal.dashboard.application.SpendingCategorizationEngine;
import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import com.experis.sofia.bankportal.pfm.domain.model.PfmUserRule;
import com.experis.sofia.bankportal.pfm.domain.repository.PfmUserRuleRepository;
import com.experis.sofia.bankportal.pfm.domain.service.PfmCategorizationService;
import com.experis.sofia.bankportal.pfm.domain.repository.PfmTransactionReadRepository.RawMovimiento;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * TC-F023-001..004 — Categorización de movimientos.
 * US-F023-01 · RN-F023-01/02/03.
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
@ExtendWith(MockitoExtension.class)
class PfmCategorizationServiceTest {

    @Mock PfmUserRuleRepository userRuleRepo;
    @InjectMocks PfmCategorizationService service;

    private final UUID userId = UUID.randomUUID();
    private final SpendingCategorizationEngine engine = new SpendingCategorizationEngine();

    @BeforeEach
    void injectEngine() throws Exception {
        var f = PfmCategorizationService.class.getDeclaredField("engine");
        f.setAccessible(true);
        f.set(service, engine);
    }

    @Test @DisplayName("TC-F023-001 — Categorización por concepto: MERCADONA → ALIMENTACION")
    void categorizaByConcepto() {
        when(userRuleRepo.findByUserId(userId)).thenReturn(List.of());
        var movs = List.of(new RawMovimiento(UUID.randomUUID(), "COMPRA MERCADONA SA", new BigDecimal("45.20")));
        var result = service.categorizeAll(userId, movs);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).category()).isEqualTo(SpendingCategory.ALIMENTACION);
    }

    @Test @DisplayName("TC-F023-002 — Concepto desconocido → OTROS")
    void conceptoDesconocidoOtros() {
        when(userRuleRepo.findByUserId(userId)).thenReturn(List.of());
        var movs = List.of(new RawMovimiento(UUID.randomUUID(), "EMPRESA XYZ SL REF0001", new BigDecimal("25.00")));
        var result = service.categorizeAll(userId, movs);
        assertThat(result.get(0).category()).isEqualTo(SpendingCategory.OTROS);
    }

    @Test @DisplayName("TC-F023-003 — Regla usuario tiene prioridad sobre sistema (RN-F023-01)")
    void reglaUsuarioPrioridad() {
        UUID ruleId = UUID.randomUUID();
        var userRule = new PfmUserRule(ruleId, userId, "FLOWERTOPIA", SpendingCategory.HOGAR, Instant.now());
        when(userRuleRepo.findByUserId(userId)).thenReturn(List.of(userRule));
        var movs = List.of(new RawMovimiento(UUID.randomUUID(), "FLOWERTOPIA SL", new BigDecimal("30.00")));
        var result = service.categorizeAll(userId, movs);
        assertThat(result.get(0).category()).isEqualTo(SpendingCategory.HOGAR);
    }

    @Test @DisplayName("TC-F023-004 — NOMINA categorizada como ingreso: isIngreso true")
    void nominaIngreso() {
        when(userRuleRepo.findByUserId(userId)).thenReturn(List.of());
        var movs = List.of(new RawMovimiento(UUID.randomUUID(), "NOMINA ABRIL EMPRESA SA", new BigDecimal("2400.00")));
        var result = service.categorizeAll(userId, movs);
        assertThat(result.get(0).category()).isEqualTo(SpendingCategory.NOMINA);
        assertThat(result.get(0).category().isIngreso()).isTrue();
    }
}
