package com.experis.sofia.bankportal.scheduled.domain;

/**
 * Tipo de recurrencia de una transferencia programada.
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
public enum ScheduledTransferType {
    /** Ejecución única en fecha concreta. */
    ONCE,
    /** Cada 7 días a partir de scheduledDate. */
    WEEKLY,
    /** Cada 14 días a partir de scheduledDate. */
    BIWEEKLY,
    /** Mismo día del mes (o último día si el mes es más corto). */
    MONTHLY
}
