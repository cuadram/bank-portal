package com.experis.sofia.bankportal.savings.application.usecase;

import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.AllocationDto;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.AutoRuleDto;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.GoalDetailDto;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.MilestoneDto;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.SavingsGoalDto;
import com.experis.sofia.bankportal.savings.domain.exception.GoalAccessDeniedException;
import com.experis.sofia.bankportal.savings.domain.exception.GoalNotFoundException;
import com.experis.sofia.bankportal.savings.domain.model.GoalAllocation;
import com.experis.sofia.bankportal.savings.domain.model.GoalAutoRule;
import com.experis.sofia.bankportal.savings.domain.model.GoalMilestone;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.GoalAllocationRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.repository.GoalAutoRuleRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.repository.GoalMilestoneRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import com.experis.sofia.bankportal.savings.domain.service.GoalProjectionService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * US-024-02b: detalle del objetivo con aportaciones recientes, hitos y regla auto.
 */
@Service
public class GetGoalDetailUseCase {

    private static final int RECENT_ALLOCATIONS_PAGE_SIZE = 20;

    private final SavingsGoalRepositoryPort goalRepo;
    private final GoalAllocationRepositoryPort allocationRepo;
    private final GoalMilestoneRepositoryPort milestoneRepo;
    private final GoalAutoRuleRepositoryPort autoRuleRepo;
    private final GoalProjectionService projectionService;

    public GetGoalDetailUseCase(SavingsGoalRepositoryPort goalRepo,
                                 GoalAllocationRepositoryPort allocationRepo,
                                 GoalMilestoneRepositoryPort milestoneRepo,
                                 GoalAutoRuleRepositoryPort autoRuleRepo,
                                 GoalProjectionService projectionService) {
        this.goalRepo = goalRepo;
        this.allocationRepo = allocationRepo;
        this.milestoneRepo = milestoneRepo;
        this.autoRuleRepo = autoRuleRepo;
        this.projectionService = projectionService;
    }

    public GoalDetailDto execute(UUID userId, UUID goalId) {
        SavingsGoal goal = goalRepo.findById(goalId).orElseThrow(GoalNotFoundException::new);
        if (!goal.getUserId().equals(userId)) {
            throw new GoalAccessDeniedException();
        }

        SavingsGoalDto goalDto = toGoalDto(goal);
        List<AllocationDto> allocations = allocationRepo.findByGoalId(goalId, 0, RECENT_ALLOCATIONS_PAGE_SIZE)
            .stream().map(this::toAllocationDto).toList();
        List<MilestoneDto> milestones = milestoneRepo.findByGoalId(goalId)
            .stream().map(this::toMilestoneDto).toList();
        AutoRuleDto autoRule = autoRuleRepo.findActiveByGoalId(goalId)
            .map(this::toAutoRuleDto).orElse(null);

        return new GoalDetailDto(goalDto, allocations, milestones, autoRule);
    }

    private SavingsGoalDto toGoalDto(SavingsGoal g) {
        LocalDate today = LocalDate.now();
        BigDecimal suggested = projectionService.suggestedMonthlyContribution(g, today);
        boolean risk = projectionService.isAtRisk(g, today);
        return new SavingsGoalDto(
            g.getId(), g.getName(), g.getTargetAmount(), g.getReservedAmount(),
            g.getTargetDate(), g.getCategory(), g.getCustomCategory(),
            g.getIcon(), g.getColor(), g.getStatus(), g.getSourceAccountId(),
            g.getCreatedAt(), g.progressPercent(), suggested, risk
        );
    }

    private AllocationDto toAllocationDto(GoalAllocation a) {
        return new AllocationDto(
            a.getId(), a.getAmount(), a.getAllocationType(), a.getSourceAccountId(),
            a.getAllocationMonth(), a.getStatus(), a.getFailureReason(), a.getExecutedAt()
        );
    }

    private MilestoneDto toMilestoneDto(GoalMilestone m) {
        return new MilestoneDto(m.getId(), (short) m.getPercent(), m.getReachedAt());
    }

    private AutoRuleDto toAutoRuleDto(GoalAutoRule r) {
        return new AutoRuleDto(
            r.getId(), r.getAmount(), (short) r.getDayOfMonth(), r.getSourceAccountId(),
            r.isActive(), r.getNextExecutionAt(), r.getLastExecutionAt()
        );
    }
}
