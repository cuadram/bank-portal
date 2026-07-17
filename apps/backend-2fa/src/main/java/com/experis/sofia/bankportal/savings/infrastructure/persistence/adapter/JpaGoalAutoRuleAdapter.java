package com.experis.sofia.bankportal.savings.infrastructure.persistence.adapter;

import com.experis.sofia.bankportal.savings.domain.model.GoalAutoRule;
import com.experis.sofia.bankportal.savings.domain.repository.GoalAutoRuleRepositoryPort;
import com.experis.sofia.bankportal.savings.infrastructure.persistence.entity.GoalAutoRuleEntity;
import com.experis.sofia.bankportal.savings.infrastructure.persistence.jpa.JpaGoalAutoRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Adapter JPA que implementa GoalAutoRuleRepositoryPort.
 * findDueForExecutionAfter usa keyset (seek) via findDueAfterCursor (DEBT-067).
 */
@Component
@Primary
@RequiredArgsConstructor
public class JpaGoalAutoRuleAdapter implements GoalAutoRuleRepositoryPort {

    private final JpaGoalAutoRuleRepository jpa;

    @Override
    public GoalAutoRule save(GoalAutoRule rule) {
        GoalAutoRuleEntity saved = jpa.save(toEntity(rule));
        return toDomain(saved);
    }

    @Override
    public Optional<GoalAutoRule> findById(UUID id) {
        return jpa.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<GoalAutoRule> findActiveByGoalId(UUID goalId) {
        return jpa.findByGoalIdAndActiveTrue(goalId).map(this::toDomain);
    }

    @Override
    public List<GoalAutoRule> findDueForExecutionAfter(Instant now, Instant afterNextExec, UUID afterId, int limit) {
        return jpa.findDueAfterCursor(now, afterNextExec, afterId, PageRequest.of(0, limit))
                .stream().map(this::toDomain).toList();
    }

    @Override
    public void deleteById(UUID id) {
        jpa.deleteById(id);
    }

    private GoalAutoRule toDomain(GoalAutoRuleEntity e) {
        GoalAutoRule r = new GoalAutoRule();
        r.setId(e.getId());
        r.setGoalId(e.getGoalId());
        r.setAmount(e.getAmount());
        r.setDayOfMonth(e.getDayOfMonth());
        r.setSourceAccountId(e.getSourceAccountId());
        r.setActive(e.isActive());
        r.setNextExecutionAt(e.getNextExecutionAt());
        r.setLastExecutionAt(e.getLastExecutionAt());
        r.setCreatedAt(e.getCreatedAt());
        return r;
    }

    private GoalAutoRuleEntity toEntity(GoalAutoRule r) {
        GoalAutoRuleEntity e = new GoalAutoRuleEntity();
        e.setId(r.getId());
        e.setGoalId(r.getGoalId());
        e.setAmount(r.getAmount());
        e.setDayOfMonth(r.getDayOfMonth());
        e.setSourceAccountId(r.getSourceAccountId());
        e.setActive(r.isActive());
        e.setNextExecutionAt(r.getNextExecutionAt());
        e.setLastExecutionAt(r.getLastExecutionAt());
        e.setCreatedAt(r.getCreatedAt());
        return e;
    }
}
