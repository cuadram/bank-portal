package com.experis.sofia.bankportal.scheduled.domain;

/**
 * Estado de un registro de ejecución individual.
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
public enum ExecutionStatus {
    SUCCESS,
    FAILED_RETRYING,
    SKIPPED,
    CANCELLED
}
