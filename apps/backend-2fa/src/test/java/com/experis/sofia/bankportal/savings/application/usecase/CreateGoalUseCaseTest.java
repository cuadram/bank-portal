package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.CreateGoalRequest;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.SavingsGoalDto;
import com.experis.sofia.bankportal.savings.domain.exception.MaxGoalsReachedException;
import com.experis.sofia.bankportal.savings.domain.model.GoalCategory;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.service.GoalProjectionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * TC-F024-020..024 — CreateGoalUseCase.
 * RN-F024-01 (max 10 ACTIVE), RN-F024-02 (rangos validados en DTO).
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase F.3
 */
@ExtendWith(MockitoExtension.class)
class CreateGoalUseCaseTest {

    @Mock SavingsGoalRepositoryPort goalRepo;
    @Mock GoalProjectionService projectionService;

    @InjectMocks CreateGoalUseCase useCase;

    private final UUID userId = UUID.randomUUID();
    private final UUID accountId = UUID.randomUUID();

    private CreateGoalRequest validRequest() {
        return new CreateGoalRequest(
            "Vacaciones Japon", new BigDecimal("3000.00"),
            LocalDate.now().plusMonths(12), GoalCategory.VIAJE,
            null, "plane", "#1e3a5f", accountId
        );
    }

    @Test @DisplayName("TC-F024-020 — happy path: persiste goal ACTIVE con scale=2 y devuelve DTO")
    void happyPath() {
        when(goalRepo.countByUserIdAndStatus(userId, GoalStatus.ACTIVE)).thenReturn(0L);
        when(goalRepo.save(any(SavingsGoal.class))).thenAnswer(inv -> inv.getArgument(0));
        when(projectionService.suggestedMonthlyContribution(any(), any())).thenReturn(new BigDecimal("250.00"));
        when(projectionService.isAtRisk(any(), any())).thenReturn(false);

        SavingsGoalDto dto = useCase.execute(userId, validRequest());

        assertThat(dto).isNotNull();
        assertThat(dto.name()).isEqualTo("Vacaciones Japon");
        assertThat(dto.targetAmount()).isEqualByComparingTo("3000.00");
        assertThat(dto.targetAmount().scale()).isEqualTo(2);
        assertThat(dto.reservedAmount()).isEqualByComparingTo("0");
        assertThat(dto.status()).isEqualTo(GoalStatus.ACTIVE);
        assertThat(dto.category()).isEqualTo(GoalCategory.VIAJE);
        assertThat(dto.suggestedMonthlyContribution()).isEqualByComparingTo("250.00");
        assertThat(dto.projectionRisk()).isFalse();

        ArgumentCaptor<SavingsGoal> cap = ArgumentCaptor.forClass(SavingsGoal.class);
        verify(goalRepo).save(cap.capture());
        SavingsGoal saved = cap.getValue();
        assertThat(saved.getUserId()).isEqualTo(userId);
        assertThat(saved.getStatus()).isEqualTo(GoalStatus.ACTIVE);
        assertThat(saved.getReservedAmount()).isEqualByComparingTo("0");
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
        assertThat(saved.getId()).isNotNull();
    }

    @Test @DisplayName("TC-F024-021 — max 10 ACTIVE: lanza MaxGoalsReachedException sin guardar")
    void maxGoalsReached() {
        when(goalRepo.countByUserIdAndStatus(userId, GoalStatus.ACTIVE)).thenReturn(10L);

        assertThatThrownBy(() -> useCase.execute(userId, validRequest()))
            .isInstanceOf(MaxGoalsReachedException.class);

        verify(goalRepo, never()).save(any());
    }

    @Test @DisplayName("TC-F024-022 — count=9 OK: permite crear el 10")
    void exactlyNineAllowsTenth() {
        when(goalRepo.countByUserIdAndStatus(userId, GoalStatus.ACTIVE)).thenReturn(9L);
        when(goalRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(projectionService.suggestedMonthlyContribution(any(), any())).thenReturn(BigDecimal.ZERO);
        when(projectionService.isAtRisk(any(), any())).thenReturn(false);

        SavingsGoalDto dto = useCase.execute(userId, validRequest());

        assertThat(dto).isNotNull();
        verify(goalRepo).save(any());
    }

    @Test @DisplayName("TC-F024-023 — setScale(2,HALF_UP) en targetAmount: 1000.005 -> 1000.01")
    void halfUpScaling() {
        when(goalRepo.countByUserIdAndStatus(any(), any())).thenReturn(0L);
        when(goalRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(projectionService.suggestedMonthlyContribution(any(), any())).thenReturn(BigDecimal.ZERO);
        when(projectionService.isAtRisk(any(), any())).thenReturn(false);

        var req = new CreateGoalRequest(
            "test", new BigDecimal("1000.005"),
            LocalDate.now().plusMonths(6), GoalCategory.HOGAR,
            null, null, null, accountId
        );

        SavingsGoalDto dto = useCase.execute(userId, req);
        assertThat(dto.targetAmount()).isEqualByComparingTo("1000.01");
        assertThat(dto.targetAmount().scale()).isEqualTo(2);
    }

    @Test @DisplayName("TC-F024-024 — categoria OTROS con customCategory propaga al goal")
    void customCategoryPropagated() {
        when(goalRepo.countByUserIdAndStatus(any(), any())).thenReturn(0L);
        when(goalRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(projectionService.suggestedMonthlyContribution(any(), any())).thenReturn(BigDecimal.ZERO);
        when(projectionService.isAtRisk(any(), any())).thenReturn(false);

        var req = new CreateGoalRequest(
            "Master MBA", new BigDecimal("15000"),
            LocalDate.now().plusMonths(24), GoalCategory.OTROS,
            "Formacion", "graduation-cap", "#7c3aed", accountId
        );

        SavingsGoalDto dto = useCase.execute(userId, req);
        assertThat(dto.category()).isEqualTo(GoalCategory.OTROS);
        assertThat(dto.customCategory()).isEqualTo("Formacion");
        assertThat(dto.icon()).isEqualTo("graduation-cap");
        assertThat(dto.color()).isEqualTo("#7c3aed");
    }
}
