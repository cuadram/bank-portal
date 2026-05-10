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
 * TC-F024-050..054 - ConfigureAutoRuleUseCase.
 * RN-F024-04 (UK active=true por goal). TC-051 actualizado en Sprint 26 Step 7
 * (BUG-Q-003 fix): upsert in-place mantiene id/createdAt y aplica nuevos valores
 * en una sola operacion save, sin chocar contra uk_goal_active_rule.
 *
 * @author SOFIA Developer Agent - FEAT-024 Sprint 26 - Fase F.3 + Step 7 C3
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

    @Test @DisplayName("TC-F024-051 - BUG-Q-003 fix: upsert in-place (1 save, mantiene id, actualiza valores)")
    void existingRuleUpsertedInPlace() {
        UUID prevId = UUID.randomUUID();
        Instant prevCreatedAt = Instant.now().minusSeconds(86400);
        var prevRule = new GoalAutoRule();
        prevRule.setId(prevId);
        prevRule.setGoalId(goalId);
        prevRule.setActive(true);
        prevRule.setAmount(new BigDecimal("50.00"));
        prevRule.setDayOfMonth(1);
        prevRule.setSourceAccountId(accountId);
        prevRule.setNextExecutionAt(Instant.now().plusSeconds(86400));
        prevRule.setCreatedAt(prevCreatedAt);

        when(goalRepo.findById(goalId)).thenReturn(Optional.of(goal(userId)));
        when(ruleRepo.findActiveByGoalId(goalId)).thenReturn(Optional.of(prevRule));
        when(ruleRepo.save(any(GoalAutoRule.class))).thenAnswer(inv -> inv.getArgument(0));

        var req = new AutoRuleRequest(new BigDecimal("200.00"), (short) 20, accountId);
        AutoRuleDto dto = useCase.execute(userId, goalId, req);

        // BUG-Q-003 fix: solo 1 save — la misma fila mutada, no INSERT + UPDATE.
        // Esto evita la violacion de uk_goal_active_rule (UNIQUE PARTIAL active=true).
        ArgumentCaptor<GoalAutoRule> cap = ArgumentCaptor.forClass(GoalAutoRule.class);
        verify(ruleRepo, times(1)).save(cap.capture());
        GoalAutoRule saved = cap.getValue();

        // Mantiene id y createdAt originales (es la misma fila mutada)
        assertThat(saved.getId()).isEqualTo(prevId);
        assertThat(saved.getCreatedAt()).isEqualTo(prevCreatedAt);
        // Y aplica los nuevos valores del request
        assertThat(saved.isActive()).isTrue();
        assertThat(saved.getAmount()).isEqualByComparingTo("200.00");
        assertThat(saved.getDayOfMonth()).isEqualTo(20);

        // El DTO devuelto refleja los nuevos valores
        assertThat(dto.amount()).isEqualByComparingTo("200.00");
        assertThat(dto.dayOfMonth()).isEqualTo((short) 20);
        assertThat(dto.active()).isTrue();
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
