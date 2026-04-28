package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.CloseResultDto;
import com.experis.sofia.bankportal.savings.domain.exception.GoalAccessDeniedException;
import com.experis.sofia.bankportal.savings.domain.exception.GoalNotFoundException;
import com.experis.sofia.bankportal.savings.domain.model.GoalCategory;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.service.GoalClosureService;
import com.experis.sofia.bankportal.twofa.application.OtpValidationUseCase;
import com.experis.sofia.bankportal.twofa.domain.exception.InvalidOtpException;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * TC-F024-040..044 — CloseGoalUseCase.
 *
 * NOTA: la liberacion atomica de la reserva (RN-F024-12 + LLD seccion 6.3)
 * la realiza GoalClosureService.close() (verificada en GoalClosureServiceTest).
 * Este test solo verifica:
 *  - Ownership check
 *  - SCA flow (OTP requerido segun closureService.requiresSca)
 *  - Delegacion correcta a closureService.close()
 *  - Construccion del DTO de respuesta
 *
 * DEBT-052 INVALIDATED 2026-04-28 (LA-026-06): la auditoria afirmaba que
 * el UC no liberaba la reserva, pero el grep no siguio la cadena
 * UC -> closureService.close() -> accountReserve.release(). Falso positivo.
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase F.3
 */
@ExtendWith(MockitoExtension.class)
class CloseGoalUseCaseTest {

    @Mock SavingsGoalRepositoryPort goalRepo;
    @Mock GoalClosureService closureService;
    @Mock OtpValidationUseCase otpValidation;

    @InjectMocks CloseGoalUseCase useCase;

    private final UUID userId = UUID.randomUUID();
    private final UUID goalId = UUID.randomUUID();
    private final UUID accountId = UUID.randomUUID();

    private SavingsGoal goal(BigDecimal reserved, GoalStatus status, UUID owner) {
        SavingsGoal g = new SavingsGoal();
        g.setId(goalId);
        g.setUserId(owner);
        g.setName("test-goal");
        g.setTargetAmount(new BigDecimal("1000.00"));
        g.setReservedAmount(reserved);
        g.setTargetDate(LocalDate.now().plusMonths(6));
        g.setCategory(GoalCategory.HOGAR);
        g.setStatus(status);
        g.setSourceAccountId(accountId);
        g.setCreatedAt(Instant.now().minusSeconds(86_400));
        g.setUpdatedAt(Instant.now());
        return g;
    }

    private SavingsGoal closedGoal() {
        SavingsGoal g = goal(new BigDecimal("250.00"), GoalStatus.ACTIVE, userId);
        g.setStatus(GoalStatus.CLOSED);
        g.setClosedAt(Instant.now());
        return g;
    }

    @Test @DisplayName("TC-F024-040 — happy path sin SCA (reserved < threshold): delega a closureService")
    void closeWithoutSca() {
        var g = goal(new BigDecimal("20.00"), GoalStatus.ACTIVE, userId);
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));
        when(closureService.requiresSca(g)).thenReturn(false);
        when(closureService.close(goalId)).thenReturn(closedGoal());

        CloseResultDto dto = useCase.execute(userId, goalId, null);

        assertThat(dto).isNotNull();
        assertThat(dto.goalId()).isEqualTo(goalId);
        assertThat(dto.returnedAmount()).isEqualByComparingTo("20.00");
        assertThat(dto.returnAccountId()).isEqualTo(accountId);
        assertThat(dto.closedAt()).isNotNull();

        verify(otpValidation, never()).validate(any(), any());
        verify(closureService).close(goalId);
    }

    @Test @DisplayName("TC-F024-041 — SCA requerido + OTP valido: valida OTP y delega")
    void closeWithScaValidOtp() {
        var g = goal(new BigDecimal("250.00"), GoalStatus.ACTIVE, userId);
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));
        when(closureService.requiresSca(g)).thenReturn(true);
        when(closureService.close(goalId)).thenReturn(closedGoal());

        CloseResultDto dto = useCase.execute(userId, goalId, "123456");

        verify(otpValidation).validate(userId, "123456");
        verify(closureService).close(goalId);
        assertThat(dto.returnedAmount()).isEqualByComparingTo("250.00");
    }

    @Test @DisplayName("TC-F024-042 — SCA requerido + OTP invalido: lanza InvalidOtp sin cerrar")
    void closeWithScaInvalidOtp() {
        var g = goal(new BigDecimal("250.00"), GoalStatus.ACTIVE, userId);
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));
        when(closureService.requiresSca(g)).thenReturn(true);
        doThrow(new InvalidOtpException()).when(otpValidation).validate(eq(userId), any());

        assertThatThrownBy(() -> useCase.execute(userId, goalId, "wrong"))
            .isInstanceOf(InvalidOtpException.class);

        verify(closureService, never()).close(any());
    }

    @Test @DisplayName("TC-F024-043 — ownership: otro userId lanza GoalAccessDenied")
    void notOwnerThrows() {
        var g = goal(new BigDecimal("100.00"), GoalStatus.ACTIVE, UUID.randomUUID());
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));

        assertThatThrownBy(() -> useCase.execute(userId, goalId, null))
            .isInstanceOf(GoalAccessDeniedException.class);

        verify(closureService, never()).close(any());
        verify(otpValidation, never()).validate(any(), any());
    }

    @Test @DisplayName("TC-F024-044 — goal no encontrado: GoalNotFoundException")
    void notFoundThrows() {
        when(goalRepo.findById(goalId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(userId, goalId, "any"))
            .isInstanceOf(GoalNotFoundException.class);
    }

    @Test @DisplayName("TC-F024-045 — reserved=null: returnedAmount=0 y delega")
    void nullReservedReturnsZero() {
        var g = goal(null, GoalStatus.ACTIVE, userId);
        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));
        when(closureService.requiresSca(g)).thenReturn(false);
        when(closureService.close(goalId)).thenReturn(closedGoal());

        CloseResultDto dto = useCase.execute(userId, goalId, null);

        assertThat(dto.returnedAmount()).isEqualByComparingTo("0");
        verify(closureService).close(goalId);
    }
}
