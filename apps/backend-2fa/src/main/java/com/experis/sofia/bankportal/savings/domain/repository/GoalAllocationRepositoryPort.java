package com.experis.sofia.bankportal.savings.domain.repository;

import com.experis.sofia.bankportal.savings.domain.model.GoalAllocation;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GoalAllocationRepositoryPort {
    GoalAllocation save(GoalAllocation allocation);
    Optional<GoalAllocation> findById(UUID id);
    List<GoalAllocation> findByGoalId(UUID goalId, int page, int size);
    Optional<GoalAllocation> findByGoalIdAndAllocationMonth(UUID goalId, String allocationMonth);
}
