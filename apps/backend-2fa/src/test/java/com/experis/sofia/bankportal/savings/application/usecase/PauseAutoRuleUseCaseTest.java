package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.savings.domain.exception.GoalAccessDeniedException;
import com.experis.sofia.bankportal.savings.domain.exception.GoalNotFoundException;
import com.experis.sofia.bankportal.savings.domain.model.GoalAutoRule;
import com.experis.sofia.bankportal.savings.domain.model.GoalCategory;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.GoalAutoRuleRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
 * TC-F024-055..058 — PauseAutoRuleUseCase.
 * Idempotente.
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase F.3
 */
@ExtendWith(MockitoExtension.class)
class PauseAutoRuleUseCaseTest {

    @Mock SavingsGoalRepositoryPort goalRepo;
    @Mock GoalAutoRuleRepositoryPort ruleRepo;

    @InjectMocks PauseAutoRuleUseCase useCase;

    private final UUID userId = UUID.randomUUID();
    private final UUID goalId = UUID.randomUUID();

    private SavingsGoal goal(UUID owner) {
        SavingsGoal g = new SavingsGoal();
        g.setId(goalId);
        g.setUserId(owner);
        g.setName("test-goal");
        g.setTargetAmount(new BigDecimal("1000.00"));
        g.setReservedAmount(BigDecimal.ZERO);
        g.setTargetDate(LocalDate.now().plusMonths(6));
        g.setCategory(GoalCategory.HOGAR);
        g.setStatus(GoalStatus.ACTIVE);
        g.setCreatedAt(Instant.now());
        g.setUpdatedAt(Instant.now());
        return g;
    }

    private GoalAutoRule activeRule() {
        GoalAutoRule r = new GoalAutoRule();
        r.setId(UUID.randomUUID());
        r.setGoalId(goalId);
        r.setAmount(new BigDecimal("100.00"));
        r.setDayOfMonth(15);
        r.setSourceAccountId(UUID.randomUUID());
        r.setActive(true);
        r.setNextExecutionAt(Instant.now().plusSeconds(86400));
        r.setCreatedAt(Instant.now());
        return r;
    }

    @Test @DisplayName("TC-F024-055 — happy path: regla activa pasa a active=false")
    void happyPath() {
        var rule = activeRule();
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(goal(userId)));
        when(ruleRepo.findActiveByGoalId(goalId)).thenReturn(Optional.of(rule));
        when(ruleRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        useCase.execute(userId, goalId);

        ArgumentCaptor<GoalAutoRule> cap = ArgumentCaptor.forClass(GoalAutoRule.class);
        verify(ruleRepo).save(cap.capture());
        assertThat(cap.getValue().isActive()).isFalse();
    }

    @Test @DisplayName("TC-F024-056 — idempotente: sin regla activa NO falla y no llama save")
    void idempotentNoActiveRule() {
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(goal(userId)));
        when(ruleRepo.findActiveByGoalId(goalId)).thenReturn(Optional.empty());

        useCase.execute(userId, goalId);  // no debe lanzar

        verify(ruleRepo, never()).save(any());
    }

    @Test @DisplayName("TC-F024-057 — ownership: otro userId lanza GoalAccessDenied")
    void notOwnerThrows() {
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(goal(UUID.randomUUID())));

        assertThatThrownBy(() -> useCase.execute(userId, goalId))
            .isInstanceOf(GoalAccessDeniedException.class);

        verify(ruleRepo, never()).save(any());
    }

    @Test @DisplayName("TC-F024-058 — goal no encontrado: GoalNotFoundException sin tocar reglas")
    void notFoundThrows() {
        when(goalRepo.findById(goalId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(userId, goalId))
            .isInstanceOf(GoalNotFoundException.class);

        verify(ruleRepo, never()).findActiveByGoalId(any());
    }
}
