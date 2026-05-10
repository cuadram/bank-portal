package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.account.domain.AccountReservePort;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.ProcessAutoRuleResult;
import com.experis.sofia.bankportal.savings.domain.exception.InsufficientFundsException;
import com.experis.sofia.bankportal.savings.domain.exception.ReservedExceedsTargetException;
import com.experis.sofia.bankportal.savings.domain.model.AllocationStatus;
import com.experis.sofia.bankportal.savings.domain.model.AllocationType;
import com.experis.sofia.bankportal.savings.domain.model.GoalAllocation;
import com.experis.sofia.bankportal.savings.domain.model.GoalAutoRule;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.GoalAllocationRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.repository.GoalAutoRuleRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.service.MilestoneEvaluator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

/**
 * Procesador de una regla de aportacion automatica (invocado desde scheduler).
 * Flujo LLD §6.2. Tx independiente (REQUIRES_NEW) para que un fallo aislado
 * no aborte el ciclo completo del scheduler.
 *
 * RN-F024-04 (no bloquea ciclo en fallo), RN-F024-05 (idempotencia mensual UK).
 */
@Service
public class ProcessAutoRuleUseCase {

    private final SavingsGoalRepositoryPort goalRepo;
    private final GoalAllocationRepositoryPort allocationRepo;
    private final GoalAutoRuleRepositoryPort ruleRepo;
    private final AccountReservePort accountReserve;
    private final MilestoneEvaluator milestoneEvaluator;

    public ProcessAutoRuleUseCase(SavingsGoalRepositoryPort goalRepo,
                                    GoalAllocationRepositoryPort allocationRepo,
                                    GoalAutoRuleRepositoryPort ruleRepo,
                                    AccountReservePort accountReserve,
                                    MilestoneEvaluator milestoneEvaluator) {
        this.goalRepo = goalRepo;
        this.allocationRepo = allocationRepo;
        this.ruleRepo = ruleRepo;
        this.accountReserve = accountReserve;
        this.milestoneEvaluator = milestoneEvaluator;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ProcessAutoRuleResult execute(GoalAutoRule rule) {
        UUID goalId = rule.getGoalId();
        String allocationMonth = currentAllocationMonth();

        // Idempotencia: si ya se proceso este (rule, month), no duplicar
        Optional<GoalAllocation> existing = allocationRepo.findByGoalIdAndAllocationMonth(goalId, allocationMonth);
        if (existing.isPresent()) {
            return new ProcessAutoRuleResult(rule.getId(), existing.get().getStatus(), null);
        }

        Optional<SavingsGoal> goalOpt = goalRepo.findById(goalId);
        if (goalOpt.isEmpty() || goalOpt.get().getStatus() != GoalStatus.ACTIVE) {
            persistFailedAllocation(rule, allocationMonth, "GOAL_NOT_ACTIVE");
            return new ProcessAutoRuleResult(rule.getId(), AllocationStatus.FAILED, "GOAL_NOT_ACTIVE");
        }

        SavingsGoal goal = goalOpt.get();
        BigDecimal amount = rule.getAmount();

        try {
            accountReserve.reserve(rule.getSourceAccountId(), amount);
        } catch (InsufficientFundsException e) {
            persistFailedAllocation(rule, allocationMonth, "INSUFFICIENT_FUNDS");
            updateRuleNextExecution(rule);
            return new ProcessAutoRuleResult(rule.getId(), AllocationStatus.FAILED, "INSUFFICIENT_FUNDS");
        }

        try {
            goal.reserve(amount);
        } catch (ReservedExceedsTargetException e) {
            // Liberar lo que acabamos de reservar (compensacion)
            accountReserve.release(rule.getSourceAccountId(), amount);
            persistFailedAllocation(rule, allocationMonth, "TARGET_EXCEEDED");
            updateRuleNextExecution(rule);
            return new ProcessAutoRuleResult(rule.getId(), AllocationStatus.FAILED, "TARGET_EXCEEDED");
        }

        // Persistir allocation SUCCESS
        GoalAllocation allocation = new GoalAllocation();
        allocation.setId(UUID.randomUUID());
        allocation.setGoalId(goalId);
        allocation.setAmount(amount);
        allocation.setAllocationType(AllocationType.AUTO);
        allocation.setSourceAccountId(rule.getSourceAccountId());
        allocation.setRuleId(rule.getId());
        allocation.setAllocationMonth(allocationMonth);
        allocation.setStatus(AllocationStatus.SUCCESS);
        allocation.setExecutedAt(Instant.now());
        allocationRepo.save(allocation);

        goalRepo.save(goal);
        milestoneEvaluator.evaluate(goal);

        updateRuleNextExecution(rule);

        return new ProcessAutoRuleResult(rule.getId(), AllocationStatus.SUCCESS, null);
    }

    private void persistFailedAllocation(GoalAutoRule rule, String allocationMonth, String reason) {
        GoalAllocation alloc = new GoalAllocation();
        alloc.setId(UUID.randomUUID());
        alloc.setGoalId(rule.getGoalId());
        alloc.setAmount(rule.getAmount());
        alloc.setAllocationType(AllocationType.AUTO);
        alloc.setSourceAccountId(rule.getSourceAccountId());
        alloc.setRuleId(rule.getId());
        alloc.setAllocationMonth(allocationMonth);
        alloc.setStatus(AllocationStatus.FAILED);
        alloc.setFailureReason(reason);
        alloc.setExecutedAt(Instant.now());
        try {
            allocationRepo.save(alloc);
        } catch (org.springframework.dao.DataIntegrityViolationException ignored) {
            // Carrera en UK (goal_id, allocation_month): otra ejecucion gano. OK.
        }
    }

    private void updateRuleNextExecution(GoalAutoRule rule) {
        rule.setLastExecutionAt(Instant.now());
        // Proximo dayOfMonth del mes siguiente
        int dom = rule.getDayOfMonth();
        java.time.LocalDate today = java.time.LocalDate.now(ZoneOffset.UTC);
        java.time.LocalDate next = YearMonth.from(today).plusMonths(1)
            .atDay(Math.min(dom, YearMonth.from(today).plusMonths(1).lengthOfMonth()));
        rule.setNextExecutionAt(next.atTime(2, 0).toInstant(ZoneOffset.UTC));
        ruleRepo.save(rule);
    }

    private String currentAllocationMonth() {
        return YearMonth.now(ZoneOffset.UTC).toString(); // YYYY-MM
    }
}
