package com.experis.sofia.bankportal.savings.domain.repository;

import com.experis.sofia.bankportal.savings.domain.model.GoalAutoRule;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Optional;
import java.util.UUID;

public interface GoalAutoRuleRepositoryPort {
    GoalAutoRule save(GoalAutoRule rule);
    Optional<GoalAutoRule> findById(UUID id);
    Optional<GoalAutoRule> findActiveByGoalId(UUID goalId);
    Page<GoalAutoRule> findDueForExecution(java.time.Instant now, Pageable pageable);
    void deleteById(UUID id);
}
