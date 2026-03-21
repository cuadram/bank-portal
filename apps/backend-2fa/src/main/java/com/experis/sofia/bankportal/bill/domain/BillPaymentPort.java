package com.experis.sofia.bankportal.bill.domain;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Puerto de salida — pago al core bancario real.
 * Implementado por BillCoreAdapter (infra) que delega en BankCoreRestAdapter.
 * US-903/904 FEAT-009 Sprint 11.
 *
 * @author SOFIA Developer Agent
 */
public interface BillPaymentPort {

    /**
     * Ejecuta el pago de un recibo o factura en el core bancario.
     *
     * @param sourceAccountId cuenta origen del cargo
     * @param amount          importe a pagar
     * @param concept         concepto del pago
     * @param idempotencyKey  UUID único — previene dobles cargos en reintentos
     * @return ID de transacción devuelto por el core
     */
    String executePayment(UUID sourceAccountId, BigDecimal amount,
                          String concept, UUID idempotencyKey);

    /**
     * Consulta los datos de una factura por referencia al core bancario.
     *
     * @param reference referencia de 20 dígitos
     * @return resultado del lookup
     */
    BillLookupResult lookupBill(String reference);

    record BillLookupResult(
            String externalBillId,
            String issuer,
            String concept,
            BigDecimal amount,
            String expiryDate
    ) {}
}
