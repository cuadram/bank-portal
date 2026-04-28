package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.AutoRuleDto;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.AutoRuleRequest;
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
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

/**
 * TC-F024-050..054 — ConfigureAutoRuleUseCase.
 * RN-F024-04 (UK active=true por goal — desactivar previa antes de crear).
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase F.3
 */
@ExtendWith(MockitoExtension.class)
class ConfigureAutoRuleUseCaseTest {

    @Mock SavingsGoalRepositoryPort goalRepo;
    @Mock GoalAutoRuleRepositoryPort ruleRepo;

    @InjectMocks ConfigureAutoRuleUseCase useCase;

    private final UUID userId = UUID.randomUUID();
    private final UUID goalId = UUID.randomUUID();
    private final UUID accountId = UUID.randomUUID();

    private SavingsGoal goal(UUID owner) {
        SavingsGoal g = new SavingsGoal();
        g.setId(goalId);
        g.setUserId(owner);
        g.setName("test-goal");
        g.setTargetAmount(new BigDecimal("1000.00"));
        g.setReservedAmount(BigDecimal.ZERO);
        g.setTargetDate(LocalDate.now().plusMonths(6));
        g.setCategory(GoalCategory.EDUCACION);
        g.setStatus(GoalStatus.ACTIVE);
        g.setCreatedAt(Instant.now());
        g.setUpdatedAt(Instant.now());
        return g;
    }

    @Test @DisplayName("TC-F024-050 — primera regla: active=true, save 1 vez (no hay regla previa)")
    void firstRuleIsActive() {
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(goal(userId)));
        when(ruleRepo.findActiveByGoalId(goalId)).thenReturn(Optional.empty());
        when(ruleRepo.save(any(GoalAutoRule.class))).thenAnswer(inv -> inv.getArgument(0));

        var req = new AutoRuleRequest(new BigDecimal("100.00"), (short) 15, accountId);
        AutoRuleDto dto = useCase.execute(userId, goalId, req);

        assertThat(dto.active()).isTrue();
        assertThat(dto.amount()).isEqualByComparingTo("100.00");
        assertThat(dto.dayOfMonth()).isEqualTo((short) 15);
        assertThat(dto.nextExecutionAt()).isNotNull();

        verify(ruleRepo, times(1)).save(any());  // solo el INSERT, no UPDATE de previa
    }

    @Test @DisplayName("TC-F024-051 — regla previa existe: desactiva ANTES de crear nueva (UK active=true)")
    void existingRuleDeactivatedBeforeNew() {
        var prevRule = new GoalAutoRule();
        prevRule.setId(UUID.randomUUID());
        prevRule.setGoalId(goalId);
        prevRule.setActive(true);
        prevRule.setAmount(new BigDecimal("50.00"));
        prevRule.setDayOfMonth(1);
        prevRule.setSourceAccountId(accountId);
        prevRule.setNextExecutionAt(Instant.now().plusSeconds(86400));
        prevRule.setCreatedAt(Instant.now());

        when(goalRepo.findById(goalId)).thenReturn(Optional.of(goal(userId)));
        when(ruleRepo.findActiveByGoalId(goalId)).thenReturn(Optional.of(prevRule));
        when(ruleRepo.save(any(GoalAutoRule.class))).thenAnswer(inv -> inv.getArgument(0));

        var req = new AutoRuleRequest(new BigDecimal("200.00"), (short) 20, accountId);
        useCase.execute(userId, goalId, req);

        // 2 saves: 1) prev desactivada, 2) nueva activa
        InOrder order = inOrder(ruleRepo);
        order.verify(ruleRepo).save(argThat(r -> r.getId().equals(prevRule.getId()) && !r.isActive()));
        order.verify(ruleRepo).save(argThat(r -> !r.getId().equals(prevRule.getId()) && r.isActive()));

        assertThat(prevRule.isActive()).isFalse();
    }

    @Test @DisplayName("TC-F024-052 — ownership: otro userId lanza GoalAccessDenied")
    void notOwnerThrows() {
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(goal(UUID.randomUUID())));

        var req = new AutoRuleRequest(new BigDecimal("100"), (short) 1, accountId);
        assertThatThrownBy(() -> useCase.execute(userId, goalId, req))
            .isInstanceOf(GoalAccessDeniedException.class);

        verify(ruleRepo, never()).save(any());
    }

    @Test @DisplayName("TC-F024-053 — goal no encontrado: GoalNotFoundException")
    void notFoundThrows() {
        when(goalRepo.findById(goalId)).thenReturn(Optional.empty());

        var req = new AutoRuleRequest(new BigDecimal("100"), (short) 1, accountId);
        assertThatThrownBy(() -> useCase.execute(userId, goalId, req))
            .isInstanceOf(GoalNotFoundException.class);
    }

    @Test @DisplayName("TC-F024-054 — dayOfMonth=28 nunca falla por mes corto (limite max valido)")
    void dayOfMonth28IsAlwaysValid() {
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(goal(userId)));
        when(ruleRepo.findActiveByGoalId(goalId)).thenReturn(Optional.empty());
        when(ruleRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var req = new AutoRuleRequest(new BigDecimal("100"), (short) 28, accountId);
        AutoRuleDto dto = useCase.execute(userId, goalId, req);

        assertThat(dto.dayOfMonth()).isEqualTo((short) 28);
        assertThat(dto.nextExecutionAt()).isNotNull();

        // verifica que la rule guardada tiene scale=2 en amount
        ArgumentCaptor<GoalAutoRule> cap = ArgumentCaptor.forClass(GoalAutoRule.class);
        verify(ruleRepo).save(cap.capture());
        assertThat(cap.getValue().getAmount().scale()).isEqualTo(2);
    }
}
