package com.experis.sofia.bankportal.scheduled.application.usecase;

import java.util.UUID;

/**
 * Puerto de salida — verifica que una cuenta pertenece a un usuario.
 *
 * @author SOFIA Developer Agent — FEAT-015 Sprint 17
 */
public interface AccountOwnershipPort {
    boolean belongsToUser(UUID accountId, UUID userId);
}
