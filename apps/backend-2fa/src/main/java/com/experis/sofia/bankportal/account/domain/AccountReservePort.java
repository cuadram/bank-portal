package com.experis.sofia.bankportal.account.domain;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Puerto NUEVO (FEAT-024 ADR-040) — gestion de saldo retenido (segregacion virtual alpha).
 *
 * <p>Las operaciones reserve/release/transferReserved actuan sobre la columna
 * {@code account_balances.retained_balance} (V10) sin crear cuentas fisicas adicionales.
 *
 * <p>Saldo disponible = saldo contable - retained_balance. La reserva NO modifica
 * el saldo contable. Solo {@code transferReserved} (al alcanzar el objetivo) genera
 * movimiento contable hacia la cuenta destino del cliente.
 *
 * @author SOFIA Architect Agent · ADR-040 alpha · Sprint 26 FEAT-024
 */
public interface AccountReservePort {

    /**
     * Reserva un importe sobre la cuenta indicada.
     * Aumenta retained_balance atomicamente. Falla si available - amount < 0.
     *
     * @param accountId cuenta sobre la que reservar
     * @param amount    importe positivo (NUMERIC(10,2))
     * @throws com.experis.sofia.bankportal.savings.domain.exception.InsufficientFundsException
     *         si el saldo disponible es insuficiente
     */
    void reserve(UUID accountId, BigDecimal amount);

    /**
     * Libera un importe previamente reservado.
     * Decrementa retained_balance. No afecta al saldo contable.
     *
     * @param accountId cuenta cuya reserva se libera
     * @param amount    importe positivo
     */
    void release(UUID accountId, BigDecimal amount);

    /**
     * Convierte una reserva en transferencia contable.
     * Decrementa retained_balance y disponible al mismo tiempo (movimiento real).
     * Invocado al cerrar el objetivo o alcanzar el 100%.
     *
     * @param sourceAccountId cuenta origen (donde estaba reservado)
     * @param amount          importe a transferir
     */
    void transferReserved(UUID sourceAccountId, BigDecimal amount);

    /**
     * Saldo disponible actual de la cuenta = available - retained.
     */
    BigDecimal availableBalance(UUID accountId);

    /**
     * Saldo retenido actual de la cuenta.
     */
    BigDecimal retainedBalance(UUID accountId);
}
