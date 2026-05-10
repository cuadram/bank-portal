package com.experis.sofia.bankportal.savings.infrastructure.persistence.jpa;

import com.experis.sofia.bankportal.savings.infrastructure.persistence.entity.GoalMilestoneEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data repository — {@link GoalMilestoneEntity}.
 * <p>Metodos derivados para idempotencia de hitos (RN-F024-09) — la UK
 * (goal_id, percent) protege concurrentemente, y {@code existsByGoalIdAndPercent}
 * permite check defensivo en {@code MilestoneEvaluator}.</p>
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase D
 */
public interface JpaGoalMilestoneRepository extends JpaRepository<GoalMilestoneEntity, UUID> {

    List<GoalMilestoneEntity> findByGoalIdOrderByPercentAsc(UUID goalId);

    Optional<GoalMilestoneEntity> findByGoalIdAndPercent(UUID goalId, int percent);

    boolean existsByGoalIdAndPercent(UUID goalId, int percent);
}
