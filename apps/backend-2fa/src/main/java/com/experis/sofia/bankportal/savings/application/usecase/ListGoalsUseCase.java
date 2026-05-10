package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.SavingsGoalDto;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.service.GoalProjectionService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * US-024-02: listar objetivos del usuario con progreso y proyeccion.
 * RN-F024-08, GDPR Art.15.
 */
@Service
public class ListGoalsUseCase {

    private final SavingsGoalRepositoryPort goalRepo;
    private final GoalProjectionService projectionService;

    public ListGoalsUseCase(SavingsGoalRepositoryPort goalRepo,
                             GoalProjectionService projectionService) {
        this.goalRepo = goalRepo;
        this.projectionService = projectionService;
    }

    /**
     * @param status filtro opcional (null = todos los estados del usuario)
     */
    public List<SavingsGoalDto> execute(UUID userId, GoalStatus status) {
        List<SavingsGoal> goals = (status == null)
            ? goalRepo.findByUserId(userId)
            : goalRepo.findByUserIdAndStatus(userId, status);

        LocalDate today = LocalDate.now();
        return goals.stream().map(g -> toDto(g, today)).toList();
    }

    private SavingsGoalDto toDto(SavingsGoal g, LocalDate today) {
        BigDecimal suggested = projectionService.suggestedMonthlyContribution(g, today);
        boolean risk = projectionService.isAtRisk(g, today);
        return new SavingsGoalDto(
            g.getId(), g.getName(), g.getTargetAmount(), g.getReservedAmount(),
            g.getTargetDate(), g.getCategory(), g.getCustomCategory(),
            g.getIcon(), g.getColor(), g.getStatus(), g.getSourceAccountId(),
            g.getCreatedAt(), g.progressPercent(), suggested, risk
        );
    }
}
