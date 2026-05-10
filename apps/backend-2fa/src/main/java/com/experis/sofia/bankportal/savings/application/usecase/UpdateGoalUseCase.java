package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.SavingsGoalDto;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.UpdateGoalRequest;
import com.experis.sofia.bankportal.savings.domain.exception.GoalAccessDeniedException;
import com.experis.sofia.bankportal.savings.domain.exception.GoalNotFoundException;
import com.experis.sofia.bankportal.savings.domain.exception.ReservedExceedsTargetException;
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
 * US-024-06: actualizar objetivo (rename, ajuste target, cambio fecha, pausar/reanudar).
 * RN-F024-11 (pausa/reanudacion).
 */
@Service
public class UpdateGoalUseCase {

    private final SavingsGoalRepositoryPort goalRepo;
    private final GoalProjectionService projectionService;

    public UpdateGoalUseCase(SavingsGoalRepositoryPort goalRepo,
                              GoalProjectionService projectionService) {
        this.goalRepo = goalRepo;
        this.projectionService = projectionService;
    }

    @Transactional
    public SavingsGoalDto execute(UUID userId, UUID goalId, UpdateGoalRequest req) {
        SavingsGoal goal = goalRepo.findById(goalId).orElseThrow(GoalNotFoundException::new);
        if (!goal.getUserId().equals(userId)) {
            throw new GoalAccessDeniedException();
        }
        if (goal.getStatus() == GoalStatus.CLOSED) {
            throw new IllegalStateException("Objetivo cerrado no editable");
        }

        if (req.name() != null) goal.setName(req.name());
        if (req.targetAmount() != null) {
            BigDecimal newTarget = req.targetAmount().setScale(2, java.math.RoundingMode.HALF_UP);
            if (goal.getReservedAmount() != null && newTarget.compareTo(goal.getReservedAmount()) < 0) {
                throw new ReservedExceedsTargetException(
                    "El nuevo target " + newTarget + " es inferior al reservado actual " + goal.getReservedAmount());
            }
            goal.setTargetAmount(newTarget);
        }
        if (req.targetDate() != null) goal.setTargetDate(req.targetDate());
        if (req.status() != null) {
            // Solo se permite alternar entre ACTIVE y PAUSED via update; CLOSED se hace via Close
            if (req.status() != GoalStatus.ACTIVE && req.status() != GoalStatus.PAUSED) {
                throw new IllegalArgumentException("status solo admite ACTIVE o PAUSED via update");
            }
            goal.setStatus(req.status());
        }
        goal.setUpdatedAt(Instant.now());
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
