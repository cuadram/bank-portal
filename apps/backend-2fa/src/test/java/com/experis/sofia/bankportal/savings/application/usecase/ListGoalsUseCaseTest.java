package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.SavingsGoalDto;
import com.experis.sofia.bankportal.savings.domain.model.GoalCategory;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.service.GoalProjectionService;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * TC-F024-025..028 — ListGoalsUseCase.
 * RN-F024-08 (filtro por estado, default todos).
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase F.3
 */
@ExtendWith(MockitoExtension.class)
class ListGoalsUseCaseTest {

    @Mock SavingsGoalRepositoryPort goalRepo;
    @Mock GoalProjectionService projectionService;

    @InjectMocks ListGoalsUseCase useCase;

    private final UUID userId = UUID.randomUUID();

    private SavingsGoal sampleGoal(String name, GoalStatus status, BigDecimal reserved, BigDecimal target) {
        SavingsGoal g = new SavingsGoal();
        g.setId(UUID.randomUUID());
        g.setUserId(userId);
        g.setName(name);
        g.setTargetAmount(target);
        g.setReservedAmount(reserved);
        g.setTargetDate(LocalDate.now().plusMonths(6));
        g.setCategory(GoalCategory.VIAJE);
        g.setStatus(status);
        g.setCreatedAt(Instant.now());
        g.setUpdatedAt(Instant.now());
        return g;
    }

    @Test @DisplayName("TC-F024-025 — status=null usa findByUserId (todos los estados)")
    void nullStatusFetchesAll() {
        var g1 = sampleGoal("g1", GoalStatus.ACTIVE, BigDecimal.ZERO, new BigDecimal("1000"));
        var g2 = sampleGoal("g2", GoalStatus.PAUSED, new BigDecimal("100"), new BigDecimal("500"));
        var g3 = sampleGoal("g3", GoalStatus.CLOSED, new BigDecimal("500"), new BigDecimal("500"));
        when(goalRepo.findByUserId(userId)).thenReturn(List.of(g1, g2, g3));
        when(projectionService.suggestedMonthlyContribution(any(), any())).thenReturn(BigDecimal.ZERO);
        when(projectionService.isAtRisk(any(), any())).thenReturn(false);

        List<SavingsGoalDto> result = useCase.execute(userId, null);

        assertThat(result).hasSize(3);
        assertThat(result).extracting(SavingsGoalDto::name).containsExactly("g1", "g2", "g3");
        verify(goalRepo).findByUserId(userId);
        verify(goalRepo, never()).findByUserIdAndStatus(any(), any());
    }

    @Test @DisplayName("TC-F024-026 — status=ACTIVE usa findByUserIdAndStatus")
    void activeStatusFiltersByStatus() {
        var g1 = sampleGoal("g1", GoalStatus.ACTIVE, new BigDecimal("100"), new BigDecimal("1000"));
        when(goalRepo.findByUserIdAndStatus(userId, GoalStatus.ACTIVE)).thenReturn(List.of(g1));
        when(projectionService.suggestedMonthlyContribution(any(), any())).thenReturn(BigDecimal.ZERO);
        when(projectionService.isAtRisk(any(), any())).thenReturn(false);

        List<SavingsGoalDto> result = useCase.execute(userId, GoalStatus.ACTIVE);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).status()).isEqualTo(GoalStatus.ACTIVE);
        verify(goalRepo).findByUserIdAndStatus(userId, GoalStatus.ACTIVE);
        verify(goalRepo, never()).findByUserId(any());
    }

    @Test @DisplayName("TC-F024-027 — usuario sin objetivos: devuelve lista vacia")
    void emptyResult() {
        when(goalRepo.findByUserId(userId)).thenReturn(List.of());

        List<SavingsGoalDto> result = useCase.execute(userId, null);
        assertThat(result).isEmpty();
        verify(projectionService, never()).suggestedMonthlyContribution(any(), any());
        verify(projectionService, never()).isAtRisk(any(), any());
    }

    @Test @DisplayName("TC-F024-028 — DTO incluye progressPct y suggested + risk del projectionService")
    void dtoIncludesProjectionFields() {
        var g = sampleGoal("g", GoalStatus.ACTIVE, new BigDecimal("250.00"), new BigDecimal("1000.00"));
        when(goalRepo.findByUserId(userId)).thenReturn(List.of(g));
        when(projectionService.suggestedMonthlyContribution(any(), any())).thenReturn(new BigDecimal("125.00"));
        when(projectionService.isAtRisk(any(), any())).thenReturn(true);

        List<SavingsGoalDto> result = useCase.execute(userId, null);

        SavingsGoalDto dto = result.get(0);
        assertThat(dto.progressPct()).isEqualByComparingTo("25.00");  // 250/1000 = 25%
        assertThat(dto.suggestedMonthlyContribution()).isEqualByComparingTo("125.00");
        assertThat(dto.projectionRisk()).isTrue();
    }
}
