package com.experis.sofia.bankportal.account.infrastructure;

import com.experis.sofia.bankportal.account.domain.AccountReservePort;
import com.experis.sofia.bankportal.savings.domain.exception.InsufficientFundsException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Adapter JDBC que implementa {@link AccountReservePort} (FEAT-024 ADR-040).
 *
 * <p>Opera sobre la tabla {@code account_balances} (V10) modificando
 * {@code available_balance} y {@code retained_balance}. Las tres operaciones
 * de mutacion son SQL nativo con check {@code available >= amount} en el WHERE
 * para garantizar atomicidad sin row-level lock explicito (PostgreSQL aplica
 * lock implicito durante el UPDATE en READ COMMITTED).</p>
 *
 * <p><b>Schema verificado V10__account_transactions.sql</b>:
 * {@code account_balances(account_id UUID PK, available_balance DECIMAL(15,2),
 * retained_balance DECIMAL(15,2), updated_at TIMESTAMP)}.</p>
 *
 * <p><b>Patron de consistencia con</b> {@code JpaAccountRepositoryAdapter}
 * (mismo bounded context). {@code @Primary} sin {@code @Profile} (LA-019-08).</p>
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase D
 */
@Component
@Primary
@RequiredArgsConstructor
@Slf4j
public class JpaAccountReserveAdapter implements AccountReservePort {

    private final JdbcClient jdbc;

    /**
     * Reserva atomica: incrementa retained, decrementa available.
     * Si available &lt; amount, el WHERE no matchea y affectedRows=0 → throw.
     */
    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void reserve(UUID accountId, BigDecimal amount) {
        validateAmount(amount);
        int affected = jdbc.sql("""
                UPDATE account_balances
                   SET available_balance = available_balance - :amount,
                       retained_balance  = retained_balance  + :amount,
                       updated_at        = NOW()
                 WHERE account_id = :accountId
                   AND available_balance >= :amount
                """)
                .param("accountId", accountId)
                .param("amount", amount)
                .update();
        if (affected == 0) {
            log.info("savings.reserve.failed accountId={} amount={} reason=INSUFFICIENT_FUNDS",
                    accountId, amount);
            throw new InsufficientFundsException();
        }
    }

    /**
     * Liberacion: decrementa retained, devuelve a available.
     * No falla si retained_balance &lt; amount: la BD permite valores negativos
     * en saldos retenidos (no hay CHECK), pero seria un bug logico aguas arriba.
     * El use case que llama a release() ya valido que el goal tenia reservedAmount
     * suficiente.
     */
    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void release(UUID accountId, BigDecimal amount) {
        validateAmount(amount);
        int affected = jdbc.sql("""
                UPDATE account_balances
                   SET available_balance = available_balance + :amount,
                       retained_balance  = retained_balance  - :amount,
                       updated_at        = NOW()
                 WHERE account_id = :accountId
                """)
                .param("accountId", accountId)
                .param("amount", amount)
                .update();
        if (affected == 0) {
            log.warn("savings.release.no_account accountId={} amount={}", accountId, amount);
            // No throw: no hay excepcion definida y el flujo de cierre no debe abortarse
            // por una row faltante (caso edge: cuenta desactivada). El cierre del goal
            // procede igualmente y deja auditoria via log.
        }
    }

    /**
     * Conversion reserva → transferencia contable: decrementa retained sin
     * tocar available (el descuento ya se hizo en reserve()). Usado al cerrar
     * goal con devolucion al final del 100% (LLD §6.3).
     */
    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void transferReserved(UUID sourceAccountId, BigDecimal amount) {
        validateAmount(amount);
        int affected = jdbc.sql("""
                UPDATE account_balances
                   SET retained_balance = retained_balance - :amount,
                       updated_at       = NOW()
                 WHERE account_id = :accountId
                """)
                .param("accountId", sourceAccountId)
                .param("amount", amount)
                .update();
        if (affected == 0) {
            log.warn("savings.transfer.no_account accountId={} amount={}", sourceAccountId, amount);
        }
    }

    @Override
    public BigDecimal availableBalance(UUID accountId) {
        return jdbc.sql("SELECT available_balance FROM account_balances WHERE account_id = :id")
                .param("id", accountId)
                .query(BigDecimal.class)
                .optional()
                .orElse(BigDecimal.ZERO);
    }

    @Override
    public BigDecimal retainedBalance(UUID accountId) {
        return jdbc.sql("SELECT retained_balance FROM account_balances WHERE account_id = :id")
                .param("id", accountId)
                .query(BigDecimal.class)
                .optional()
                .orElse(BigDecimal.ZERO);
    }

    private void validateAmount(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("amount debe ser positivo");
        }
    }
}
