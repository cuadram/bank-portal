package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.AutoRuleDto;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.AutoRuleRequest;
import com.experis.sofia.bankportal.savings.domain.exception.GoalAccessDeniedException;
import com.experis.sofia.bankportal.savings.domain.exception.GoalNotFoundException;
import com.experis.sofia.bankportal.savings.domain.model.GoalAutoRule;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.GoalAutoRuleRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.UUID;

/**
 * US-024-04: configurar (crear o reemplazar) regla de aportacion automatica.
 * RN-F024-04 (UK active=true por goal), RN-F024-05 (proxima ejecucion 02:00 UTC dia DD).
 */
@Service
public class ConfigureAutoRuleUseCase {

    private final SavingsGoalRepositoryPort goalRepo;
    private final GoalAutoRuleRepositoryPort ruleRepo;

    public ConfigureAutoRuleUseCase(SavingsGoalRepositoryPort goalRepo,
                                     GoalAutoRuleRepositoryPort ruleRepo) {
        this.goalRepo = goalRepo;
        this.ruleRepo = ruleRepo;
    }

    @Transactional
    public AutoRuleDto execute(UUID userId, UUID goalId, AutoRuleRequest req) {
        SavingsGoal goal = goalRepo.findById(goalId).orElseThrow(GoalNotFoundException::new);
        if (!goal.getUserId().equals(userId)) {
            throw new GoalAccessDeniedException();
        }

        // Si ya hay una regla activa, desactivarla (RN-F024-04: UK active=true)
        ruleRepo.findActiveByGoalId(goalId).ifPresent(existing -> {
            existing.setActive(false);
            ruleRepo.save(existing);
        });

        GoalAutoRule rule = new GoalAutoRule();
        rule.setId(UUID.randomUUID());
        rule.setGoalId(goalId);
        rule.setAmount(req.amount().setScale(2, java.math.RoundingMode.HALF_UP));
        rule.setDayOfMonth(req.dayOfMonth());
        rule.setSourceAccountId(req.sourceAccountId());
        rule.setActive(true);
        rule.setNextExecutionAt(computeNextExecution(req.dayOfMonth()));
        rule.setLastExecutionAt(null);
        rule.setCreatedAt(Instant.now());

        GoalAutoRule saved = ruleRepo.save(rule);

        return new AutoRuleDto(
            saved.getId(), saved.getAmount(), (short) saved.getDayOfMonth(),
            saved.getSourceAccountId(), saved.isActive(),
            saved.getNextExecutionAt(), saved.getLastExecutionAt()
        );
    }

    /**
     * Calcula la proxima ejecucion: dia DD del mes que viene a las 02:00 UTC.
     * Si el dia DD del mes actual aun no ha pasado, programa para este mes.
     */
    private Instant computeNextExecution(int dayOfMonth) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate target = YearMonth.from(today).atDay(Math.min(dayOfMonth, today.lengthOfMonth()));
        if (!target.isAfter(today)) {
            target = YearMonth.from(today).plusMonths(1).atDay(dayOfMonth);
        }
        return target.atTime(2, 0).toInstant(ZoneOffset.UTC);
    }
}
