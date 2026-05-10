package com.experis.sofia.bankportal.savings.domain.repository;

import com.experis.sofia.bankportal.savings.domain.model.GoalMilestone;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GoalMilestoneRepositoryPort {
    GoalMilestone save(GoalMilestone milestone);
    List<GoalMilestone> findByGoalId(UUID goalId);
    Optional<GoalMilestone> findByGoalIdAndPercent(UUID goalId, int percent);
    boolean existsByGoalIdAndPercent(UUID goalId, int percent);
}
