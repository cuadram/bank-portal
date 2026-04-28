package com.experis.sofia.bankportal.savings.infrastructure.persistence.jpa;

import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.infrastructure.persistence.entity.SavingsGoalEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data repository — {@link SavingsGoalEntity}.
 * <p>Metodos derivados cubren todas las firmas del puerto
 * {@code SavingsGoalRepositoryPort} (LLD §6 + handoff §5.D.2).</p>
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase D
 */
public interface JpaSavingsGoalRepository extends JpaRepository<SavingsGoalEntity, UUID> {

    List<SavingsGoalEntity> findByUserIdAndStatus(UUID userId, GoalStatus status);

    List<SavingsGoalEntity> findByUserId(UUID userId);

    long countByUserIdAndStatus(UUID userId, GoalStatus status);
}
