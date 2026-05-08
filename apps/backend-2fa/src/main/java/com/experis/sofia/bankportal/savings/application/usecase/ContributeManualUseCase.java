package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.account.domain.AccountReservePort;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.AllocationDto;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.ContributeRequest;
import com.experis.sofia.bankportal.savings.domain.exception.GoalAccessDeniedException;
import com.experis.sofia.bankportal.savings.domain.exception.GoalNotFoundException;
import com.experis.sofia.bankportal.savings.domain.exception.OptimisticLockExhaustedException;
import com.experis.sofia.bankportal.savings.domain.model.AllocationStatus;
import com.experis.sofia.bankportal.savings.domain.model.AllocationType;
import com.experis.sofia.bankportal.savings.domain.model.GoalAllocation;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.GoalAllocationRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.service.MilestoneEvaluator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * US-024-03: aportacion manual atomica.
 * Flujo LLD §6.1: validar -> reserve -> save allocation -> update goal -> evaluate milestones.
 * RN-F024-03 (importes), RN-F024-09 (hitos).
 *
 * <p>BUG-S26-Q-008 fix (Sprint 26): el bucle de retry envuelve la transaccion
 * con TransactionTemplate (no @Transactional declarativo) para poder capturar
 * la OptimisticLockingFailureException que Hibernate lanza en el commit y
 * reintentar la operacion completa con una transaccion nueva. Tras MAX_RETRIES
 * intentos sin exito, lanza OptimisticLockExhaustedException -> 409 CONFLICT.</p>
 */
@Slf4j
@Service
public class ContributeManualUseCase {

    /** Numero maximo de reintentos ante optimistic lock conflict. */
    static final int MAX_RETRIES = 3;

    private final SavingsGoalRepositoryPort goalRepo;
    private final GoalAllocationRepositoryPort allocationRepo;
    private final AccountReservePort accountReserve;
    private final MilestoneEvaluator milestoneEvaluator;
    private final TransactionTemplate tx;

    public ContributeManualUseCase(SavingsGoalRepositoryPort goalRepo,
                                    GoalAllocationRepositoryPort allocationRepo,
                                    AccountReservePort accountReserve,
                                    MilestoneEvaluator milestoneEvaluator,
                                    TransactionTemplate tx) {
        this.goalRepo = goalRepo;
        this.allocationRepo = allocationRepo;
        this.accountReserve = accountReserve;
        this.milestoneEvaluator = milestoneEvaluator;
        this.tx = tx;
    }

    public AllocationDto execute(UUID userId, UUID goalId, ContributeRequest req) {
        OptimisticLockingFailureException last = null;
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                return tx.execute(status -> doContribute(userId, goalId, req));
            } catch (OptimisticLockingFailureException ex) {
                last = ex;
                log.warn("savings.contribute.retry attempt={} goalId={} reason={}",
                    attempt, goalId, ex.getMessage());
                // Backoff minimo (no bloqueante en tests, pero deja respirar al thread)
                try { Thread.sleep(5L * attempt); } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new OptimisticLockExhaustedException("interrumpido durante retry", ie);
                }
            }
        }
        log.error("savings.contribute.exhausted goalId={} retries={}", goalId, MAX_RETRIES);
        throw new OptimisticLockExhaustedException(
            "Conflicto de concurrencia tras " + MAX_RETRIES + " intentos. Reintenta la solicitud.",
            last);
    }

    private AllocationDto doContribute(UUID userId, UUID goalId, ContributeRequest req) {
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

        // 3) Actualizar reservedAmount en goal — optimistic lock comprueba version en commit
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
