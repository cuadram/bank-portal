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
 *
 * <p>BUG-S26-Q-003 fix (Sprint 26): el endpoint PUT /auto-rule debe ser idempotente
 * conforme RFC 7231. La implementacion previa creaba una regla nueva tras desactivar
 * la existente; el flush JPA evaluaba ambas filas con active=true en la misma
 * transaccion y violaba uk_goal_active_rule -> 500. El nuevo flujo es upsert real:
 * si existe regla activa, se mutan sus campos in-place (manteniendo id y createdAt);
 * si no existe, se crea una nueva.</p>
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

        java.math.BigDecimal amount = req.amount().setScale(2, java.math.RoundingMode.HALF_UP);
        Instant nextExec = computeNextExecution(req.dayOfMonth());

        // Upsert idempotente (BUG-Q-003 fix): mutar regla existente en lugar de
        // crear-nueva-y-desactivar-anterior, lo cual chocaba con uk_goal_active_rule.
        GoalAutoRule rule = ruleRepo.findActiveByGoalId(goalId).orElseGet(() -> {
            GoalAutoRule fresh = new GoalAutoRule();
            fresh.setId(UUID.randomUUID());
            fresh.setGoalId(goalId);
            fresh.setActive(true);
            fresh.setLastExecutionAt(null);
            fresh.setCreatedAt(Instant.now());
            return fresh;
        });
        rule.setAmount(amount);
        rule.setDayOfMonth(req.dayOfMonth());
        rule.setSourceAccountId(req.sourceAccountId());
        rule.setActive(true);
        rule.setNextExecutionAt(nextExec);

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
