package com.experis.sofia.bankportal.pfm.domain.repository;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/** Puerto — lectura de movimientos para análisis PFM. */
public interface PfmTransactionReadRepository {

    /** Movimientos CARGO del usuario en un mes dado para categorización. */
    List<RawMovimiento> findCargos(UUID userId, YearMonth month);

    /** Suma de CARGOs por concepto normalizado para top comercios (DEBT-047). */
    List<TopComercioRaw> findTopComerciosUnificados(UUID userId, YearMonth month, int limit);

    /** Suma de CARGOs por categoría para un mes (para análisis comparativo). */
    BigDecimal sumCargosByCategory(UUID userId, YearMonth month, String categoryCode);

    record RawMovimiento(UUID txId, String concept, BigDecimal amount) {}
    record TopComercioRaw(String nombre, BigDecimal totalImporte, int numTransacciones) {}
}
