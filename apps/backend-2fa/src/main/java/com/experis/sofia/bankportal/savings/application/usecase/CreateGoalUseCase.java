package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.CreateGoalRequest;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.SavingsGoalDto;
import com.experis.sofia.bankportal.savings.domain.exception.MaxGoalsReachedException;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.service.GoalProjectionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * US-024-01: crear nuevo objetivo de ahorro.
 * RN-F024-01 (max 10 ACTIVE), RN-F024-02 (rangos), RN-F024-07 (categoria).
 */
@Service
public class CreateGoalUseCase {

    private static final int MAX_ACTIVE_GOALS = 10;

    private final SavingsGoalRepositoryPort goalRepo;
    private final GoalProjectionService projectionService;

    public CreateGoalUseCase(SavingsGoalRepositoryPort goalRepo,
                              GoalProjectionService projectionService) {
        this.goalRepo = goalRepo;
        this.projectionService = projectionService;
    }

    @Transactional
    public SavingsGoalDto execute(UUID userId, CreateGoalRequest req) {
        long activeCount = goalRepo.countByUserIdAndStatus(userId, GoalStatus.ACTIVE);
        if (activeCount >= MAX_ACTIVE_GOALS) {
            throw new MaxGoalsReachedException();
        }

        SavingsGoal goal = new SavingsGoal();
        goal.setId(UUID.randomUUID());
        goal.setUserId(userId);
        goal.setName(req.name());
        goal.setTargetAmount(req.targetAmount().setScale(2, java.math.RoundingMode.HALF_UP));
        goal.setReservedAmount(BigDecimal.ZERO);
        goal.setTargetDate(req.targetDate());
        goal.setCategory(req.category());
        goal.setCustomCategory(req.customCategory());
        goal.setIcon(req.icon());
        goal.setColor(req.color());
        goal.setStatus(GoalStatus.ACTIVE);
        goal.setSourceAccountId(req.sourceAccountId());
        Instant now = Instant.now();
        goal.setCreatedAt(now);
        goal.setUpdatedAt(now);

        SavingsGoal saved = goalRepo.save(goal);
        return toDto(saved);
    }

    private SavingsGoalDto toDto(SavingsGoal g) {
        LocalDate today = LocalDate.now();
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
