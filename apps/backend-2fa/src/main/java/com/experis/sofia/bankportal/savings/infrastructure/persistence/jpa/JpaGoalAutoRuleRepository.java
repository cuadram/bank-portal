package com.experis.sofia.bankportal.savings.infrastructure.persistence.jpa;

import com.experis.sofia.bankportal.savings.infrastructure.persistence.entity.GoalAutoRuleEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data repository para GoalAutoRuleEntity.
 * findByGoalIdAndActiveTrue cubre findActiveByGoalId del puerto.
 * findDueAfterCursor implementa la paginacion por keyset del scheduler (DEBT-067).
 */
public interface JpaGoalAutoRuleRepository extends JpaRepository<GoalAutoRuleEntity, UUID> {

    Optional<GoalAutoRuleEntity> findByGoalIdAndActiveTrue(UUID goalId);

    @Query("SELECT r FROM GoalAutoRuleEntity r "
         + "WHERE r.active = true AND r.nextExecutionAt <= :now "
         + "AND (r.nextExecutionAt > :afterNext OR (r.nextExecutionAt = :afterNext AND r.id > :afterId)) "
         + "ORDER BY r.nextExecutionAt ASC, r.id ASC")
    List<GoalAutoRuleEntity> findDueAfterCursor(@Param("now") Instant now,
                                                @Param("afterNext") Instant afterNext,
                                                @Param("afterId") UUID afterId,
                                                Pageable pageable);
}
