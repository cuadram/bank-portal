package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.account.domain.AccountReservePort;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.AllocationDto;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.ContributeRequest;
import com.experis.sofia.bankportal.savings.domain.exception.GoalAccessDeniedException;
import com.experis.sofia.bankportal.savings.domain.exception.GoalNotFoundException;
import com.experis.sofia.bankportal.savings.domain.model.AllocationStatus;
import com.experis.sofia.bankportal.savings.domain.model.AllocationType;
import com.experis.sofia.bankportal.savings.domain.model.GoalAllocation;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.GoalAllocationRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.service.MilestoneEvaluator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * US-024-03: aportacion manual atomica.
 * Flujo LLD §6.1: validar -> reserve -> save allocation -> update goal -> evaluate milestones.
 * RN-F024-03 (importes), RN-F024-09 (hitos).
 */
@Service
public class ContributeManualUseCase {

    private final SavingsGoalRepositoryPort goalRepo;
    private final GoalAllocationRepositoryPort allocationRepo;
    private final AccountReservePort accountReserve;
    private final MilestoneEvaluator milestoneEvaluator;

    public ContributeManualUseCase(SavingsGoalRepositoryPort goalRepo,
                                    GoalAllocationRepositoryPort allocationRepo,
                                    AccountReservePort accountReserve,
                                    MilestoneEvaluator milestoneEvaluator) {
        this.goalRepo = goalRepo;
        this.allocationRepo = allocationRepo;
        this.accountReserve = accountReserve;
        this.milestoneEvaluator = milestoneEvaluator;
    }

    @Transactional
    public AllocationDto execute(UUID userId, UUID goalId, ContributeRequest req) {
        SavingsGoal goal = goalRepo.findById(goalId).orElseThrow(GoalNotFoundException::new);
        if (!goal.getUserId().equals(userId)) {
            throw new GoalAccessDeniedException();
        }
        if (goal.getStatus() != GoalStatus.ACTIVE) {
            throw new IllegalStateException("Solo objetivos ACTIVE admiten aportaciones (estado actual: " + goal.getStatus() + ")");
        }

        BigDecimal amount = req.amount().setScale(2, java.math.RoundingMode.HALF_UP);

        // 1) Reservar saldo (lanza InsufficientFundsException si no hay)
        accountReserve.reserve(req.sourceAccountId(), amount);

        // 2) Persistir allocation SUCCESS
        GoalAllocation allocation = new GoalAllocation();
        allocation.setId(UUID.randomUUID());
        allocation.setGoalId(goalId);
        allocation.setAmount(amount);
        allocation.setAllocationType(AllocationType.MANUAL);
        allocation.setSourceAccountId(req.sourceAccountId());
        allocation.setRuleId(null);
        allocation.setAllocationMonth(null); // null para MANUAL — UK aplica solo a AUTO
        allocation.setStatus(AllocationStatus.SUCCESS);
        allocation.setExecutedAt(Instant.now());
        GoalAllocation savedAlloc = allocationRepo.save(allocation);

        // 3) Actualizar reservedAmount en goal (puede transicionar a COMPLETED)
        goal.reserve(amount);
        goalRepo.save(goal);

        // 4) Evaluar hitos (idempotente; emite los nuevos hitos cruzados)
        milestoneEvaluator.evaluate(goal);

        return new AllocationDto(
            savedAlloc.getId(), savedAlloc.getAmount(), savedAlloc.getAllocationType(),
            savedAlloc.getSourceAccountId(), savedAlloc.getAllocationMonth(),
            savedAlloc.getStatus(), savedAlloc.getFailureReason(), savedAlloc.getExecutedAt()
        );
    }
}
