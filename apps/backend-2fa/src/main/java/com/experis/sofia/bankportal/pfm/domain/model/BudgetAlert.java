package com.experis.sofia.bankportal.pfm.domain.model;

import java.time.Instant;
import java.time.YearMonth;
import java.util.UUID;

/**
 * Registro de alerta de presupuesto emitida.
 * RN-F023-09: 1 alerta/presupuesto/mes.
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
public class BudgetAlert {

    private final UUID      id;
    private final UUID      budgetId;
    private final YearMonth alertMonth;
    private final Instant   emittedAt;

    public BudgetAlert(UUID id, UUID budgetId, YearMonth alertMonth, Instant emittedAt) {
        this.id         = id;
        this.budgetId   = budgetId;
        this.alertMonth = alertMonth;
        this.emittedAt  = emittedAt;
    }

    public UUID      getId()         { return id; }
    public UUID      getBudgetId()   { return budgetId; }
    public YearMonth getAlertMonth() { return alertMonth; }
    public Instant   getEmittedAt()  { return emittedAt; }
}
