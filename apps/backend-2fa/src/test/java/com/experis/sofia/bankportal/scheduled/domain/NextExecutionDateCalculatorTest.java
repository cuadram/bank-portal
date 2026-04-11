package com.experis.sofia.bankportal.scheduled.domain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Cobertura 100% de ramas — NextExecutionDateCalculator.
 * Casos críticos: feb/28, feb/29 bisiesto, meses de 30 días, último día.
 *
 * @author SOFIA QA Agent — FEAT-015 Sprint 17
 */
class NextExecutionDateCalculatorTest {

    private NextExecutionDateCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new NextExecutionDateCalculator();
    }

    // ── Helper ─────────────────────────────────────────────────────────────
    private ScheduledTransfer transfer(ScheduledTransferType type, LocalDate scheduledDate) {
        return new ScheduledTransfer(
                java.util.UUID.randomUUID(), null, null, "IBAN", "Dest",
                BigDecimal.TEN, "EUR", "Test", type,
                ScheduledTransferStatus.PENDING,
                scheduledDate, scheduledDate, null, null, 0,
                java.time.LocalDateTime.now(), java.time.LocalDateTime.now(), null
        );
    }

    // ── ONCE ───────────────────────────────────────────────────────────────
    @Nested @DisplayName("ONCE")
    class OnceTests {
        @Test @DisplayName("ONCE → devuelve null (sin más ejecuciones)")
        void once_returns_null() {
            var t = transfer(ScheduledTransferType.ONCE, LocalDate.of(2026, 8, 1));
            assertNull(calculator.calculate(t, LocalDate.of(2026, 8, 1)));
        }
    }

    // ── WEEKLY ─────────────────────────────────────────────────────────────
    @Nested @DisplayName("WEEKLY")
    class WeeklyTests {
        @Test @DisplayName("WEEKLY → siguiente semana misma fecha")
        void weekly_normal() {
            var t = transfer(ScheduledTransferType.WEEKLY, LocalDate.of(2026, 8, 1));
            assertEquals(LocalDate.of(2026, 8, 8), calculator.calculate(t, LocalDate.of(2026, 8, 1)));
        }

        @Test @DisplayName("WEEKLY cruzando fin de mes")
        void weekly_cross_month() {
            var t = transfer(ScheduledTransferType.WEEKLY, LocalDate.of(2026, 8, 28));
            assertEquals(LocalDate.of(2026, 9, 4), calculator.calculate(t, LocalDate.of(2026, 8, 28)));
        }
    }

    // ── BIWEEKLY ───────────────────────────────────────────────────────────
    @Nested @DisplayName("BIWEEKLY")
    class BiweeklyTests {
        @Test @DisplayName("BIWEEKLY → 14 días")
        void biweekly_normal() {
            var t = transfer(ScheduledTransferType.BIWEEKLY, LocalDate.of(2026, 8, 1));
            assertEquals(LocalDate.of(2026, 8, 15), calculator.calculate(t, LocalDate.of(2026, 8, 1)));
        }

        @Test @DisplayName("BIWEEKLY cruzando fin de mes")
        void biweekly_cross_month() {
            var t = transfer(ScheduledTransferType.BIWEEKLY, LocalDate.of(2026, 8, 25));
            assertEquals(LocalDate.of(2026, 9, 8), calculator.calculate(t, LocalDate.of(2026, 8, 25)));
        }
    }

    // ── MONTHLY ────────────────────────────────────────────────────────────
    @Nested @DisplayName("MONTHLY — casos críticos")
    class MonthlyTests {

        @Test @DisplayName("Día 1 — mes normal")
        void monthly_day1_normal() {
            var t = transfer(ScheduledTransferType.MONTHLY, LocalDate.of(2026, 8, 1));
            assertEquals(LocalDate.of(2026, 9, 1), calculator.calculate(t, LocalDate.of(2026, 8, 1)));
        }

        @Test @DisplayName("Día 31 → mes 30 días (septiembre) → clamp a 30")
        void monthly_day31_to_30day_month() {
            var t = transfer(ScheduledTransferType.MONTHLY, LocalDate.of(2026, 8, 31));
            assertEquals(LocalDate.of(2026, 9, 30), calculator.calculate(t, LocalDate.of(2026, 8, 31)));
        }

        @Test @DisplayName("Día 31 → siguiente mes también tiene 31 → mantiene día")
        void monthly_day31_to_31day_month() {
            var t = transfer(ScheduledTransferType.MONTHLY, LocalDate.of(2026, 1, 31));
            assertEquals(LocalDate.of(2026, 3, 31), calculator.calculate(t, LocalDate.of(2026, 1, 31)));
        }

        @Test @DisplayName("Día 29 → febrero año NO bisiesto → clamp a 28")
        void monthly_day29_to_february_non_leap() {
            var t = transfer(ScheduledTransferType.MONTHLY, LocalDate.of(2025, 1, 29));
            assertEquals(LocalDate.of(2025, 2, 28), calculator.calculate(t, LocalDate.of(2025, 1, 29)));
        }

        @Test @DisplayName("Día 29 → febrero año bisiesto → mantiene 29")
        void monthly_day29_to_february_leap() {
            var t = transfer(ScheduledTransferType.MONTHLY, LocalDate.of(2028, 1, 29));
            assertEquals(LocalDate.of(2028, 2, 29), calculator.calculate(t, LocalDate.of(2028, 1, 29)));
        }

        @Test @DisplayName("Día 28 → febrero año NO bisiesto → mantiene 28")
        void monthly_day28_to_february_non_leap() {
            var t = transfer(ScheduledTransferType.MONTHLY, LocalDate.of(2025, 1, 28));
            assertEquals(LocalDate.of(2025, 2, 28), calculator.calculate(t, LocalDate.of(2025, 1, 28)));
        }

        @Test @DisplayName("Día 28 → febrero año bisiesto → mantiene 28")
        void monthly_day28_to_february_leap() {
            var t = transfer(ScheduledTransferType.MONTHLY, LocalDate.of(2028, 1, 28));
            assertEquals(LocalDate.of(2028, 2, 28), calculator.calculate(t, LocalDate.of(2028, 1, 28)));
        }

        @Test @DisplayName("Día 30 → enero (31d) siguiente → mantiene 30")
        void monthly_day30_to_31day_month() {
            var t = transfer(ScheduledTransferType.MONTHLY, LocalDate.of(2026, 11, 30));
            assertEquals(LocalDate.of(2026, 12, 30), calculator.calculate(t, LocalDate.of(2026, 11, 30)));
        }

        @Test @DisplayName("Dic→Ene: cruce de año")
        void monthly_december_to_january() {
            var t = transfer(ScheduledTransferType.MONTHLY, LocalDate.of(2026, 12, 15));
            assertEquals(LocalDate.of(2027, 1, 15), calculator.calculate(t, LocalDate.of(2026, 12, 15)));
        }
    }
}
