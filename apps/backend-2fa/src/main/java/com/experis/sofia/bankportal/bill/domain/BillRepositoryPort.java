package com.experis.sofia.bankportal.bill.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Puerto de salida — repositorio de recibos domiciliados.
 * Arquitectura hexagonal: dominio no conoce JPA.
 * US-903 FEAT-009 Sprint 11.
 *
 * @author SOFIA Developer Agent
 */
public interface BillRepositoryPort {

    List<Bill> findPendingByUserId(UUID userId);

    Optional<Bill> findByIdAndUserId(UUID billId, UUID userId);

    Bill save(Bill bill);
}
