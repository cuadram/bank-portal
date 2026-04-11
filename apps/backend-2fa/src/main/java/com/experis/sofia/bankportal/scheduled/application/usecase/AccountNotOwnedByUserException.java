package com.experis.sofia.bankportal.scheduled.application.usecase;

import java.util.UUID;

/**
 * Excepción de dominio — cuenta no pertenece al usuario autenticado.
 * Auditable vía AuditLogService (CMMI CM SP 2.2).
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17 — NC-017-03
 */
public class AccountNotOwnedByUserException extends RuntimeException {
    public AccountNotOwnedByUserException(UUID accountId, UUID userId) {
        super("La cuenta " + accountId + " no pertenece al usuario " + userId);
    }
}
