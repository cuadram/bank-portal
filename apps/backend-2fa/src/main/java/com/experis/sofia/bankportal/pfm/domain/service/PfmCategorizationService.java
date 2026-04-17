package com.experis.sofia.bankportal.pfm.domain.service;

import com.experis.sofia.bankportal.dashboard.application.SpendingCategorizationEngine;
import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import com.experis.sofia.bankportal.pfm.domain.model.PfmUserRule;
import com.experis.sofia.bankportal.pfm.domain.repository.PfmTransactionReadRepository.RawMovimiento;
import com.experis.sofia.bankportal.pfm.domain.repository.PfmUserRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

/**
 * Categorización PFM en tiempo de consulta.
 * RN-F023-01: regla usuario > sistema.
 * RN-F023-02: solo CARGOs cuentan en presupuestos y análisis.
 * RN-F023-03: categoría calculada on-the-fly; solo se persiste el override manual.
 * ADR-037: categorización en tiempo de consulta (no persistida).
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
@Service
@RequiredArgsConstructor
public class PfmCategorizationService {

    private final PfmUserRuleRepository       userRuleRepo;
    private final SpendingCategorizationEngine engine;

    /** Categoría efectiva para un concepto dado un userId (user > system). */
    public SpendingCategory categorize(UUID userId, String concept) {
        List<PfmUserRule> userRules = userRuleRepo.findByUserId(userId);
        SpendingCategory userOverride = userRules.stream()
                .filter(r -> r.matches(concept))
                .map(PfmUserRule::getCategory)
                .findFirst()
                .orElse(null);
        return engine.categorizeWithUserRule(concept, concept, userOverride);
    }

    /** Categoriza una lista de movimientos — devuelve pares (movimiento, categoría). */
    public List<MovimientoCategorizado> categorizeAll(UUID userId, List<RawMovimiento> movimientos) {
        List<PfmUserRule> userRules = userRuleRepo.findByUserId(userId);
        return movimientos.stream().map(m -> {
            SpendingCategory userOverride = userRules.stream()
                    .filter(r -> r.matches(m.concept()))
                    .map(PfmUserRule::getCategory)
                    .findFirst().orElse(null);
            SpendingCategory cat = engine.categorizeWithUserRule(m.concept(), m.concept(), userOverride);
            return new MovimientoCategorizado(m.txId(), m.concept(), m.amount(), cat);
        }).toList();
    }

    public record MovimientoCategorizado(
        java.util.UUID txId,
        String concept,
        java.math.BigDecimal amount,
        SpendingCategory category
    ) {}
}
