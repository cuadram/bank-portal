package com.experis.sofia.bankportal.savings.domain.repository;

import com.experis.sofia.bankportal.savings.domain.model.GoalAutoRule;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GoalAutoRuleRepositoryPort {
    GoalAutoRule save(GoalAutoRule rule);
    Optional<GoalAutoRule> findById(UUID id);
    Optional<GoalAutoRule> findActiveByGoalId(UUID goalId);

    // DEBT-067 (S27): paginacion por keyset (seek) para evitar la starvation del
    // drain-pagina-0 (LA-027-06). Devuelve hasta limit reglas activas con
    // next_execution_at <= now cuya clave (next_execution_at, id) es estrictamente
    // mayor que (afterNextExec, afterId), ordenadas por (next_execution_at, id).
    List<GoalAutoRule> findDueForExecutionAfter(Instant now, Instant afterNextExec, UUID afterId, int limit);

    void deleteById(UUID id);
}
