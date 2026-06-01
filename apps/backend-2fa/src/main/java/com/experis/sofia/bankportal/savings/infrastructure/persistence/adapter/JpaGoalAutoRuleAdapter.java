package com.experis.sofia.bankportal.savings.infrastructure.persistence.adapter;

import com.experis.sofia.bankportal.savings.domain.model.GoalAutoRule;
import com.experis.sofia.bankportal.savings.domain.repository.GoalAutoRuleRepositoryPort;
import com.experis.sofia.bankportal.savings.infrastructure.persistence.entity.GoalAutoRuleEntity;
import com.experis.sofia.bankportal.savings.infrastructure.persistence.jpa.JpaGoalAutoRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Adapter JPA — implementa {@link GoalAutoRuleRepositoryPort}.
 *
 * <p>{@code findDueForExecution(now)} se mapea a la query derivada
 * {@code findByActiveTrueAndNextExecutionAtLessThanEqual} (LLD §6.2: el
 * scheduler procesa todas las reglas con next_execution_at &lt;= now).</p>
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase D
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
    public Page<GoalAutoRule> findDueForExecution(Instant now, Pageable pageable) {
        return jpa.findByActiveTrueAndNextExecutionAtLessThanEqual(now, pageable)
                .map(this::toDomain);
    }

    @Override
    public void deleteById(UUID id) {
        jpa.deleteById(id);
    }

    // ── Mapeo Entity ↔ Domain ────────────────────────────────────────────────

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
