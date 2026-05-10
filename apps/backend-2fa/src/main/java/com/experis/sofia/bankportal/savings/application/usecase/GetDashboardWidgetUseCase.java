package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.WidgetDto;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.WidgetDto.WidgetGoalSummary;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * US-024-08: widget de dashboard con resumen agregado de objetivos ACTIVE.
 * RN-F024-15 (top 3 por progreso descendente).
 */
@Service
public class GetDashboardWidgetUseCase {

    private static final int TOP_GOALS_LIMIT = 3;

    private final SavingsGoalRepositoryPort goalRepo;

    public GetDashboardWidgetUseCase(SavingsGoalRepositoryPort goalRepo) {
        this.goalRepo = goalRepo;
    }

    public WidgetDto execute(UUID userId) {
        List<SavingsGoal> active = goalRepo.findByUserIdAndStatus(userId, GoalStatus.ACTIVE);
        if (active.isEmpty()) {
            return new WidgetDto(0, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, List.of());
        }

        BigDecimal totalReserved = active.stream()
            .map(g -> g.getReservedAmount() == null ? BigDecimal.ZERO : g.getReservedAmount())
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalTarget = active.stream()
            .map(g -> g.getTargetAmount() == null ? BigDecimal.ZERO : g.getTargetAmount())
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal globalPct = totalTarget.signum() == 0
            ? BigDecimal.ZERO
            : totalReserved.multiply(BigDecimal.valueOf(100))
                .divide(totalTarget, 2, RoundingMode.HALF_UP);

        List<WidgetGoalSummary> top = active.stream()
            .sorted(Comparator.comparing(SavingsGoal::progressPercent).reversed())
            .limit(TOP_GOALS_LIMIT)
            .map(g -> new WidgetGoalSummary(g.getId(), g.getName(), g.getIcon(), g.progressPercent()))
            .toList();

        return new WidgetDto(active.size(), totalReserved, totalTarget, globalPct, top);
    }
}
