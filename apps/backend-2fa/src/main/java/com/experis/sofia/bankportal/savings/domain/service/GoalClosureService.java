package com.experis.sofia.bankportal.savings.domain.service;

import com.experis.sofia.bankportal.account.domain.AccountReservePort;
import com.experis.sofia.bankportal.savings.domain.exception.GoalNotFoundException;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Servicio de cierre de objetivos (RN-F024-12).
 *
 * <p>Responsabilidades:
 * <ol>
 *   <li>Determinar si el cierre requiere SCA (umbral configurable, default 30 EUR).</li>
 *   <li>Liberar reserva atomica via {@link AccountReservePort#release}.</li>
 *   <li>Marcar el objetivo como CLOSED + closedAt=now (soft-delete LLD §3.2).</li>
 *   <li>Conservar histórico {@code goal_allocations} y {@code goal_milestones} para
 *       retencion fiscal 6 anios (Ley 10/2010 PBC/FT).</li>
 * </ol>
 *
 * <p>La verificacion OTP en si la realiza el controller (LLD §6.3 - precondicion).
 * Este servicio asume que el OTP ya esta validado cuando se invoca {@link #close}.
 *
 * @author SOFIA Developer Agent · Sprint 26 FEAT-024
 */
@Service
public class GoalClosureService {

    private final SavingsGoalRepositoryPort goalRepo;
    private final AccountReservePort accountReserve;

    @Value("${bank.savings.closure.sca-threshold:30}")
    private BigDecimal scaThreshold;

    public GoalClosureService(SavingsGoalRepositoryPort goalRepo,
                               AccountReservePort accountReserve) {
        this.goalRepo = goalRepo;
        this.accountReserve = accountReserve;
    }

    /**
     * Determina si el cierre del objetivo requiere SCA (segundo factor).
     * Umbral configurable {@code bank.savings.closure.sca-threshold} (default 30 EUR).
     */
    public boolean requiresSca(SavingsGoal goal) {
        if (goal == null) return false;
        BigDecimal reserved = goal.getReservedAmount() == null ? BigDecimal.ZERO : goal.getReservedAmount();
        return reserved.compareTo(scaThreshold) > 0;
    }

    /**
     * Cierra el objetivo, liberando la reserva sobre la cuenta origen y persistiendo
     * el cambio de estado a CLOSED. Operacion idempotente: si el objetivo ya estaba
     * cerrado, se devuelve sin error.
     *
     * <p>NOTA: el caller debe ejecutar este metodo dentro de una transaccion
     * @Transactional(propagation=REQUIRED) para que release y updateStatus sean
     * atomicos (LLD §6.3 + §9 transaccionalidad).
     *
     * @param goalId identificador del objetivo
     * @return el objetivo en estado CLOSED
     * @throws GoalNotFoundException si no existe
     */
    public SavingsGoal close(UUID goalId) {
        SavingsGoal goal = goalRepo.findById(goalId)
            .orElseThrow(GoalNotFoundException::new);

        if (goal.getStatus() == GoalStatus.CLOSED) {
            // Idempotencia: ya cerrado, no hacemos nada
            return goal;
        }
        if (!goal.canBeClosed()) {
            throw new IllegalStateException(
                "Objetivo en estado " + goal.getStatus() + " no se puede cerrar");
        }

        BigDecimal reserved = goal.getReservedAmount() == null ? BigDecimal.ZERO : goal.getReservedAmount();
        UUID sourceAccount = goal.getSourceAccountId();

        // Liberar reserva (si la hay)
        if (reserved.signum() > 0 && sourceAccount != null) {
            accountReserve.release(sourceAccount, reserved);
        }

        // Marcar objetivo como cerrado
        goal.setStatus(GoalStatus.CLOSED);
        goal.setClosedAt(Instant.now());
        goal.setUpdatedAt(Instant.now());
        // No tocamos reservedAmount: queda como "reservado historico" hasta retencion 6 anios
        return goalRepo.save(goal);
    }
}
