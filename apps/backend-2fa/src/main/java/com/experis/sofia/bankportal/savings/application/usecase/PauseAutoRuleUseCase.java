package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.savings.domain.exception.GoalAccessDeniedException;
import com.experis.sofia.bankportal.savings.domain.exception.GoalNotFoundException;
import com.experis.sofia.bankportal.savings.domain.model.GoalAutoRule;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.GoalAutoRuleRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * US-024-04b: pausar regla automatica activa.
 * Idempotente: si no hay regla activa, devuelve sin error.
 */
@Service
public class PauseAutoRuleUseCase {

    private final SavingsGoalRepositoryPort goalRepo;
    private final GoalAutoRuleRepositoryPort ruleRepo;

    public PauseAutoRuleUseCase(SavingsGoalRepositoryPort goalRepo,
                                 GoalAutoRuleRepositoryPort ruleRepo) {
        this.goalRepo = goalRepo;
        this.ruleRepo = ruleRepo;
    }

    @Transactional
    public void execute(UUID userId, UUID goalId) {
        SavingsGoal goal = goalRepo.findById(goalId).orElseThrow(GoalNotFoundException::new);
        if (!goal.getUserId().equals(userId)) {
            throw new GoalAccessDeniedException();
        }
        ruleRepo.findActiveByGoalId(goalId).ifPresent(rule -> {
            rule.setActive(false);
            ruleRepo.save(rule);
        });
    }
}
