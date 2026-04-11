package com.experis.sofia.bankportal.scheduled.application.usecase;

import java.util.UUID;

/**
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
public class ScheduledTransferNotFoundException extends RuntimeException {
    public ScheduledTransferNotFoundException(UUID id) {
        super("Transferencia programada no encontrada: " + id);
    }
}
