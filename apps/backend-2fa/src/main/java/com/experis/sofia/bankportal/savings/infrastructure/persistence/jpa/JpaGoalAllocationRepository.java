package com.experis.sofia.bankportal.savings.infrastructure.persistence.jpa;

import com.experis.sofia.bankportal.savings.infrastructure.persistence.entity.GoalAllocationEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data repository — {@link GoalAllocationEntity}.
 * <p>El metodo paginado {@code findByGoalIdOrderByExecutedAtDesc} cubre la
 * firma {@code findByGoalId(goalId, page, size)} del puerto: el adapter
 * construye {@link Pageable} desde los argumentos page/size.</p>
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase D
 */
public interface JpaGoalAllocationRepository extends JpaRepository<GoalAllocationEntity, UUID> {

    List<GoalAllocationEntity> findByGoalIdOrderByExecutedAtDesc(UUID goalId, Pageable pageable);

    Optional<GoalAllocationEntity> findByGoalIdAndAllocationMonth(UUID goalId, String allocationMonth);
}
