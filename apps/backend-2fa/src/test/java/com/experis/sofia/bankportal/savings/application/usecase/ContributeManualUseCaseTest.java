package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.account.domain.AccountReservePort;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.AllocationDto;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.ContributeRequest;
import com.experis.sofia.bankportal.savings.domain.exception.GoalAccessDeniedException;
import com.experis.sofia.bankportal.savings.domain.exception.GoalNotFoundException;
import com.experis.sofia.bankportal.savings.domain.exception.InsufficientFundsException;
import com.experis.sofia.bankportal.savings.domain.model.AllocationStatus;
import com.experis.sofia.bankportal.savings.domain.model.AllocationType;
import com.experis.sofia.bankportal.savings.domain.model.GoalAllocation;
import com.experis.sofia.bankportal.savings.domain.model.GoalCategory;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.GoalAllocationRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.service.MilestoneEvaluator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * TC-F024-030..036 — ContributeManualUseCase.
 * Flujo LLD §6.1: validar -> reserve -> save allocation -> update goal -> evaluate milestones.
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase F.3
 */
@ExtendWith(MockitoExtension.class)
class ContributeManualUseCaseTest {

    @Mock SavingsGoalRepositoryPort goalRepo;
    @Mock GoalAllocationRepositoryPort allocationRepo;
    @Mock AccountReservePort accountReserve;
    @Mock MilestoneEvaluator milestoneEvaluator;
    @Mock TransactionTemplate tx;

    @InjectMocks ContributeManualUseCase useCase;

    @BeforeEach
    void stubTxPassThrough() {
        // Pass-through: la TransactionTemplate ejecuta el callback inline (no abre tx real)
        when(tx.execute(any())).thenAnswer(inv -> {
            TransactionCallback<?> cb = inv.getArgument(0);
            return cb.doInTransaction(null);
        });
    }

    private final UUID userId = UUID.randomUUID();
    private final UUID goalId = UUID.randomUUID();
    private final UUID accountId = UUID.randomUUID();

    private SavingsGoal activeGoal(BigDecimal reserved, BigDecimal target, UUID owner) {
        SavingsGoal g = new SavingsGoal();
        g.setId(goalId);
        g.setUserId(owner);
        g.setName("test-goal");
        g.setTargetAmount(target);
        g.setReservedAmount(reserved);
        g.setTargetDate(LocalDate.now().plusMonths(6));
        g.setCategory(GoalCategory.VIAJE);
        g.setStatus(GoalStatus.ACTIVE);
        g.setCreatedAt(Instant.now());
        g.setUpdatedAt(Instant.now());
        return g;
    }

    @Test @DisplayName("TC-F024-030 — happy path: reserve -> save allocation -> goal.reserve -> milestone")
    void happyPathOrder() {
        var goal = activeGoal(new BigDecimal("100.00"), new BigDecimal("1000.00"), userId);
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(goal));
        when(allocationRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var req = new ContributeRequest(new BigDecimal("200.00"), accountId);
        AllocationDto dto = useCase.execute(userId, goalId, req);

        // Verifica orden: reserve -> save allocation -> save goal -> evaluate
        InOrder order = inOrder(accountReserve, allocationRepo, goalRepo, milestoneEvaluator);
        order.verify(accountReserve).reserve(accountId, new BigDecimal("200.00"));
        order.verify(allocationRepo).save(any(GoalAllocation.class));
        order.verify(goalRepo).save(any(SavingsGoal.class));
        order.verify(milestoneEvaluator).evaluate(goal);

        // DTO devuelto
        assertThat(dto.amount()).isEqualByComparingTo("200.00");
        assertThat(dto.type()).isEqualTo(AllocationType.MANUAL);
        assertThat(dto.status()).isEqualTo(AllocationStatus.SUCCESS);
        assertThat(dto.allocationMonth()).isNull();  // null para MANUAL (UK solo a AUTO)
        assertThat(dto.failureReason()).isNull();

        // Goal actualizado in-place
        assertThat(goal.getReservedAmount()).isEqualByComparingTo("300.00");
    }

    @Test @DisplayName("TC-F024-031 — InsufficientFundsException propaga sin tocar allocation/goal")
    void insufficientFundsPropagates() {
        var goal = activeGoal(new BigDecimal("100.00"), new BigDecimal("1000.00"), userId);
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(goal));
        doThrow(new InsufficientFundsException()).when(accountReserve).reserve(any(), any());

        var req = new ContributeRequest(new BigDecimal("200.00"), accountId);
        assertThatThrownBy(() -> useCase.execute(userId, goalId, req))
            .isInstanceOf(InsufficientFundsException.class);

        verify(allocationRepo, never()).save(any());
        verify(goalRepo, never()).save(any());
        verify(milestoneEvaluator, never()).evaluate(any());
        assertThat(goal.getReservedAmount()).isEqualByComparingTo("100.00");
    }

    @Test @DisplayName("TC-F024-032 — ownership: otro userId lanza GoalAccessDenied")
    void notOwnerThrows() {
        var otherUserGoal = activeGoal(BigDecimal.ZERO, new BigDecimal("1000.00"), UUID.randomUUID());
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(otherUserGoal));

        var req = new ContributeRequest(new BigDecimal("100.00"), accountId);
        assertThatThrownBy(() -> useCase.execute(userId, goalId, req))
            .isInstanceOf(GoalAccessDeniedException.class);

        verify(accountReserve, never()).reserve(any(), any());
    }

    @Test @DisplayName("TC-F024-033 — goal no encontrado: GoalNotFoundException")
    void notFoundThrows() {
        when(goalRepo.findById(goalId)).thenReturn(Optional.empty());

        var req = new ContributeRequest(new BigDecimal("100.00"), accountId);
        assertThatThrownBy(() -> useCase.execute(userId, goalId, req))
            .isInstanceOf(GoalNotFoundException.class);
    }

    @Test @DisplayName("TC-F024-034 — goal en estado PAUSED rechaza con IllegalState")
    void pausedGoalRejected() {
        var goal = activeGoal(BigDecimal.ZERO, new BigDecimal("1000.00"), userId);
        goal.setStatus(GoalStatus.PAUSED);
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(goal));

        var req = new ContributeRequest(new BigDecimal("100.00"), accountId);
        assertThatThrownBy(() -> useCase.execute(userId, goalId, req))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("PAUSED");

        verify(accountReserve, never()).reserve(any(), any());
    }

    @Test @DisplayName("TC-F024-035 — alcanzar target exacto transiciona goal a COMPLETED")
    void reachTargetTransitionsCompleted() {
        var goal = activeGoal(new BigDecimal("900.00"), new BigDecimal("1000.00"), userId);
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(goal));
        when(allocationRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var req = new ContributeRequest(new BigDecimal("100.00"), accountId);
        useCase.execute(userId, goalId, req);

        assertThat(goal.getReservedAmount()).isEqualByComparingTo("1000.00");
        assertThat(goal.getStatus()).isEqualTo(GoalStatus.COMPLETED);  // SavingsGoal.reserve transiciona

        // milestone evaluator se invoca con goal post-update (esperaria 100%)
        ArgumentCaptor<SavingsGoal> cap = ArgumentCaptor.forClass(SavingsGoal.class);
        verify(milestoneEvaluator).evaluate(cap.capture());
        assertThat(cap.getValue().getStatus()).isEqualTo(GoalStatus.COMPLETED);
    }

    @Test @DisplayName("TC-F024-036 — allocation persistida tiene tipo MANUAL + month=null + status=SUCCESS")
    void allocationFieldsExact() {
        var goal = activeGoal(BigDecimal.ZERO, new BigDecimal("1000.00"), userId);
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(goal));
        when(allocationRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var req = new ContributeRequest(new BigDecimal("50.00"), accountId);
        useCase.execute(userId, goalId, req);

        ArgumentCaptor<GoalAllocation> cap = ArgumentCaptor.forClass(GoalAllocation.class);
        verify(allocationRepo).save(cap.capture());
        GoalAllocation alloc = cap.getValue();
        assertThat(alloc.getAllocationType()).isEqualTo(AllocationType.MANUAL);
        assertThat(alloc.getAllocationMonth()).isNull();
        assertThat(alloc.getStatus()).isEqualTo(AllocationStatus.SUCCESS);
        assertThat(alloc.getRuleId()).isNull();
        assertThat(alloc.getSourceAccountId()).isEqualTo(accountId);
        assertThat(alloc.getAmount()).isEqualByComparingTo("50.00");
        assertThat(alloc.getExecutedAt()).isNotNull();
    }
}
