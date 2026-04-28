package com.experis.sofia.bankportal.savings.infrastructure.persistence.jpa;

import com.experis.sofia.bankportal.savings.infrastructure.persistence.entity.GoalAutoRuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data repository — {@link GoalAutoRuleEntity}.
 * <p>{@code findByGoalIdAndActiveTrue} cubre {@code findActiveByGoalId} del puerto.
 * {@code findByActiveTrueAndNextExecutionAtLessThanEqual} cubre
 * {@code findDueForExecution(now)} del puerto (handoff §5.D.2).</p>
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase D
 */
public interface JpaGoalAutoRuleRepository extends JpaRepository<GoalAutoRuleEntity, UUID> {

    Optional<GoalAutoRuleEntity> findByGoalIdAndActiveTrue(UUID goalId);

    List<GoalAutoRuleEntity> findByActiveTrueAndNextExecutionAtLessThanEqual(Instant now);
}
