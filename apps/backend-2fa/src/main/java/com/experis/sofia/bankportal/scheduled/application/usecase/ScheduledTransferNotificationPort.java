package com.experis.sofia.bankportal.scheduled.application.usecase;

import com.experis.sofia.bankportal.scheduled.domain.ScheduledTransfer;
import java.time.LocalDate;

/**
 * Puerto de salida para notificaciones push + email de transferencias programadas.
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
public interface ScheduledTransferNotificationPort {
    void notifySuccess(ScheduledTransfer transfer, LocalDate executionDate);
    void notifyFailure(ScheduledTransfer transfer, LocalDate executionDate, String reason);
}
