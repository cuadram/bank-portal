package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.SavingsGoalDto;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.UpdateGoalRequest;
import com.experis.sofia.bankportal.savings.domain.exception.GoalAccessDeniedException;
import com.experis.sofia.bankportal.savings.domain.exception.GoalNotFoundException;
import com.experis.sofia.bankportal.savings.domain.exception.ReservedExceedsTargetException;
import com.experis.sofia.bankportal.savings.domain.model.GoalCategory;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.service.GoalProjectionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
 * TC-F024-060..065 — UpdateGoalUseCase.
 * RN-F024-11 (pausa/reanudacion via update).
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase F.3
 */
@ExtendWith(MockitoExtension.class)
class UpdateGoalUseCaseTest {

    @Mock SavingsGoalRepositoryPort goalRepo;
    @Mock GoalProjectionService projectionService;

    @InjectMocks UpdateGoalUseCase useCase;

    private final UUID userId = UUID.randomUUID();
    private final UUID goalId = UUID.randomUUID();

    private SavingsGoal goal(BigDecimal target, BigDecimal reserved, GoalStatus status, UUID owner) {
        SavingsGoal g = new SavingsGoal();
        g.setId(goalId);
        g.setUserId(owner);
        g.setName("original-name");
        g.setTargetAmount(target);
        g.setReservedAmount(reserved);
        g.setTargetDate(LocalDate.now().plusMonths(6));
        g.setCategory(GoalCategory.VIAJE);
        g.setStatus(status);
        g.setCreatedAt(Instant.now().minusSeconds(86400));
        g.setUpdatedAt(Instant.now().minusSeconds(3600));
        return g;
    }

    private void stubProjection() {
        when(projectionService.suggestedMonthlyContribution(any(), any())).thenReturn(BigDecimal.ZERO);
        when(projectionService.isAtRisk(any(), any())).thenReturn(false);
    }

    @Test @DisplayName("TC-F024-060 — happy path: actualiza name + targetAmount + targetDate (parcial)")
    void partialUpdateNameAndTarget() {
        var g = goal(new BigDecimal("1000.00"), new BigDecimal("100.00"), GoalStatus.ACTIVE, userId);
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));
        when(goalRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubProjection();

        var req = new UpdateGoalRequest("nuevo-nombre", new BigDecimal("2000.00"),
            LocalDate.now().plusMonths(12), null);

        SavingsGoalDto dto = useCase.execute(userId, goalId, req);

        assertThat(dto.name()).isEqualTo("nuevo-nombre");
        assertThat(dto.targetAmount()).isEqualByComparingTo("2000.00");
        assertThat(dto.targetAmount().scale()).isEqualTo(2);
        assertThat(g.getStatus()).isEqualTo(GoalStatus.ACTIVE);  // status null -> sin cambio
        verify(goalRepo).save(g);
    }

    @Test @DisplayName("TC-F024-061 — bajar target por debajo de reservedAmount lanza ReservedExceedsTarget")
    void lowerTargetBelowReservedThrows() {
        var g = goal(new BigDecimal("1000.00"), new BigDecimal("400.00"), GoalStatus.ACTIVE, userId);
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));

        var req = new UpdateGoalRequest(null, new BigDecimal("300.00"), null, null);
        assertThatThrownBy(() -> useCase.execute(userId, goalId, req))
            .isInstanceOf(ReservedExceedsTargetException.class);

        verify(goalRepo, never()).save(any());
        assertThat(g.getTargetAmount()).isEqualByComparingTo("1000.00");  // sin cambios
    }

    @Test @DisplayName("TC-F024-062 — status=PAUSED valido (alterna ACTIVE<->PAUSED)")
    void statusPausedAllowed() {
        var g = goal(new BigDecimal("1000.00"), new BigDecimal("100.00"), GoalStatus.ACTIVE, userId);
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));
        when(goalRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubProjection();

        var req = new UpdateGoalRequest(null, null, null, GoalStatus.PAUSED);
        SavingsGoalDto dto = useCase.execute(userId, goalId, req);

        assertThat(dto.status()).isEqualTo(GoalStatus.PAUSED);
    }

    @Test @DisplayName("TC-F024-063 — status=CLOSED via update rechazado (debe usar Close use case)")
    void statusClosedRejected() {
        var g = goal(new BigDecimal("1000.00"), new BigDecimal("100.00"), GoalStatus.ACTIVE, userId);
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));

        var req = new UpdateGoalRequest(null, null, null, GoalStatus.CLOSED);
        assertThatThrownBy(() -> useCase.execute(userId, goalId, req))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("ACTIVE o PAUSED");

        verify(goalRepo, never()).save(any());
    }

    @Test @DisplayName("TC-F024-064 — goal CLOSED no editable")
    void closedGoalNotEditable() {
        var g = goal(new BigDecimal("1000.00"), new BigDecimal("1000.00"), GoalStatus.CLOSED, userId);
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));

        var req = new UpdateGoalRequest("hack", null, null, null);
        assertThatThrownBy(() -> useCase.execute(userId, goalId, req))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("cerrado");

        verify(goalRepo, never()).save(any());
    }

    @Test @DisplayName("TC-F024-065 — ownership: otro userId lanza GoalAccessDenied")
    void notOwnerThrows() {
        var g = goal(new BigDecimal("1000.00"), BigDecimal.ZERO, GoalStatus.ACTIVE, UUID.randomUUID());
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));

        var req = new UpdateGoalRequest("hack", null, null, null);
        assertThatThrownBy(() -> useCase.execute(userId, goalId, req))
            .isInstanceOf(GoalAccessDeniedException.class);

        verify(goalRepo, never()).save(any());
    }

    @Test @DisplayName("TC-F024-066 — goal no encontrado: GoalNotFoundException")
    void notFoundThrows() {
        when(goalRepo.findById(goalId)).thenReturn(Optional.empty());

        var req = new UpdateGoalRequest("any", null, null, null);
        assertThatThrownBy(() -> useCase.execute(userId, goalId, req))
            .isInstanceOf(GoalNotFoundException.class);
    }
}
