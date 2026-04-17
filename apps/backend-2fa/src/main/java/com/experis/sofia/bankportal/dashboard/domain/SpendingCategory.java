package com.experis.sofia.bankportal.dashboard.domain;

/**
 * Categorías de gasto del usuario.
 *
 * <p>FEAT-010 Sprint 12: valores originales ALIMENTACION, TRANSPORTE, SERVICIOS, OCIO, OTROS.
 * FEAT-023 Sprint 25: ampliado a 14 categorías PFM. Valores originales conservados
 * sin modificación para garantizar compatibilidad con SpendingCategoryService,
 * spending_categories (caché BD) y tests existentes.
 *
 * <p>REGLA: SERVICIOS se mantiene como alias legacy del dashboard analítico.
 * Las nuevas categorías PFM usan nombres semánticos específicos (HOGAR, SUMINISTROS…).
 *
 * @author SOFIA Developer Agent — FEAT-010 Sprint 12 · FEAT-023 Sprint 25
 */
public enum SpendingCategory {

    // ── Originales FEAT-010 — NO MODIFICAR (dashboard analítico depende de estos) ──
    ALIMENTACION,
    TRANSPORTE,
    SERVICIOS,   // legacy dashboard: suministros + seguros + telecos agrupados
    OCIO,
    OTROS,

    // ── Nuevas FEAT-023 PFM ───────────────────────────────────────────────────────
    RESTAURANTES,
    SALUD,
    HOGAR,
    SUMINISTROS,
    COMUNICACIONES,
    EDUCACION,
    VIAJES,
    SEGUROS,
    NOMINA,
    TRANSFERENCIAS;

    /** True si la categoría es de ingreso (excluir de presupuestos y análisis de gasto). */
    public boolean isIngreso() {
        return this == NOMINA || this == TRANSFERENCIAS;
    }
}
