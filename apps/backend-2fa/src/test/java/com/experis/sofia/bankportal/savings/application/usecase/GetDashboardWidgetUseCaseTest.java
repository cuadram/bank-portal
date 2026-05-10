package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.WidgetDto;
import com.experis.sofia.bankportal.savings.domain.model.GoalCategory;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * TC-F024-080..083 — GetDashboardWidgetUseCase.
 * RN-F024-15 (top 3 por progressPercent descendente).
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase F.3
 */
@ExtendWith(MockitoExtension.class)
class GetDashboardWidgetUseCaseTest {

    @Mock SavingsGoalRepositoryPort goalRepo;

    @InjectMocks GetDashboardWidgetUseCase useCase;

    private final UUID userId = UUID.randomUUID();

    private SavingsGoal goal(String name, BigDecimal target, BigDecimal reserved) {
        SavingsGoal g = new SavingsGoal();
        g.setId(UUID.randomUUID());
        g.setUserId(userId);
        g.setName(name);
        g.setTargetAmount(target);
        g.setReservedAmount(reserved);
        g.setTargetDate(LocalDate.now().plusMonths(6));
        g.setCategory(GoalCategory.VIAJE);
        g.setIcon("icon");
        g.setStatus(GoalStatus.ACTIVE);
        g.setCreatedAt(Instant.now());
        g.setUpdatedAt(Instant.now());
        return g;
    }

    @Test @DisplayName("TC-F024-080 — usuario sin objetivos ACTIVE: widget vacio (0,0,0,0,[])")
    void emptyUser() {
        when(goalRepo.findByUserIdAndStatus(userId, GoalStatus.ACTIVE)).thenReturn(List.of());

        WidgetDto dto = useCase.execute(userId);

        assertThat(dto.activeGoalsCount()).isZero();
        assertThat(dto.totalReserved()).isEqualByComparingTo("0");
        assertThat(dto.totalTarget()).isEqualByComparingTo("0");
        assertThat(dto.globalProgressPct()).isEqualByComparingTo("0");
        assertThat(dto.topGoals()).isEmpty();
    }

    @Test @DisplayName("TC-F024-081 — totales agregados: 3 objetivos -> totales correctos + globalPct HALF_UP")
    void aggregatedTotals() {
        var g1 = goal("g1", new BigDecimal("1000.00"), new BigDecimal("250.00"));   // 25%
        var g2 = goal("g2", new BigDecimal("2000.00"), new BigDecimal("500.00"));   // 25%
        var g3 = goal("g3", new BigDecimal("500.00"),  new BigDecimal("100.00"));   // 20%
        when(goalRepo.findByUserIdAndStatus(userId, GoalStatus.ACTIVE)).thenReturn(List.of(g1, g2, g3));

        WidgetDto dto = useCase.execute(userId);

        assertThat(dto.activeGoalsCount()).isEqualTo(3);
        assertThat(dto.totalReserved()).isEqualByComparingTo("850.00");   // 250+500+100
        assertThat(dto.totalTarget()).isEqualByComparingTo("3500.00");    // 1000+2000+500
        // 850 / 3500 * 100 = 24.2857... HALF_UP a 2 dec = 24.29
        assertThat(dto.globalProgressPct()).isEqualByComparingTo("24.29");
    }

    @Test @DisplayName("TC-F024-082 — top 3 ordenados por progressPercent DESC (limite=3)")
    void topGoalsSortedByProgress() {
        var g_low  = goal("low",  new BigDecimal("1000.00"), new BigDecimal("100.00"));   // 10%
        var g_high = goal("high", new BigDecimal("1000.00"), new BigDecimal("900.00"));   // 90%
        var g_mid  = goal("mid",  new BigDecimal("1000.00"), new BigDecimal("500.00"));   // 50%
        var g_4    = goal("g4",   new BigDecimal("1000.00"), new BigDecimal("700.00"));   // 70%
        var g_5    = goal("g5",   new BigDecimal("1000.00"), new BigDecimal("300.00"));   // 30%
        when(goalRepo.findByUserIdAndStatus(userId, GoalStatus.ACTIVE))
            .thenReturn(List.of(g_low, g_high, g_mid, g_4, g_5));

        WidgetDto dto = useCase.execute(userId);

        assertThat(dto.topGoals()).hasSize(3);
        assertThat(dto.topGoals()).extracting(s -> s.name()).containsExactly("high", "g4", "mid");
        assertThat(dto.topGoals().get(0).progressPct()).isEqualByComparingTo("90.00");
        assertThat(dto.topGoals().get(2).progressPct()).isEqualByComparingTo("50.00");
    }

    @Test @DisplayName("TC-F024-083 — totalTarget=0: globalPct devuelve 0 sin division por cero")
    void zeroTargetProtection() {
        var g = goal("g", BigDecimal.ZERO, BigDecimal.ZERO);
        when(goalRepo.findByUserIdAndStatus(userId, GoalStatus.ACTIVE)).thenReturn(List.of(g));

        WidgetDto dto = useCase.execute(userId);

        assertThat(dto.activeGoalsCount()).isEqualTo(1);
        assertThat(dto.totalTarget()).isEqualByComparingTo("0");
        assertThat(dto.globalProgressPct()).isEqualByComparingTo("0");
    }
}
