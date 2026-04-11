package com.experis.sofia.bankportal.scheduled.application.usecase;

import java.util.UUID;

/**
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
public record CoreTransferResult(
        boolean success,
        UUID transferId,
        boolean isInsufficientFunds,
        String failureReason
) {
    public static CoreTransferResult ok(UUID transferId) {
        return new CoreTransferResult(true, transferId, false, null);
    }
    public static CoreTransferResult insufficientFunds() {
        return new CoreTransferResult(false, null, true, "INSUFFICIENT_FUNDS");
    }
    public static CoreTransferResult failed(String reason) {
        return new CoreTransferResult(false, null, false, reason);
    }
}
