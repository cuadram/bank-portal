package com.experis.sofia.bankportal.savings.domain.repository;

import com.experis.sofia.bankportal.savings.domain.model.GoalAutoRule;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GoalAutoRuleRepositoryPort {
    GoalAutoRule save(GoalAutoRule rule);
    Optional<GoalAutoRule> findById(UUID id);
    Optional<GoalAutoRule> findActiveByGoalId(UUID goalId);
    List<GoalAutoRule> findDueForExecution(java.time.Instant now);
    void deleteById(UUID id);
}
