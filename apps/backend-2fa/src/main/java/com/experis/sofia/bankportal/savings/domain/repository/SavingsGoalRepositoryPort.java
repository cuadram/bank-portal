package com.experis.sofia.bankportal.savings.domain.repository;

import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SavingsGoalRepositoryPort {
    SavingsGoal save(SavingsGoal goal);
    Optional<SavingsGoal> findById(UUID id);
    List<SavingsGoal> findByUserIdAndStatus(UUID userId, GoalStatus status);
    List<SavingsGoal> findByUserId(UUID userId);
    long countByUserIdAndStatus(UUID userId, GoalStatus status);
    void deleteById(UUID id);
}
