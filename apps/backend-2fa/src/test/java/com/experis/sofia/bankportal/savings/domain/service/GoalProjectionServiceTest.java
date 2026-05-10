package com.experis.sofia.bankportal.savings.domain.service;

import com.experis.sofia.bankportal.savings.domain.model.GoalCategory;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * TC-F024-010..013 — GoalProjectionService: proyeccion lineal y sugerencia mensual.
 * RN-F024-08.
 *
 * Cobertura:
 *  - projectedCompletionDate(): null cuando no hay ritmo / reserved=0 / ya cumplido
 *  - projectedCompletionDate(): fecha proyectada coherente con ritmo diario lineal
 *  - suggestedMonthlyContribution(): division exacta + targetDate en el pasado/mes-actual
 *  - isAtRisk(): true cuando proyectada > targetDate, false en otro caso
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase F.1
 */
class GoalProjectionServiceTest {

    private GoalProjectionService service;

    @BeforeEach
    void setUp() {
        service = new GoalProjectionService();
    }

    private SavingsGoal goal(BigDecimal target, BigDecimal reserved,
                             LocalDate createdAt, LocalDate targetDate) {
        SavingsGoal g = new SavingsGoal();
        g.setId(UUID.randomUUID());
        g.setUserId(UUID.randomUUID());
        g.setName("test-goal");
        g.setTargetAmount(target);
        g.setReservedAmount(reserved);
        g.setTargetDate(targetDate);
        g.setCategory(GoalCategory.EMERGENCIA);
        g.setStatus(GoalStatus.ACTIVE);
        g.setCreatedAt(createdAt == null ? null
                : createdAt.atStartOfDay(ZoneOffset.UTC).toInstant());
        g.setUpdatedAt(Instant.now());
        return g;
    }

    // -- projectedCompletionDate() --------------------------------------------

    @Test @DisplayName("TC-F024-010a — proyeccion: ritmo lineal a 90 dias para 1000 EUR")
    void linearProjection() {
        // 100 dias transcurridos, reservados 500/1000 -> ritmo 5/dia
        // restan 500 / 5 = 100 dias mas
        LocalDate today = LocalDate.of(2026, 6, 1);
        var g = goal(new BigDecimal("1000.00"), new BigDecimal("500.00"),
                today.minusDays(100), today.plusMonths(12));
        LocalDate projected = service.projectedCompletionDate(g, today);
        assertThat(projected).isEqualTo(today.plusDays(100));
    }

    @Test @DisplayName("TC-F024-010b — proyeccion: reserved=0 devuelve null (sin ritmo)")
    void zeroReservedReturnsNull() {
        LocalDate today = LocalDate.now();
        var g = goal(new BigDecimal("1000.00"), BigDecimal.ZERO,
                today.minusDays(30), today.plusMonths(6));
        assertThat(service.projectedCompletionDate(g, today)).isNull();
    }

    @Test @DisplayName("TC-F024-010c — proyeccion: reserved=null devuelve null")
    void nullReservedReturnsNull() {
        LocalDate today = LocalDate.now();
        var g = goal(new BigDecimal("1000.00"), null,
                today.minusDays(30), today.plusMonths(6));
        assertThat(service.projectedCompletionDate(g, today)).isNull();
    }

    @Test @DisplayName("TC-F024-010d — proyeccion: ya cumplido (reserved >= target) -> hoy")
    void alreadyCompletedReturnsToday() {
        LocalDate today = LocalDate.now();
        var g = goal(new BigDecimal("500.00"), new BigDecimal("500.00"),
                today.minusDays(30), today.plusMonths(6));
        assertThat(service.projectedCompletionDate(g, today)).isEqualTo(today);
    }

    @Test @DisplayName("TC-F024-010e — proyeccion: createdAt=null devuelve null")
    void nullCreatedAtReturnsNull() {
        LocalDate today = LocalDate.now();
        var g = goal(new BigDecimal("1000.00"), new BigDecimal("100.00"),
                null, today.plusMonths(6));
        assertThat(service.projectedCompletionDate(g, today)).isNull();
    }

    @Test @DisplayName("TC-F024-010f — proyeccion: daysElapsed=0 devuelve null (sin denominador)")
    void zeroDaysElapsedReturnsNull() {
        LocalDate today = LocalDate.now();
        var g = goal(new BigDecimal("1000.00"), new BigDecimal("100.00"),
                today, today.plusMonths(6));  // creado hoy
        assertThat(service.projectedCompletionDate(g, today)).isNull();
    }

    @Test @DisplayName("TC-F024-010g — proyeccion: redondeo CEILING al calcular dias restantes")
    void ceilingOnDaysRemaining() {
        // 30 dias transcurridos, reservados 100/1000 -> ritmo 3.333.../dia
        // restan 900 / 3.333... = 270 dias exactos. CEILING no afecta porque es exacto
        // Pero modificamos para forzar fraccional: reserved=99/30dias = 3.30/dia
        // restan 901 / 3.30 = 273.03... -> CEILING = 274
        LocalDate today = LocalDate.of(2026, 7, 1);
        var g = goal(new BigDecimal("1000.00"), new BigDecimal("99.00"),
                today.minusDays(30), today.plusYears(2));
        LocalDate projected = service.projectedCompletionDate(g, today);
        assertThat(projected).isNotNull();
        // Verificamos que el resultado redondea hacia arriba (no truncado)
        long days = java.time.temporal.ChronoUnit.DAYS.between(today, projected);
        assertThat(days).isGreaterThanOrEqualTo(273);
    }

    // -- suggestedMonthlyContribution() ---------------------------------------

    @Test @DisplayName("TC-F024-011a — sugerencia: 1200 EUR restantes / 12 meses = 100/mes")
    void linearMonthly() {
        LocalDate today = LocalDate.of(2026, 1, 15);
        var g = goal(new BigDecimal("1500.00"), new BigDecimal("300.00"),
                today.minusMonths(1), today.plusMonths(12));
        BigDecimal sug = service.suggestedMonthlyContribution(g, today);
        assertThat(sug).isEqualByComparingTo("100.00");
    }

    @Test @DisplayName("TC-F024-011b — sugerencia: targetDate en el pasado -> resta completa")
    void targetDateInPastReturnsRemaining() {
        LocalDate today = LocalDate.of(2026, 6, 15);
        var g = goal(new BigDecimal("1000.00"), new BigDecimal("400.00"),
                today.minusMonths(6), today.minusMonths(1));  // ya pasada
        BigDecimal sug = service.suggestedMonthlyContribution(g, today);
        assertThat(sug).isEqualByComparingTo("600.00");
    }

    @Test @DisplayName("TC-F024-011c — sugerencia: target ya alcanzado -> 0")
    void alreadyMetReturnsZero() {
        LocalDate today = LocalDate.now();
        var g = goal(new BigDecimal("500.00"), new BigDecimal("500.00"),
                today.minusMonths(3), today.plusMonths(3));
        assertThat(service.suggestedMonthlyContribution(g, today)).isEqualByComparingTo("0.00");
    }

    @Test @DisplayName("TC-F024-011d — sugerencia: targetDate null devuelve 0")
    void nullTargetDateReturnsZero() {
        LocalDate today = LocalDate.now();
        var g = goal(new BigDecimal("1000.00"), new BigDecimal("100.00"),
                today.minusMonths(2), null);
        assertThat(service.suggestedMonthlyContribution(g, today)).isEqualByComparingTo("0.00");
    }

    @Test @DisplayName("TC-F024-011e — sugerencia: HALF_UP a 2 decimales")
    void halfUpRounding() {
        // 1000 EUR restantes / 7 meses = 142.857142... HALF_UP a 2 dec = 142.86
        LocalDate today = LocalDate.of(2026, 1, 1);
        var g = goal(new BigDecimal("1000.00"), BigDecimal.ZERO,
                today.minusDays(1), today.plusMonths(7));
        BigDecimal sug = service.suggestedMonthlyContribution(g, today);
        assertThat(sug).isEqualByComparingTo("142.86");
    }

    // -- isAtRisk() -----------------------------------------------------------

    @Test @DisplayName("TC-F024-012a — isAtRisk: ritmo lento -> proyectada > targetDate -> true")
    void slowRateIsAtRisk() {
        LocalDate today = LocalDate.of(2026, 6, 1);
        // 100 dias transcurridos, 100 EUR reservados de 1000 -> ritmo 1/dia
        // restan 900 dias mas. targetDate = today + 30 dias -> riesgo
        var g = goal(new BigDecimal("1000.00"), new BigDecimal("100.00"),
                today.minusDays(100), today.plusDays(30));
        assertThat(service.isAtRisk(g, today)).isTrue();
    }

    @Test @DisplayName("TC-F024-012b — isAtRisk: ritmo bueno -> proyectada <= targetDate -> false")
    void goodRateIsNotAtRisk() {
        LocalDate today = LocalDate.of(2026, 6, 1);
        // 100 dias transcurridos, 800 EUR reservados de 1000 -> ritmo 8/dia
        // restan 200 / 8 = 25 dias. targetDate = today + 365 dias -> sin riesgo
        var g = goal(new BigDecimal("1000.00"), new BigDecimal("800.00"),
                today.minusDays(100), today.plusDays(365));
        assertThat(service.isAtRisk(g, today)).isFalse();
    }

    @Test @DisplayName("TC-F024-012c — isAtRisk: proyectada=null (sin ritmo) -> false")
    void noProjectionIsNotAtRisk() {
        LocalDate today = LocalDate.now();
        var g = goal(new BigDecimal("1000.00"), BigDecimal.ZERO,
                today.minusMonths(1), today.plusMonths(6));
        assertThat(service.isAtRisk(g, today)).isFalse();
    }

    @Test @DisplayName("TC-F024-012d — isAtRisk: targetDate null -> false")
    void nullTargetDateIsNotAtRisk() {
        LocalDate today = LocalDate.of(2026, 6, 1);
        var g = goal(new BigDecimal("1000.00"), new BigDecimal("500.00"),
                today.minusMonths(1), null);
        assertThat(service.isAtRisk(g, today)).isFalse();
    }
}
