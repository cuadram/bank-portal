package com.experis.sofia.bankportal.dashboard.domain;

import com.experis.sofia.bankportal.dashboard.application.dto.SpendingCategoryDto;
import com.experis.sofia.bankportal.dashboard.application.dto.TopMerchantDto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Puerto de salida — queries de agregación financiera.
 * Arquitectura hexagonal: dominio no conoce JPA.
 * FEAT-010 Sprint 12.
 *
 * @author SOFIA Developer Agent
 */
public interface DashboardRepositoryPort {

    /** Suma de ingresos (transferencias entrantes) en el período YYYY-MM. */
    BigDecimal sumIncome(UUID userId, String period);

    /** Suma de gastos (transfers salientes + bill_payments) en el período. */
    BigDecimal sumExpenses(UUID userId, String period);

    /** Cuenta total de transacciones del período. */
    int countTransactions(UUID userId, String period);

    /** Gastos por concepto/emisor sin categorizar — para SpendingCategorizationEngine. */
    List<RawSpendingRecord> findRawSpendings(UUID userId, String period);

    /** Top N emisores por importe DESC. */
    List<TopMerchantDto> findTopMerchants(UUID userId, String period, int limit);

    /** Lee categorías ya calculadas (caché BD). Vacío si aún no calculadas. */
    List<SpendingCategoryDto> findCachedCategories(UUID userId, String period);

    /** Persiste / actualiza categorías calculadas para el período. */
    void upsertSpendingCategories(UUID userId, String period, List<SpendingCategoryDto> categories);

    /** Invalida caché de un período (llamado tras nueva transacción). */
    void deleteCachedCategories(UUID userId, String period);

    record RawSpendingRecord(String concept, String issuer, BigDecimal amount) {}
}
