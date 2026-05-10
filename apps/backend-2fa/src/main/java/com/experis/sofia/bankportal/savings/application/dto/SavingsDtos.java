package com.experis.sofia.bankportal.savings.application.dto;

import com.experis.sofia.bankportal.savings.domain.model.AllocationStatus;
import com.experis.sofia.bankportal.savings.domain.model.AllocationType;
import com.experis.sofia.bankportal.savings.domain.model.GoalCategory;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Contenedor de DTOs (records) del bounded context savings (FEAT-024).
 *
 * <p>Estructura: 11 records top-level + 1 nested ({@code WidgetDto.WidgetGoalSummary}).
 * Cada record es inmutable, sin setters, con validaciones jakarta.validation
 * aplicadas en el controller via @Valid.
 *
 * @author SOFIA Developer Agent · Sprint 26 · LLD §7
 */
public final class SavingsDtos {

    private SavingsDtos() {}

    public record CreateGoalRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull @DecimalMin("100") @DecimalMax("500000") BigDecimal targetAmount,
        @NotNull @Future LocalDate targetDate,
        @NotNull GoalCategory category,
        @Size(max = 50) String customCategory,
        @Size(max = 30) String icon,
        @Size(max = 10) String color,
        UUID sourceAccountId
    ) {}

    public record UpdateGoalRequest(
        @Size(max = 100) String name,
        @DecimalMin("100") @DecimalMax("500000") BigDecimal targetAmount,
        @Future LocalDate targetDate,
        GoalStatus status
    ) {}

    public record ContributeRequest(
        @NotNull @DecimalMin("10") @DecimalMax("5000") BigDecimal amount,
        @NotNull UUID sourceAccountId
    ) {}

    public record AutoRuleRequest(
        @NotNull @DecimalMin("10") @DecimalMax("5000") BigDecimal amount,
        @NotNull @Min(1) @Max(28) Short dayOfMonth,
        @NotNull UUID sourceAccountId
    ) {}

    public record SavingsGoalDto(
        UUID id,
        String name,
        BigDecimal targetAmount,
        BigDecimal reservedAmount,
        LocalDate targetDate,
        GoalCategory category,
        String customCategory,
        String icon,
        String color,
        GoalStatus status,
        UUID sourceAccountId,
        Instant createdAt,
        BigDecimal progressPct,
        BigDecimal suggestedMonthlyContribution,
        boolean projectionRisk
    ) {}

    public record GoalDetailDto(
        SavingsGoalDto goal,
        List<AllocationDto> recentAllocations,
        List<MilestoneDto> milestones,
        AutoRuleDto autoRule
    ) {}

    public record AllocationDto(
        UUID id,
        BigDecimal amount,
        AllocationType type,
        UUID sourceAccountId,
        String allocationMonth,
        AllocationStatus status,
        String failureReason,
        Instant executedAt
    ) {}

    public record AutoRuleDto(
        UUID id,
        BigDecimal amount,
        short dayOfMonth,
        UUID sourceAccountId,
        boolean active,
        Instant nextExecutionAt,
        Instant lastExecutionAt
    ) {}

    public record MilestoneDto(
        UUID id,
        short percent,
        Instant reachedAt
    ) {}

    public record CloseResultDto(
        UUID goalId,
        BigDecimal returnedAmount,
        UUID returnAccountId,
        Instant closedAt
    ) {}

    public record WidgetDto(
        int activeGoalsCount,
        BigDecimal totalReserved,
        BigDecimal totalTarget,
        BigDecimal globalProgressPct,
        List<WidgetGoalSummary> topGoals
    ) {
        public record WidgetGoalSummary(
            UUID id,
            String name,
            String icon,
            BigDecimal progressPct
        ) {}
    }

    public record ProcessAutoRuleResult(
        UUID ruleId,
        AllocationStatus status,
        String failureReason
    ) {}
}
