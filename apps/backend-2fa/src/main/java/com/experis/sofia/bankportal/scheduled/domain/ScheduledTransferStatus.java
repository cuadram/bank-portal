package com.experis.sofia.bankportal.scheduled.domain;

/**
 * Ciclo de vida de una transferencia programada.
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
public enum ScheduledTransferStatus {
    /** Creada, primera ejecución aún no alcanzada. */
    PENDING,
    /** Al menos una ejecución completada, recurrencia activa. */
    ACTIVE,
    /** Pausada por el usuario — scheduler la omite. */
    PAUSED,
    /** Completada: ONCE ejecutada, o recurrente que alcanzó endDate/maxExecutions. */
    COMPLETED,
    /** Todos los reintentos agotados sin éxito. */
    FAILED,
    /** Cancelada manualmente por el usuario. */
    CANCELLED
}
