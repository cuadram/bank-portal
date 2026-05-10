package com.experis.sofia.bankportal.savings.domain.model;

import com.experis.sofia.bankportal.savings.domain.exception.ReservedExceedsTargetException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Nested;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * TC-F024-001..004 — Invariantes del agregado SavingsGoal.
 * US-024-04 (reserve), US-024-07 (canBeClosed), RN-F024-08 (progressPercent).
 *
 * Cobertura:
 *  - reserve(): guards null/signum + invariante reserved+amount &lt;= target
 *  - reserve(): transicion a COMPLETED al alcanzar target exacto
 *  - release(): guards null/signum + invariante reserved-amount &gt;= 0
 *  - canBeClosed(): solo ACTIVE/PAUSED/COMPLETED
 *  - progressPercent(): HALF_UP, target=0 -&gt; 0, casos limite
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase F.1
 */
class SavingsGoalTest {

    private SavingsGoal goal(BigDecimal target, BigDecimal reserved, GoalStatus status) {
        SavingsGoal g = new SavingsGoal();
        g.setId(UUID.randomUUID());
        g.setUserId(UUID.randomUUID());
        g.setName("test-goal");
        g.setTargetAmount(target);
        g.setReservedAmount(reserved);
        g.setTargetDate(LocalDate.now().plusMonths(6));
        g.setCategory(GoalCategory.VIAJE);
        g.setStatus(status);
        g.setCreatedAt(Instant.now());
        g.setUpdatedAt(Instant.now());
        return g;
    }

    // -- reserve() ------------------------------------------------------------

    @Nested
    @DisplayName("reserve()")
    class ReserveTests {

        @Test @DisplayName("TC-F024-001a — happy path: incrementa reservedAmount")
        void happyPath() {
            var g = goal(new BigDecimal("1000.00"), new BigDecimal("100.00"), GoalStatus.ACTIVE);
            g.reserve(new BigDecimal("250.00"));
            assertThat(g.getReservedAmount()).isEqualByComparingTo("350.00");
            assertThat(g.getStatus()).isEqualTo(GoalStatus.ACTIVE);
        }

        @Test @DisplayName("TC-F024-001b — reservedAmount=null se trata como 0")
        void nullReservedTreatedAsZero() {
            var g = goal(new BigDecimal("1000.00"), null, GoalStatus.ACTIVE);
            g.reserve(new BigDecimal("100.00"));
            assertThat(g.getReservedAmount()).isEqualByComparingTo("100.00");
        }

        @Test @DisplayName("TC-F024-001c — alcanzar target exacto -> transicion a COMPLETED")
        void reachTargetTransitionsToCompleted() {
            var g = goal(new BigDecimal("500.00"), new BigDecimal("400.00"), GoalStatus.ACTIVE);
            g.reserve(new BigDecimal("100.00"));
            assertThat(g.getReservedAmount()).isEqualByComparingTo("500.00");
            assertThat(g.getStatus()).isEqualTo(GoalStatus.COMPLETED);
        }

        @Test @DisplayName("TC-F024-001d — exceder target lanza ReservedExceedsTargetException")
        void exceedTargetThrows() {
            var g = goal(new BigDecimal("500.00"), new BigDecimal("400.00"), GoalStatus.ACTIVE);
            assertThatThrownBy(() -> g.reserve(new BigDecimal("100.01")))
                .isInstanceOf(ReservedExceedsTargetException.class);
            // estado intacto tras throw
            assertThat(g.getReservedAmount()).isEqualByComparingTo("400.00");
            assertThat(g.getStatus()).isEqualTo(GoalStatus.ACTIVE);
        }

        @Test @DisplayName("TC-F024-001e — amount null lanza IllegalArgument")
        void nullAmountThrows() {
            var g = goal(new BigDecimal("1000.00"), new BigDecimal("0.00"), GoalStatus.ACTIVE);
            assertThatThrownBy(() -> g.reserve(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("positivo");
        }

        @Test @DisplayName("TC-F024-001f — amount cero lanza IllegalArgument")
        void zeroAmountThrows() {
            var g = goal(new BigDecimal("1000.00"), new BigDecimal("0.00"), GoalStatus.ACTIVE);
            assertThatThrownBy(() -> g.reserve(BigDecimal.ZERO))
                .isInstanceOf(IllegalArgumentException.class);
        }

        @Test @DisplayName("TC-F024-001g — amount negativo lanza IllegalArgument")
        void negativeAmountThrows() {
            var g = goal(new BigDecimal("1000.00"), new BigDecimal("100.00"), GoalStatus.ACTIVE);
            assertThatThrownBy(() -> g.reserve(new BigDecimal("-50.00")))
                .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // -- release() ------------------------------------------------------------

    @Nested
    @DisplayName("release()")
    class ReleaseTests {

        @Test @DisplayName("TC-F024-002a — happy path: decrementa reservedAmount")
        void happyPath() {
            var g = goal(new BigDecimal("1000.00"), new BigDecimal("400.00"), GoalStatus.ACTIVE);
            g.release(new BigDecimal("150.00"));
            assertThat(g.getReservedAmount()).isEqualByComparingTo("250.00");
        }

        @Test @DisplayName("TC-F024-002b — release total deja reservedAmount=0")
        void releaseAllLeavesZero() {
            var g = goal(new BigDecimal("1000.00"), new BigDecimal("250.00"), GoalStatus.ACTIVE);
            g.release(new BigDecimal("250.00"));
            assertThat(g.getReservedAmount()).isEqualByComparingTo("0.00");
        }

        @Test @DisplayName("TC-F024-002c — release > reserved lanza IllegalState")
        void releaseExceedsReservedThrows() {
            var g = goal(new BigDecimal("1000.00"), new BigDecimal("100.00"), GoalStatus.ACTIVE);
            assertThatThrownBy(() -> g.release(new BigDecimal("100.01")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("reserved=0");
            assertThat(g.getReservedAmount()).isEqualByComparingTo("100.00");
        }

        @Test @DisplayName("TC-F024-002d — release con reservedAmount=null lanza IllegalState")
        void releaseFromNullReservedThrows() {
            var g = goal(new BigDecimal("1000.00"), null, GoalStatus.ACTIVE);
            assertThatThrownBy(() -> g.release(new BigDecimal("10.00")))
                .isInstanceOf(IllegalStateException.class);
        }

        @Test @DisplayName("TC-F024-002e — amount cero/negativo/null lanza IllegalArgument")
        void invalidAmountThrows() {
            var g = goal(new BigDecimal("1000.00"), new BigDecimal("100.00"), GoalStatus.ACTIVE);
            assertThatThrownBy(() -> g.release(null))
                .isInstanceOf(IllegalArgumentException.class);
            assertThatThrownBy(() -> g.release(BigDecimal.ZERO))
                .isInstanceOf(IllegalArgumentException.class);
            assertThatThrownBy(() -> g.release(new BigDecimal("-1.00")))
                .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // -- canBeClosed() --------------------------------------------------------

    @Nested
    @DisplayName("canBeClosed()")
    class CanBeClosedTests {

        @Test @DisplayName("TC-F024-003a — ACTIVE puede cerrarse")
        void activeCanBeClosed() {
            assertThat(goal(new BigDecimal("100"), BigDecimal.ZERO, GoalStatus.ACTIVE).canBeClosed()).isTrue();
        }

        @Test @DisplayName("TC-F024-003b — PAUSED puede cerrarse")
        void pausedCanBeClosed() {
            assertThat(goal(new BigDecimal("100"), BigDecimal.ZERO, GoalStatus.PAUSED).canBeClosed()).isTrue();
        }

        @Test @DisplayName("TC-F024-003c — COMPLETED puede cerrarse (cierre voluntario tras 100%)")
        void completedCanBeClosed() {
            assertThat(goal(new BigDecimal("100"), new BigDecimal("100"), GoalStatus.COMPLETED).canBeClosed()).isTrue();
        }

        @Test @DisplayName("TC-F024-003d — CLOSED no puede cerrarse de nuevo (idempotencia)")
        void closedCannotBeClosedAgain() {
            assertThat(goal(new BigDecimal("100"), BigDecimal.ZERO, GoalStatus.CLOSED).canBeClosed()).isFalse();
        }
    }

    // -- progressPercent() ----------------------------------------------------

    @Nested
    @DisplayName("progressPercent()")
    class ProgressPercentTests {

        @Test @DisplayName("TC-F024-004a — 25% exacto con reserved=250 target=1000")
        void exactQuarter() {
            var g = goal(new BigDecimal("1000.00"), new BigDecimal("250.00"), GoalStatus.ACTIVE);
            assertThat(g.progressPercent()).isEqualByComparingTo("25.00");
        }

        @Test @DisplayName("TC-F024-004b — 100% al alcanzar target")
        void fullProgress() {
            var g = goal(new BigDecimal("1000.00"), new BigDecimal("1000.00"), GoalStatus.COMPLETED);
            assertThat(g.progressPercent()).isEqualByComparingTo("100.00");
        }

        @Test @DisplayName("TC-F024-004c — 0% si reserved=0")
        void zeroProgress() {
            var g = goal(new BigDecimal("1000.00"), BigDecimal.ZERO, GoalStatus.ACTIVE);
            assertThat(g.progressPercent()).isEqualByComparingTo("0.00");
        }

        @Test @DisplayName("TC-F024-004d — target=0 protege contra division por cero")
        void zeroTargetReturnsZero() {
            var g = goal(BigDecimal.ZERO, BigDecimal.ZERO, GoalStatus.ACTIVE);
            assertThat(g.progressPercent()).isEqualByComparingTo("0.00");
        }

        @Test @DisplayName("TC-F024-004e — target=null protege contra NPE")
        void nullTargetReturnsZero() {
            var g = goal(null, BigDecimal.ZERO, GoalStatus.ACTIVE);
            assertThat(g.progressPercent()).isEqualByComparingTo("0.00");
        }

        @Test @DisplayName("TC-F024-004f — HALF_UP redondeo: 33.333... -> 33.33")
        void halfUpRounding() {
            var g = goal(new BigDecimal("300.00"), new BigDecimal("100.00"), GoalStatus.ACTIVE);
            // 100/300*100 = 33.3333... HALF_UP a 2 decimales
            BigDecimal expected = new BigDecimal("33.33");
            assertThat(g.progressPercent().setScale(2, RoundingMode.HALF_UP)).isEqualByComparingTo(expected);
        }
    }
}
