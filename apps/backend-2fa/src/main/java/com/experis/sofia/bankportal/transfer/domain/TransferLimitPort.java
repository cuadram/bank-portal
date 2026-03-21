package com.experis.sofia.bankportal.transfer.domain;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Puerto de salida — Límites de transferencia (US-804).
 * Abstracción sobre el almacén de contadores diarios (Redis en producción).
 * Permite swap a implementación alternativa sin cambiar la lógica de negocio.
 *
 * @author SOFIA Developer Agent — FEAT-008 Sprint 10 (RV-001 fix)
 */
public interface TransferLimitPort {
    /** Retorna el acumulado diario del usuario en EUR. ZERO si no existe. */
    BigDecimal getDailyAccumulated(UUID userId);
    /** Incrementa el acumulado diario de forma atómica. Retorna nuevo total en EUR. */
    BigDecimal incrementDaily(UUID userId, BigDecimal amount);
}
