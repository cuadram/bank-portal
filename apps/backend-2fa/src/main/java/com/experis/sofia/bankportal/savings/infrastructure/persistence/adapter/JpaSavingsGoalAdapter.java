package com.experis.sofia.bankportal.savings.infrastructure.persistence.adapter;

import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import com.experis.sofia.bankportal.savings.infrastructure.persistence.entity.SavingsGoalEntity;
import com.experis.sofia.bankportal.savings.infrastructure.persistence.jpa.JpaSavingsGoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Adapter JPA — implementa {@link SavingsGoalRepositoryPort} delegando en
 * {@link JpaSavingsGoalRepository}. Mapea Entity↔Domain.
 *
 * <p>{@code @Primary} sin {@code @Profile} (LA-019-08): activo en dev/staging/prod.
 * El Mock equivalente lleva {@code @Profile("mock")} para tests.</p>
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase D
 */
@Component
@Primary
@RequiredArgsConstructor
public class JpaSavingsGoalAdapter implements SavingsGoalRepositoryPort {

    private final JpaSavingsGoalRepository jpa;

    @Override
    public SavingsGoal save(SavingsGoal goal) {
        SavingsGoalEntity saved = jpa.save(toEntity(goal));
        return toDomain(saved);
    }

    @Override
    public Optional<SavingsGoal> findById(UUID id) {
        return jpa.findById(id).map(this::toDomain);
    }

    @Override
    public List<SavingsGoal> findByUserIdAndStatus(UUID userId, GoalStatus status) {
        return jpa.findByUserIdAndStatus(userId, status).stream().map(this::toDomain).toList();
    }

    @Override
    public List<SavingsGoal> findByUserId(UUID userId) {
        return jpa.findByUserId(userId).stream().map(this::toDomain).toList();
    }

    @Override
    public long countByUserIdAndStatus(UUID userId, GoalStatus status) {
        return jpa.countByUserIdAndStatus(userId, status);
    }

    @Override
    public void deleteById(UUID id) {
        // NUNCA se invoca en flujo normal (LLD §3.2 soft-delete via closed_at).
        // Mantenido para satisfacer el contrato del puerto y posibles tests.
        jpa.deleteById(id);
    }

    // ── Mapeo Entity ↔ Domain ────────────────────────────────────────────────

    private SavingsGoal toDomain(SavingsGoalEntity e) {
        SavingsGoal g = new SavingsGoal();
        g.setId(e.getId());
        g.setUserId(e.getUserId());
        g.setName(e.getName());
        g.setTargetAmount(e.getTargetAmount());
        g.setReservedAmount(e.getReservedAmount());
        g.setTargetDate(e.getTargetDate());
        g.setCategory(e.getCategory());
        g.setCustomCategory(e.getCustomCategory());
        g.setIcon(e.getIcon());
        g.setColor(e.getColor());
        g.setStatus(e.getStatus());
        g.setSourceAccountId(e.getSourceAccountId());
        g.setCreatedAt(e.getCreatedAt());
        g.setUpdatedAt(e.getUpdatedAt());
        g.setClosedAt(e.getClosedAt());
        return g;
    }

    private SavingsGoalEntity toEntity(SavingsGoal g) {
        SavingsGoalEntity e = new SavingsGoalEntity();
        e.setId(g.getId());
        e.setUserId(g.getUserId());
        e.setName(g.getName());
        e.setTargetAmount(g.getTargetAmount());
        e.setReservedAmount(g.getReservedAmount());
        e.setTargetDate(g.getTargetDate());
        e.setCategory(g.getCategory());
        e.setCustomCategory(g.getCustomCategory());
        e.setIcon(g.getIcon());
        e.setColor(g.getColor());
        e.setStatus(g.getStatus());
        e.setSourceAccountId(g.getSourceAccountId());
        e.setCreatedAt(g.getCreatedAt());
        e.setUpdatedAt(g.getUpdatedAt());
        e.setClosedAt(g.getClosedAt());
        return e;
    }
}
