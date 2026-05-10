package com.experis.sofia.bankportal.savings.domain.service;

import com.experis.sofia.bankportal.savings.domain.model.GoalMilestone;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.GoalMilestoneRepositoryPort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Evaluador idempotente de hitos de objetivo (RN-F024-09).
 *
 * <p>Tras cada aportacion exitosa, evalua si el objetivo ha cruzado uno o varios
 * umbrales (25, 50, 75, 100). La idempotencia esta garantizada por:
 * <ol>
 *   <li>Verificacion previa via {@code existsByGoalIdAndPercent} (lectura).</li>
 *   <li>UK fisica {@code uk_goal_milestone(goal_id,percent)} (DDL §3.1) que protege
 *       frente a carreras concurrentes — el segundo hilo recibira DataIntegrityViolation
 *       y se traduce a {@link MilestoneAlreadyEmittedException} en el handler.</li>
 * </ol>
 *
 * <p>NOTA: este servicio NO emite notificaciones — solo persiste el hito. La emision
 * push se delega al consumidor (Application UC) que recibe la lista devuelta y
 * resuelve {@code notificationId} via el modulo notifications.
 *
 * @author SOFIA Developer Agent · Sprint 26 FEAT-024
 */
@Service
public class MilestoneEvaluator {

    private static final int[] THRESHOLDS = {25, 50, 75, 100};

    private final GoalMilestoneRepositoryPort milestoneRepo;

    public MilestoneEvaluator(GoalMilestoneRepositoryPort milestoneRepo) {
        this.milestoneRepo = milestoneRepo;
    }

    /**
     * Evalua un objetivo tras una aportacion y persiste los hitos cruzados que
     * no esten emitidos previamente.
     *
     * @param goal objetivo con estado actualizado (reservedAmount post-aportacion)
     * @return lista de hitos recien creados (puede estar vacia)
     */
    public List<GoalMilestone> evaluate(SavingsGoal goal) {
        List<GoalMilestone> created = new ArrayList<>();
        if (goal == null || goal.getTargetAmount() == null || goal.getTargetAmount().signum() == 0) {
            return created;
        }
        BigDecimal percentReached = goal.progressPercent(); // 0..100 con 2 decimales

        for (int threshold : THRESHOLDS) {
            if (percentReached.compareTo(BigDecimal.valueOf(threshold)) < 0) continue;
            if (milestoneRepo.existsByGoalIdAndPercent(goal.getId(), threshold)) continue;

            GoalMilestone m = new GoalMilestone();
            m.setId(UUID.randomUUID());
            m.setGoalId(goal.getId());
            m.setPercent(threshold);
            m.setReachedAt(Instant.now());
            try {
                created.add(milestoneRepo.save(m));
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                // Carrera concurrente: otro hilo persistio el mismo hito.
                // Idempotencia respetada — ignoramos.
            }
        }
        return created;
    }

    /**
     * Variante de solo lectura: lista los thresholds que el objetivo HA cruzado
     * (sin tener en cuenta los previamente emitidos). Util para auditorias.
     */
    public int[] thresholdsCrossed(SavingsGoal goal) {
        if (goal == null || goal.getTargetAmount() == null || goal.getTargetAmount().signum() == 0) {
            return new int[0];
        }
        BigDecimal pct = goal.progressPercent();
        int count = 0;
        for (int t : THRESHOLDS) if (pct.compareTo(BigDecimal.valueOf(t)) >= 0) count++;
        int[] out = new int[count];
        int idx = 0;
        for (int t : THRESHOLDS) if (pct.compareTo(BigDecimal.valueOf(t)) >= 0) out[idx++] = t;
        return out;
    }
}
