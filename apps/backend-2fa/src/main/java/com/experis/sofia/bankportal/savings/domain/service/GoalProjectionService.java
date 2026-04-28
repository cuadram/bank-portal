package com.experis.sofia.bankportal.savings.domain.service;

import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Servicio de proyeccion lineal y sugerencia de aportacion mensual (RN-F024-08).
 *
 * <p>Proyeccion: fecha estimada en la que el objetivo se completara al ritmo actual
 * (importe reservado / dias transcurridos desde createdAt). Si reservedAmount=0 o el
 * ritmo es nulo, la proyeccion no es calculable.
 *
 * <p>Sugerencia mensual: importe que el cliente debe aportar cada mes para alcanzar
 * el objetivo en la fecha limite (targetDate).
 *
 * @author SOFIA Developer Agent · Sprint 26 FEAT-024
 */
@Service
public class GoalProjectionService {

    /**
     * Calcula la fecha proyectada de cumplimiento al ritmo actual.
     *
     * @param goal objetivo en estado ACTIVE
     * @param today fecha de referencia (normalmente LocalDate.now())
     * @return fecha proyectada o null si no es calculable (sin ritmo)
     */
    public LocalDate projectedCompletionDate(SavingsGoal goal, LocalDate today) {
        if (goal == null || goal.getCreatedAt() == null) return null;
        BigDecimal reserved = goal.getReservedAmount();
        BigDecimal target = goal.getTargetAmount();
        if (reserved == null || target == null || reserved.signum() <= 0) return null;
        if (reserved.compareTo(target) >= 0) return today;

        LocalDate createdDate = goal.getCreatedAt().atZone(java.time.ZoneOffset.UTC).toLocalDate();
        long daysElapsed = ChronoUnit.DAYS.between(createdDate, today);
        if (daysElapsed <= 0) return null;

        // ritmo diario = reserved / daysElapsed
        BigDecimal dailyRate = reserved.divide(BigDecimal.valueOf(daysElapsed), 6, RoundingMode.HALF_UP);
        if (dailyRate.signum() <= 0) return null;

        BigDecimal remaining = target.subtract(reserved);
        long daysToCompletion = remaining.divide(dailyRate, 0, RoundingMode.CEILING).longValueExact();

        return today.plusDays(daysToCompletion);
    }

    /**
     * Sugerencia de aportacion mensual para alcanzar targetDate (RN-F024-08).
     * = (target - reserved) / meses_restantes_hasta_targetDate
     *
     * @return sugerencia en EUR con 2 decimales, o BigDecimal.ZERO si no aplicable
     */
    public BigDecimal suggestedMonthlyContribution(SavingsGoal goal, LocalDate today) {
        if (goal == null || goal.getTargetDate() == null || goal.getTargetAmount() == null) return BigDecimal.ZERO;
        BigDecimal reserved = goal.getReservedAmount() == null ? BigDecimal.ZERO : goal.getReservedAmount();
        BigDecimal remaining = goal.getTargetAmount().subtract(reserved);
        if (remaining.signum() <= 0) return BigDecimal.ZERO;

        long monthsRemaining = ChronoUnit.MONTHS.between(today.withDayOfMonth(1), goal.getTargetDate().withDayOfMonth(1));
        if (monthsRemaining <= 0) {
            // Fecha objetivo en el pasado o este mes: la cantidad restante completa
            return remaining.setScale(2, RoundingMode.HALF_UP);
        }
        return remaining.divide(BigDecimal.valueOf(monthsRemaining), 2, RoundingMode.HALF_UP);
    }

    /**
     * True si el ritmo actual no permite alcanzar el objetivo dentro de targetDate.
     * Indicador visual de riesgo (RN-F024-08).
     */
    public boolean isAtRisk(SavingsGoal goal, LocalDate today) {
        LocalDate projected = projectedCompletionDate(goal, today);
        if (projected == null) return false;
        if (goal.getTargetDate() == null) return false;
        return projected.isAfter(goal.getTargetDate());
    }
}
