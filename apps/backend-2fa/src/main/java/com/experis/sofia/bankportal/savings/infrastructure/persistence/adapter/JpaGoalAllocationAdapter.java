package com.experis.sofia.bankportal.savings.infrastructure.persistence.adapter;

import com.experis.sofia.bankportal.savings.domain.model.GoalAllocation;
import com.experis.sofia.bankportal.savings.domain.repository.GoalAllocationRepositoryPort;
import com.experis.sofia.bankportal.savings.infrastructure.persistence.entity.GoalAllocationEntity;
import com.experis.sofia.bankportal.savings.infrastructure.persistence.jpa.JpaGoalAllocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Adapter JPA — implementa {@link GoalAllocationRepositoryPort}.
 * <p>El metodo {@code findByGoalId(goalId, page, size)} traduce los enteros
 * a {@link PageRequest} y delega en {@code findByGoalIdOrderByExecutedAtDesc}.</p>
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase D
 */
@Component
@Primary
@RequiredArgsConstructor
public class JpaGoalAllocationAdapter implements GoalAllocationRepositoryPort {

    private final JpaGoalAllocationRepository jpa;

    @Override
    public GoalAllocation save(GoalAllocation allocation) {
        GoalAllocationEntity saved = jpa.save(toEntity(allocation));
        return toDomain(saved);
    }

    @Override
    public Optional<GoalAllocation> findById(UUID id) {
        return jpa.findById(id).map(this::toDomain);
    }

    @Override
    public List<GoalAllocation> findByGoalId(UUID goalId, int page, int size) {
        return jpa.findByGoalIdOrderByExecutedAtDesc(goalId, PageRequest.of(page, size))
                .stream().map(this::toDomain).toList();
    }

    @Override
    public Optional<GoalAllocation> findByGoalIdAndAllocationMonth(UUID goalId, String allocationMonth) {
        return jpa.findByGoalIdAndAllocationMonth(goalId, allocationMonth).map(this::toDomain);
    }

    // ── Mapeo Entity ↔ Domain ────────────────────────────────────────────────

    private GoalAllocation toDomain(GoalAllocationEntity e) {
        GoalAllocation a = new GoalAllocation();
        a.setId(e.getId());
        a.setGoalId(e.getGoalId());
        a.setAmount(e.getAmount());
        a.setAllocationType(e.getAllocationType());
        a.setSourceAccountId(e.getSourceAccountId());
        a.setRuleId(e.getRuleId());
        a.setAllocationMonth(e.getAllocationMonth());
        a.setStatus(e.getStatus());
        a.setFailureReason(e.getFailureReason());
        a.setExecutedAt(e.getExecutedAt());
        return a;
    }

    private GoalAllocationEntity toEntity(GoalAllocation a) {
        GoalAllocationEntity e = new GoalAllocationEntity();
        e.setId(a.getId());
        e.setGoalId(a.getGoalId());
        e.setAmount(a.getAmount());
        e.setAllocationType(a.getAllocationType());
        e.setSourceAccountId(a.getSourceAccountId());
        e.setRuleId(a.getRuleId());
        e.setAllocationMonth(a.getAllocationMonth());
        e.setStatus(a.getStatus());
        e.setFailureReason(a.getFailureReason());
        e.setExecutedAt(a.getExecutedAt());
        return e;
    }
}
