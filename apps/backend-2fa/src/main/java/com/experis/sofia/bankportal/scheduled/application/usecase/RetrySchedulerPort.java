package com.experis.sofia.bankportal.scheduled.application.usecase;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Puerto para programar reintentos diferidos (implementado en infra con Spring TaskScheduler).
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
public interface RetrySchedulerPort {
    void scheduleRetry(UUID scheduledTransferId, LocalDate scheduledDate, int delayHours);
}
