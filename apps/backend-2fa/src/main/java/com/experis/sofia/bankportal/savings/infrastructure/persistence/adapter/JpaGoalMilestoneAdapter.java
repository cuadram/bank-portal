package com.experis.sofia.bankportal.savings.infrastructure.persistence.adapter;

import com.experis.sofia.bankportal.savings.domain.model.GoalMilestone;
import com.experis.sofia.bankportal.savings.domain.repository.GoalMilestoneRepositoryPort;
import com.experis.sofia.bankportal.savings.infrastructure.persistence.entity.GoalMilestoneEntity;
import com.experis.sofia.bankportal.savings.infrastructure.persistence.jpa.JpaGoalMilestoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Adapter JPA — implementa {@link GoalMilestoneRepositoryPort}.
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase D
 */
@Component
@Primary
@RequiredArgsConstructor
public class JpaGoalMilestoneAdapter implements GoalMilestoneRepositoryPort {

    private final JpaGoalMilestoneRepository jpa;

    @Override
    public GoalMilestone save(GoalMilestone milestone) {
        GoalMilestoneEntity saved = jpa.save(toEntity(milestone));
        return toDomain(saved);
    }

    @Override
    public List<GoalMilestone> findByGoalId(UUID goalId) {
        return jpa.findByGoalIdOrderByPercentAsc(goalId).stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<GoalMilestone> findByGoalIdAndPercent(UUID goalId, int percent) {
        return jpa.findByGoalIdAndPercent(goalId, percent).map(this::toDomain);
    }

    @Override
    public boolean existsByGoalIdAndPercent(UUID goalId, int percent) {
        return jpa.existsByGoalIdAndPercent(goalId, percent);
    }

    // ── Mapeo Entity ↔ Domain ────────────────────────────────────────────────

    private GoalMilestone toDomain(GoalMilestoneEntity e) {
        GoalMilestone m = new GoalMilestone();
        m.setId(e.getId());
        m.setGoalId(e.getGoalId());
        m.setPercent(e.getPercent());
        m.setReachedAt(e.getReachedAt());
        m.setNotificationId(e.getNotificationId());
        return m;
    }

    private GoalMilestoneEntity toEntity(GoalMilestone m) {
        GoalMilestoneEntity e = new GoalMilestoneEntity();
        e.setId(m.getId());
        e.setGoalId(m.getGoalId());
        e.setPercent(m.getPercent());
        e.setReachedAt(m.getReachedAt());
        e.setNotificationId(m.getNotificationId());
        return e;
    }
}
