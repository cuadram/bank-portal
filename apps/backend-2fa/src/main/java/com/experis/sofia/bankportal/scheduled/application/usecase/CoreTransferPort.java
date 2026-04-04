package com.experis.sofia.bankportal.scheduled.application.usecase;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Puerto de salida hacia el core de transferencias (FEAT-008/009).
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
public interface CoreTransferPort {
    CoreTransferResult execute(UUID sourceAccountId, String destinationIban,
                               BigDecimal amount, String concept);
}
