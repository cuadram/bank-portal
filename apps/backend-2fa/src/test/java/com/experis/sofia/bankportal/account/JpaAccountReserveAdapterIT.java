package com.experis.sofia.bankportal.account;

import com.experis.sofia.bankportal.account.domain.AccountReservePort;
import com.experis.sofia.bankportal.integration.SavingsIntegrationTestBase;
import com.experis.sofia.bankportal.savings.domain.exception.InsufficientFundsException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * IT JpaAccountReserveAdapter - Sprint 26 FEAT-024 Step 4 Fase F.4.
 *
 * Verifica el comportamiento real del adapter SQL nativo contra
 * account_balances (V10). Cubre los 5 metodos del puerto:
 *   - reserve OK (resta available, suma retained)
 *   - reserve InsufficientFundsException (saldo insuficiente)
 *   - release (suma available, resta retained)
 *   - transferReserved (resta retained, no toca available)
 *   - balances queries
 *
 * Patron: hereda de SavingsIntegrationTestBase (postgres+redis del compose,
 * fixture savings-test-fixtures.sql precarga 2 accounts con balance limpio).
 *
 * Cada test envuelto en @Transactional para que el rollback automatico de
 * Spring deje el estado de account_balances limpio entre tests, sin necesidad
 * de @AfterEach manual. NOTA: el adapter declara propagation=MANDATORY, asi
 * que el @Transactional del test es el container de la transaccion fisica.
 *
 * @author SOFIA Developer Agent - FEAT-024 Sprint 26 - Fase F.4
 */
@Transactional
class JpaAccountReserveAdapterIT extends SavingsIntegrationTestBase {

    @Autowired AccountReservePort reservePort;
    @Autowired JdbcClient jdbc;

    @BeforeEach
    void resetBalances() {
        // Garantia de estado conocido al inicio del test (la fixture pone 10000 + 5000
        // pero un test previo que NO use @Transactional podria haber dejado deriva).
        jdbc.sql("UPDATE account_balances SET available_balance=10000.00, retained_balance=0.00 WHERE account_id=?")
            .param(TEST_ACCOUNT_ID).update();
        jdbc.sql("UPDATE account_balances SET available_balance=5000.00, retained_balance=0.00 WHERE account_id=?")
            .param(OTHER_ACCOUNT_ID).update();
    }

    @Test @DisplayName("IT-RES-001 - reserve resta available y suma retained atomicamente")
    void reserve_decrementsAvailable_incrementsRetained() {
        BigDecimal amount = new BigDecimal("250.00");

        reservePort.reserve(TEST_ACCOUNT_ID, amount);

        BigDecimal avail = jdbc.sql("SELECT available_balance FROM account_balances WHERE account_id=?")
                .param(TEST_ACCOUNT_ID).query(BigDecimal.class).single();
        BigDecimal retained = jdbc.sql("SELECT retained_balance FROM account_balances WHERE account_id=?")
                .param(TEST_ACCOUNT_ID).query(BigDecimal.class).single();

        assertThat(avail).isEqualByComparingTo("9750.00");
        assertThat(retained).isEqualByComparingTo("250.00");
    }

    @Test @DisplayName("IT-RES-002 - reserve por encima del available lanza InsufficientFundsException")
    void reserve_overAvailable_throwsInsufficientFunds() {
        BigDecimal exceso = new BigDecimal("10000.01");

        assertThatThrownBy(() -> reservePort.reserve(TEST_ACCOUNT_ID, exceso))
                .isInstanceOf(InsufficientFundsException.class);

        // Estado intacto: ni available ni retained se han modificado
        BigDecimal avail = jdbc.sql("SELECT available_balance FROM account_balances WHERE account_id=?")
                .param(TEST_ACCOUNT_ID).query(BigDecimal.class).single();
        BigDecimal retained = jdbc.sql("SELECT retained_balance FROM account_balances WHERE account_id=?")
                .param(TEST_ACCOUNT_ID).query(BigDecimal.class).single();
        assertThat(avail).isEqualByComparingTo("10000.00");
        assertThat(retained).isEqualByComparingTo("0.00");
    }

    @Test @DisplayName("IT-RES-003 - release resta retained y devuelve available (operacion inversa de reserve)")
    void release_isInverseOfReserve() {
        BigDecimal amount = new BigDecimal("180.00");

        reservePort.reserve(TEST_ACCOUNT_ID, amount);
        reservePort.release(TEST_ACCOUNT_ID, amount);

        BigDecimal avail = jdbc.sql("SELECT available_balance FROM account_balances WHERE account_id=?")
                .param(TEST_ACCOUNT_ID).query(BigDecimal.class).single();
        BigDecimal retained = jdbc.sql("SELECT retained_balance FROM account_balances WHERE account_id=?")
                .param(TEST_ACCOUNT_ID).query(BigDecimal.class).single();

        assertThat(avail).isEqualByComparingTo("10000.00");
        assertThat(retained).isEqualByComparingTo("0.00");
    }

    @Test @DisplayName("IT-RES-004 - transferReserved decrementa retained sin tocar available (movimiento contable hecho ya en reserve)")
    void transferReserved_decrementsRetainedOnly() {
        BigDecimal amount = new BigDecimal("500.00");

        // Setup: reservar 500 (available 9500, retained 500)
        reservePort.reserve(TEST_ACCOUNT_ID, amount);

        // Act: transferir esa reserva (cierre de objetivo)
        reservePort.transferReserved(TEST_ACCOUNT_ID, amount);

        BigDecimal avail = jdbc.sql("SELECT available_balance FROM account_balances WHERE account_id=?")
                .param(TEST_ACCOUNT_ID).query(BigDecimal.class).single();
        BigDecimal retained = jdbc.sql("SELECT retained_balance FROM account_balances WHERE account_id=?")
                .param(TEST_ACCOUNT_ID).query(BigDecimal.class).single();

        // available NO cambia respecto al post-reserve (la baja contable se hizo alli);
        // retained vuelve a 0 (la reserva se ha consumido)
        assertThat(avail).isEqualByComparingTo("9500.00");
        assertThat(retained).isEqualByComparingTo("0.00");
    }

    @Test @DisplayName("IT-RES-005 - availableBalance y retainedBalance reflejan los UPDATEs y devuelven ZERO si la cuenta no existe")
    void balanceQueries_reflectStateAndDefaultZero() {
        // Estado inicial via fixture
        assertThat(reservePort.availableBalance(TEST_ACCOUNT_ID)).isEqualByComparingTo("10000.00");
        assertThat(reservePort.retainedBalance(TEST_ACCOUNT_ID)).isEqualByComparingTo("0.00");

        // Tras un reserve
        reservePort.reserve(TEST_ACCOUNT_ID, new BigDecimal("123.45"));
        assertThat(reservePort.availableBalance(TEST_ACCOUNT_ID)).isEqualByComparingTo("9876.55");
        assertThat(reservePort.retainedBalance(TEST_ACCOUNT_ID)).isEqualByComparingTo("123.45");

        // Cuenta inexistente -> ZERO (orElse del query.optional)
        UUID inexistente = UUID.fromString("00000000-0000-0000-0000-0000000ffff9");
        assertThat(reservePort.availableBalance(inexistente)).isEqualByComparingTo("0");
        assertThat(reservePort.retainedBalance(inexistente)).isEqualByComparingTo("0");
    }
}
