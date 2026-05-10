package com.experis.sofia.bankportal.savings.domain.service;

import com.experis.sofia.bankportal.savings.domain.model.GoalCategory;
import com.experis.sofia.bankportal.savings.domain.model.GoalMilestone;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.GoalMilestoneRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TC-F024-005..009 — MilestoneEvaluator: idempotencia + thresholds 25/50/75/100.
 * RN-F024-09.
 *
 * Cobertura:
 *  - thresholdsCrossed(): 0/1/2/3/4 segun progressPercent
 *  - evaluate(): persiste solo los thresholds nuevos (existsByGoalIdAndPercent filtra)
 *  - evaluate(): tras DataIntegrityViolation (UK), no propaga la excepcion (idempotencia carrera)
 *  - evaluate(): goal con target=0 o null devuelve lista vacia (sin NPE)
 *
 * Usamos un fake in-memory del puerto en lugar de Mockito para mantener el test
 * en el modulo "domain" (sin dependencia Mockito en domain tests, alineado con
 * IrpfRetentionCalculatorTest del modulo deposit).
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase F.1
 */
class MilestoneEvaluatorTest {

    private FakeMilestoneRepo repo;
    private MilestoneEvaluator evaluator;

    @BeforeEach
    void setUp() {
        repo = new FakeMilestoneRepo();
        evaluator = new MilestoneEvaluator(repo);
    }

    private SavingsGoal goalAt(BigDecimal target, BigDecimal reserved) {
        SavingsGoal g = new SavingsGoal();
        g.setId(UUID.randomUUID());
        g.setUserId(UUID.randomUUID());
        g.setName("test-goal");
        g.setTargetAmount(target);
        g.setReservedAmount(reserved);
        g.setTargetDate(LocalDate.now().plusMonths(6));
        g.setCategory(GoalCategory.HOGAR);
        g.setStatus(GoalStatus.ACTIVE);
        g.setCreatedAt(Instant.now());
        g.setUpdatedAt(Instant.now());
        return g;
    }

    // -- thresholdsCrossed() --------------------------------------------------

    @Test @DisplayName("TC-F024-005a — thresholdsCrossed: 24% no cruza ningun umbral")
    void noThresholdCrossed() {
        var g = goalAt(new BigDecimal("1000.00"), new BigDecimal("239.00"));  // 23.90%
        assertThat(evaluator.thresholdsCrossed(g)).isEmpty();
    }

    @Test @DisplayName("TC-F024-005b — thresholdsCrossed: 25% exacto cruza solo {25}")
    void oneThresholdAt25() {
        var g = goalAt(new BigDecimal("1000.00"), new BigDecimal("250.00"));
        assertThat(evaluator.thresholdsCrossed(g)).containsExactly(25);
    }

    @Test @DisplayName("TC-F024-005c — thresholdsCrossed: 74% cruza {25, 50}")
    void twoThresholdsAt74() {
        var g = goalAt(new BigDecimal("1000.00"), new BigDecimal("740.00"));  // 74.00%
        assertThat(evaluator.thresholdsCrossed(g)).containsExactly(25, 50);
    }

    @Test @DisplayName("TC-F024-005d — thresholdsCrossed: 75% cruza {25, 50, 75}")
    void threeThresholdsAt75() {
        var g = goalAt(new BigDecimal("1000.00"), new BigDecimal("750.00"));
        assertThat(evaluator.thresholdsCrossed(g)).containsExactly(25, 50, 75);
    }

    @Test @DisplayName("TC-F024-005e — thresholdsCrossed: 100% cruza los 4 umbrales")
    void fourThresholdsAt100() {
        var g = goalAt(new BigDecimal("1000.00"), new BigDecimal("1000.00"));
        assertThat(evaluator.thresholdsCrossed(g)).containsExactly(25, 50, 75, 100);
    }

    // -- evaluate() — happy path ----------------------------------------------

    @Test @DisplayName("TC-F024-006 — evaluate: primer salto a 25% persiste 1 hito")
    void firstJumpTo25() {
        var g = goalAt(new BigDecimal("1000.00"), new BigDecimal("250.00"));
        List<GoalMilestone> created = evaluator.evaluate(g);
        assertThat(created).hasSize(1);
        assertThat(created.get(0).getPercent()).isEqualTo(25);
        assertThat(created.get(0).getGoalId()).isEqualTo(g.getId());
        assertThat(created.get(0).getReachedAt()).isNotNull();
        assertThat(repo.persisted).hasSize(1);
    }

    @Test @DisplayName("TC-F024-007a — evaluate: salto directo a 75% persiste 3 hitos en orden")
    void jumpDirectlyTo75() {
        var g = goalAt(new BigDecimal("1000.00"), new BigDecimal("750.00"));
        List<GoalMilestone> created = evaluator.evaluate(g);
        assertThat(created).hasSize(3);
        assertThat(created).extracting(GoalMilestone::getPercent).containsExactly(25, 50, 75);
    }

    // -- evaluate() — idempotencia --------------------------------------------

    @Test @DisplayName("TC-F024-008a — evaluate idempotente: re-ejecucion no duplica hitos previos")
    void reExecutionDoesNotDuplicate() {
        var g = goalAt(new BigDecimal("1000.00"), new BigDecimal("550.00"));  // 55%

        List<GoalMilestone> first = evaluator.evaluate(g);
        assertThat(first).hasSize(2);  // 25, 50

        List<GoalMilestone> second = evaluator.evaluate(g);
        assertThat(second).isEmpty();  // ya emitidos

        assertThat(repo.persisted).hasSize(2);
    }

    @Test @DisplayName("TC-F024-008b — evaluate idempotente: aportacion incremental añade solo el nuevo umbral")
    void incrementalContributionAddsOnlyNewThreshold() {
        var g = goalAt(new BigDecimal("1000.00"), new BigDecimal("260.00"));  // 26%
        evaluator.evaluate(g);
        assertThat(repo.persisted).hasSize(1);  // solo 25

        // simulamos incremento de aportacion a 51%
        g.setReservedAmount(new BigDecimal("510.00"));
        List<GoalMilestone> next = evaluator.evaluate(g);
        assertThat(next).hasSize(1);
        assertThat(next.get(0).getPercent()).isEqualTo(50);
        assertThat(repo.persisted).hasSize(2);
    }

    // -- evaluate() — carrera concurrente -------------------------------------

    @Test @DisplayName("TC-F024-009a — evaluate: DataIntegrityViolation en save no propaga (carrera)")
    void dataIntegrityViolationIsSwallowed() {
        var g = goalAt(new BigDecimal("1000.00"), new BigDecimal("250.00"));
        repo.throwOnSave = true;  // simula UK race
        // No debe lanzar
        List<GoalMilestone> created = evaluator.evaluate(g);
        assertThat(created).isEmpty();  // el throw se traga; nada se anade a la lista
    }

    // -- evaluate() — defensivo -----------------------------------------------

    @Test @DisplayName("TC-F024-009b — evaluate: goal null devuelve lista vacia")
    void nullGoalReturnsEmpty() {
        assertThat(evaluator.evaluate(null)).isEmpty();
    }

    @Test @DisplayName("TC-F024-009c — evaluate: target=0 devuelve lista vacia (no NPE)")
    void zeroTargetReturnsEmpty() {
        var g = goalAt(BigDecimal.ZERO, BigDecimal.ZERO);
        assertThat(evaluator.evaluate(g)).isEmpty();
    }

    @Test @DisplayName("TC-F024-009d — evaluate: target=null devuelve lista vacia (no NPE)")
    void nullTargetReturnsEmpty() {
        var g = goalAt(null, BigDecimal.ZERO);
        assertThat(evaluator.evaluate(g)).isEmpty();
    }

    // -- Fake repo in-memory --------------------------------------------------

    private static class FakeMilestoneRepo implements GoalMilestoneRepositoryPort {
        final List<GoalMilestone> persisted = new java.util.ArrayList<>();
        final Set<String> keys = new HashSet<>();
        boolean throwOnSave = false;

        @Override
        public GoalMilestone save(GoalMilestone m) {
            if (throwOnSave) {
                throw new DataIntegrityViolationException("simulated UK violation");
            }
            String key = m.getGoalId() + ":" + m.getPercent();
            if (keys.contains(key)) {
                throw new DataIntegrityViolationException("duplicate UK");
            }
            keys.add(key);
            persisted.add(m);
            return m;
        }

        @Override
        public List<GoalMilestone> findByGoalId(UUID goalId) {
            return persisted.stream().filter(m -> m.getGoalId().equals(goalId)).toList();
        }

        @Override
        public Optional<GoalMilestone> findByGoalIdAndPercent(UUID goalId, int percent) {
            return persisted.stream()
                    .filter(m -> m.getGoalId().equals(goalId) && m.getPercent() == percent)
                    .findFirst();
        }

        @Override
        public boolean existsByGoalIdAndPercent(UUID goalId, int percent) {
            return keys.contains(goalId + ":" + percent);
        }
    }
}
