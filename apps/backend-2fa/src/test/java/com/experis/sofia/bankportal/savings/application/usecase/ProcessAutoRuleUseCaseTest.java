package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.account.domain.AccountReservePort;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.ProcessAutoRuleResult;
import com.experis.sofia.bankportal.savings.domain.exception.InsufficientFundsException;
import com.experis.sofia.bankportal.savings.domain.model.AllocationStatus;
import com.experis.sofia.bankportal.savings.domain.model.AllocationType;
import com.experis.sofia.bankportal.savings.domain.model.GoalAllocation;
import com.experis.sofia.bankportal.savings.domain.model.GoalAutoRule;
import com.experis.sofia.bankportal.savings.domain.model.GoalCategory;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.GoalAllocationRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.repository.GoalAutoRuleRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.service.MilestoneEvaluator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * TC-F024-070..076 — ProcessAutoRuleUseCase.
 * Flujo LLD §6.2 con compensaciones (TARGET_EXCEEDED libera reserve previo).
 * RN-F024-04 (no bloquea ciclo en fallo), RN-F024-05 (idempotencia mensual UK).
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase F.3
 */
@ExtendWith(MockitoExtension.class)
class ProcessAutoRuleUseCaseTest {

    @Mock SavingsGoalRepositoryPort goalRepo;
    @Mock GoalAllocationRepositoryPort allocationRepo;
    @Mock GoalAutoRuleRepositoryPort ruleRepo;
    @Mock AccountReservePort accountReserve;
    @Mock MilestoneEvaluator milestoneEvaluator;

    @InjectMocks ProcessAutoRuleUseCase useCase;

    private final UUID goalId = UUID.randomUUID();
    private final UUID accountId = UUID.randomUUID();

    private GoalAutoRule rule(BigDecimal amount) {
        GoalAutoRule r = new GoalAutoRule();
        r.setId(UUID.randomUUID());
        r.setGoalId(goalId);
        r.setAmount(amount);
        r.setDayOfMonth(15);
        r.setSourceAccountId(accountId);
        r.setActive(true);
        r.setNextExecutionAt(Instant.now());
        r.setCreatedAt(Instant.now());
        return r;
    }

    private SavingsGoal activeGoal(BigDecimal reserved, BigDecimal target) {
        SavingsGoal g = new SavingsGoal();
        g.setId(goalId);
        g.setUserId(UUID.randomUUID());
        g.setName("test-goal");
        g.setTargetAmount(target);
        g.setReservedAmount(reserved);
        g.setTargetDate(LocalDate.now().plusMonths(6));
        g.setCategory(GoalCategory.HOGAR);
        g.setStatus(GoalStatus.ACTIVE);
        g.setCreatedAt(Instant.now());
        g.setUpdatedAt(Instant.now());
        return g;
    }

    private String currentMonth() {
        return YearMonth.now(ZoneOffset.UTC).toString();
    }

    @Test @DisplayName("TC-F024-070 — happy path: reserve OK -> save SUCCESS -> goal.reserve -> milestone -> updateRule")
    void happyPath() {
        var rule = rule(new BigDecimal("100.00"));
        var goal = activeGoal(new BigDecimal("200.00"), new BigDecimal("1000.00"));

        when(allocationRepo.findByGoalIdAndAllocationMonth(goalId, currentMonth())).thenReturn(Optional.empty());
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(goal));
        when(allocationRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ProcessAutoRuleResult result = useCase.execute(rule);

        assertThat(result.status()).isEqualTo(AllocationStatus.SUCCESS);
        assertThat(result.failureReason()).isNull();
        assertThat(result.ruleId()).isEqualTo(rule.getId());
        assertThat(goal.getReservedAmount()).isEqualByComparingTo("300.00");

        InOrder order = inOrder(accountReserve, allocationRepo, goalRepo, milestoneEvaluator, ruleRepo);
        order.verify(accountReserve).reserve(accountId, new BigDecimal("100.00"));
        order.verify(allocationRepo).save(any(GoalAllocation.class));
        order.verify(goalRepo).save(any(SavingsGoal.class));
        order.verify(milestoneEvaluator).evaluate(goal);
        order.verify(ruleRepo).save(rule);

        // Verifica el status del allocation con un captor independiente
        ArgumentCaptor<GoalAllocation> cap = ArgumentCaptor.forClass(GoalAllocation.class);
        verify(allocationRepo).save(cap.capture());
        assertThat(cap.getValue().getStatus()).isEqualTo(AllocationStatus.SUCCESS);
    }

    @Test @DisplayName("TC-F024-071 — idempotencia: alocacion del mes ya existente -> NO duplicar")
    void idempotentMonthlyAllocation() {
        var rule = rule(new BigDecimal("100.00"));
        GoalAllocation existing = new GoalAllocation();
        existing.setStatus(AllocationStatus.SUCCESS);

        when(allocationRepo.findByGoalIdAndAllocationMonth(goalId, currentMonth())).thenReturn(Optional.of(existing));

        ProcessAutoRuleResult result = useCase.execute(rule);

        assertThat(result.status()).isEqualTo(AllocationStatus.SUCCESS);
        verify(accountReserve, never()).reserve(any(), any());
        verify(goalRepo, never()).save(any());
        verify(milestoneEvaluator, never()).evaluate(any());
        verify(ruleRepo, never()).save(any());
    }

    @Test @DisplayName("TC-F024-072 — InsufficientFunds: persiste FAILED + actualiza nextExecution + no llama goal.reserve")
    void insufficientFundsHandled() {
        var rule = rule(new BigDecimal("500.00"));
        var goal = activeGoal(new BigDecimal("100.00"), new BigDecimal("1000.00"));

        when(allocationRepo.findByGoalIdAndAllocationMonth(goalId, currentMonth())).thenReturn(Optional.empty());
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(goal));
        doThrow(new InsufficientFundsException()).when(accountReserve).reserve(any(), any());
        when(allocationRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ProcessAutoRuleResult result = useCase.execute(rule);

        assertThat(result.status()).isEqualTo(AllocationStatus.FAILED);
        assertThat(result.failureReason()).isEqualTo("INSUFFICIENT_FUNDS");

        ArgumentCaptor<GoalAllocation> cap = ArgumentCaptor.forClass(GoalAllocation.class);
        verify(allocationRepo).save(cap.capture());
        assertThat(cap.getValue().getStatus()).isEqualTo(AllocationStatus.FAILED);
        assertThat(cap.getValue().getFailureReason()).isEqualTo("INSUFFICIENT_FUNDS");

        verify(goalRepo, never()).save(any());
        verify(milestoneEvaluator, never()).evaluate(any());
        verify(ruleRepo).save(rule);  // updateNextExecution SI ejecuta
        assertThat(goal.getReservedAmount()).isEqualByComparingTo("100.00");
    }

    @Test @DisplayName("TC-F024-073 — TARGET_EXCEEDED: COMPENSACION libera lo reservado en cuenta")
    void targetExceededCompensates() {
        var rule = rule(new BigDecimal("500.00"));
        var goal = activeGoal(new BigDecimal("700.00"), new BigDecimal("1000.00"));  // 700+500=1200 > 1000

        when(allocationRepo.findByGoalIdAndAllocationMonth(goalId, currentMonth())).thenReturn(Optional.empty());
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(goal));
        when(allocationRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ProcessAutoRuleResult result = useCase.execute(rule);

        assertThat(result.status()).isEqualTo(AllocationStatus.FAILED);
        assertThat(result.failureReason()).isEqualTo("TARGET_EXCEEDED");

        // Compensacion: reserve fue invocado, luego release fue invocado (mismo amount, misma cuenta)
        InOrder order = inOrder(accountReserve);
        order.verify(accountReserve).reserve(accountId, new BigDecimal("500.00"));
        order.verify(accountReserve).release(accountId, new BigDecimal("500.00"));

        assertThat(goal.getReservedAmount()).isEqualByComparingTo("700.00");  // sin cambios
        verify(goalRepo, never()).save(any());
        verify(ruleRepo).save(rule);
    }

    @Test @DisplayName("TC-F024-074 — goal no ACTIVE (PAUSED): persiste FAILED GOAL_NOT_ACTIVE sin reserve")
    void goalNotActivePaused() {
        var rule = rule(new BigDecimal("100.00"));
        var goal = activeGoal(BigDecimal.ZERO, new BigDecimal("1000.00"));
        goal.setStatus(GoalStatus.PAUSED);

        when(allocationRepo.findByGoalIdAndAllocationMonth(goalId, currentMonth())).thenReturn(Optional.empty());
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(goal));
        when(allocationRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ProcessAutoRuleResult result = useCase.execute(rule);

        assertThat(result.status()).isEqualTo(AllocationStatus.FAILED);
        assertThat(result.failureReason()).isEqualTo("GOAL_NOT_ACTIVE");
        verify(accountReserve, never()).reserve(any(), any());
        verify(ruleRepo, never()).save(any());  // GOAL_NOT_ACTIVE NO actualiza nextExecution (esta antes del reserve)
    }

    @Test @DisplayName("TC-F024-075 — goal no encontrado: FAILED GOAL_NOT_ACTIVE")
    void goalNotFound() {
        var rule = rule(new BigDecimal("100.00"));

        when(allocationRepo.findByGoalIdAndAllocationMonth(goalId, currentMonth())).thenReturn(Optional.empty());
        when(goalRepo.findById(goalId)).thenReturn(Optional.empty());
        when(allocationRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ProcessAutoRuleResult result = useCase.execute(rule);

        assertThat(result.status()).isEqualTo(AllocationStatus.FAILED);
        assertThat(result.failureReason()).isEqualTo("GOAL_NOT_ACTIVE");
        verify(accountReserve, never()).reserve(any(), any());
    }

    @Test @DisplayName("TC-F024-076 — allocation persistida con tipo AUTO + ruleId + allocationMonth UK")
    void allocationFieldsExactForAuto() {
        var rule = rule(new BigDecimal("100.00"));
        var goal = activeGoal(BigDecimal.ZERO, new BigDecimal("1000.00"));

        when(allocationRepo.findByGoalIdAndAllocationMonth(goalId, currentMonth())).thenReturn(Optional.empty());
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(goal));
        when(allocationRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        useCase.execute(rule);

        ArgumentCaptor<GoalAllocation> cap = ArgumentCaptor.forClass(GoalAllocation.class);
        verify(allocationRepo).save(cap.capture());
        GoalAllocation alloc = cap.getValue();

        assertThat(alloc.getAllocationType()).isEqualTo(AllocationType.AUTO);
        assertThat(alloc.getRuleId()).isEqualTo(rule.getId());
        assertThat(alloc.getAllocationMonth()).isEqualTo(currentMonth());  // UK
        assertThat(alloc.getStatus()).isEqualTo(AllocationStatus.SUCCESS);
        assertThat(alloc.getSourceAccountId()).isEqualTo(accountId);
    }
}
