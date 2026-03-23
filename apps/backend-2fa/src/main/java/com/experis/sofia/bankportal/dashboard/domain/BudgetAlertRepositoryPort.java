package com.experis.sofia.bankportal.dashboard.domain;

import com.experis.sofia.bankportal.dashboard.application.dto.BudgetAlertDto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Puerto de salida — alertas de presupuesto.
 * FEAT-010 US-1005 Sprint 12.
 *
 * @author SOFIA Developer Agent
 */
public interface BudgetAlertRepositoryPort {

    /** Registra una alerta disparada. Ignora si ya existe (UNIQUE constraint). */
    void saveAlert(UUID userId, String period, BigDecimal monthlyBudget,
                   int thresholdPct, BigDecimal currentAmount);

    /** Lista alertas del usuario para el período actual y últimos 3 meses. */
    List<BudgetAlertDto> findRecentAlerts(UUID userId, String currentPeriod);

    /** Marca la alerta como notificada (email enviado). */
    void markNotified(UUID userId, String period);

    /** Comprueba si ya existe una alerta para el período. */
    boolean existsForPeriod(UUID userId, String period);
}
