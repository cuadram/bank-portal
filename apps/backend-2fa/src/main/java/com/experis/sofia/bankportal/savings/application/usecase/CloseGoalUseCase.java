package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.CloseResultDto;
import com.experis.sofia.bankportal.savings.domain.exception.GoalAccessDeniedException;
import com.experis.sofia.bankportal.savings.domain.exception.GoalNotFoundException;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.service.GoalClosureService;
import com.experis.sofia.bankportal.twofa.application.OtpValidationUseCase;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * US-024-07: cerrar objetivo (soft-delete) liberando reserva.
 * RN-F024-12. SCA OTP requerido si reserved > 30 EUR (LLD §6.3).
 */
@Service
public class CloseGoalUseCase {

    private final SavingsGoalRepositoryPort goalRepo;
    private final GoalClosureService closureService;
    private final OtpValidationUseCase otpValidation;

    public CloseGoalUseCase(SavingsGoalRepositoryPort goalRepo,
                             GoalClosureService closureService,
                             OtpValidationUseCase otpValidation) {
        this.goalRepo = goalRepo;
        this.closureService = closureService;
        this.otpValidation = otpValidation;
    }

    /**
     * @param otp puede ser null si requiresSca=false (controller decide por flujo)
     */
    @Transactional
    public CloseResultDto execute(UUID userId, UUID goalId, String otp) {
        SavingsGoal goal = goalRepo.findById(goalId).orElseThrow(GoalNotFoundException::new);
        if (!goal.getUserId().equals(userId)) {
            throw new GoalAccessDeniedException();
        }

        if (closureService.requiresSca(goal)) {
            // SCA obligatorio (PSD2 + RN-F024-12 + LLD §6.3)
            otpValidation.validate(userId, otp);
        }

        BigDecimal returnedAmount = goal.getReservedAmount() == null ? BigDecimal.ZERO : goal.getReservedAmount();
        UUID returnAccountId = goal.getSourceAccountId();

        SavingsGoal closed = closureService.close(goalId);

        return new CloseResultDto(
            closed.getId(),
            returnedAmount,
            returnAccountId,
            closed.getClosedAt()
        );
    }
}
