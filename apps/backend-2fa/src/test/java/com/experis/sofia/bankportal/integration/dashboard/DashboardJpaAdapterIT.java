package com.experis.sofia.bankportal.integration.dashboard;

import com.experis.sofia.bankportal.dashboard.domain.DashboardRepositoryPort;
import com.experis.sofia.bankportal.integration.config.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;

/**
 * Integration test — DashboardJpaAdapter.
 * Verifica que las queries SQL del dashboard son correctas contra el schema real.
 * DEBT-030 — detecta schema drift antes de llegar a STG.
 */
@DisplayName("DashboardJpaAdapter — Integration Tests")
class DashboardJpaAdapterIT extends IntegrationTestBase {

    @Autowired
    private DashboardRepositoryPort dashboardRepo;

    @Test
    @DisplayName("El bean DashboardRepositoryPort se instancia correctamente")
    void beanIsInstantiatedWithoutErrors() {
        assertThat(dashboardRepo).isNotNull();
    }

    @Test
    @DisplayName("sumIncome devuelve 0 cuando no hay transacciones ABONO")
    void sumIncome_returnsZeroWhenNoTransactions() {
        BigDecimal income = dashboardRepo.sumIncome(testUserId, "2026-03");
        assertThat(income).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("sumExpenses devuelve 0 cuando no hay transacciones CARGO")
    void sumExpenses_returnsZeroWhenNoTransactions() {
        BigDecimal expenses = dashboardRepo.sumExpenses(testUserId, "2026-03");
        assertThat(expenses).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("sumIncome agrega correctamente transacciones ABONO del periodo")
    void sumIncome_aggregatesCorrectlyForPeriod() {
        // Insertar transacciones de prueba
        jdbc.sql("""
            INSERT INTO transactions (account_id, transaction_date, concept, amount, balance_after, category, type)
            VALUES (:aid, '2026-03-15', 'Nomina', 3200.00, 3200.00, 'NOMINA', 'ABONO'),
                   (:aid, '2026-03-20', 'Bizum',   100.00, 3300.00, 'TRANSFERENCIA', 'ABONO'),
                   (:aid, '2026-02-15', 'Nomina',  3200.00, 3200.00, 'NOMINA', 'ABONO')
            """).param("aid", testAccountId).update();

        BigDecimal income = dashboardRepo.sumIncome(testUserId, "2026-03");

        // Solo los 2 de marzo, no el de febrero
        assertThat(income).isEqualByComparingTo(new BigDecimal("3300.00"));
    }

    @Test
    @DisplayName("sumExpenses agrega correctamente transacciones CARGO del periodo")
    void sumExpenses_aggregatesCorrectlyForPeriod() {
        jdbc.sql("""
            INSERT INTO transactions (account_id, transaction_date, concept, amount, balance_after, category, type)
            VALUES (:aid, '2026-03-10', 'Alquiler',     850.00, 4150.00, 'HOGAR',        'CARGO'),
                   (:aid, '2026-03-25', 'Supermercado',  45.50, 4104.50, 'ALIMENTACION', 'CARGO'),
                   (:aid, '2026-02-10', 'Alquiler',     850.00, 4150.00, 'HOGAR',        'CARGO')
            """).param("aid", testAccountId).update();

        BigDecimal expenses = dashboardRepo.sumExpenses(testUserId, "2026-03");
        assertThat(expenses).isEqualByComparingTo(new BigDecimal("895.50"));
    }

    @Test
    @DisplayName("countTransactions cuenta todas las transacciones del periodo")
    void countTransactions_countsAllTypesInPeriod() {
        jdbc.sql("""
            INSERT INTO transactions (account_id, transaction_date, concept, amount, balance_after, category, type)
            VALUES (:aid, '2026-03-01', 'A', 100.00, 100.00, 'OTRO', 'ABONO'),
                   (:aid, '2026-03-15', 'B',  50.00,  50.00, 'OTRO', 'CARGO'),
                   (:aid, '2026-04-01', 'C', 100.00, 100.00, 'OTRO', 'ABONO')
            """).param("aid", testAccountId).update();

        int count = dashboardRepo.countTransactions(testUserId, "2026-03");
        assertThat(count).isEqualTo(2);  // Solo las de marzo
    }

    @Test
    @DisplayName("findRawSpendings no lanza excepción con datos reales")
    void findRawSpendings_doesNotThrowException() {
        assertThatNoException().isThrownBy(() ->
            dashboardRepo.findRawSpendings(testUserId, "2026-03"));
    }

    @Test
    @DisplayName("findRawSpendings devuelve solo transacciones CARGO")
    void findRawSpendings_returnsOnlyCargo() {
        jdbc.sql("""
            INSERT INTO transactions (account_id, transaction_date, concept, amount, balance_after, category, type)
            VALUES (:aid, '2026-03-10', 'Alquiler', 850.00, 4150.00, 'HOGAR',  'CARGO'),
                   (:aid, '2026-03-28', 'Nomina',  3200.00, 7350.00, 'NOMINA', 'ABONO')
            """).param("aid", testAccountId).update();

        var spendings = dashboardRepo.findRawSpendings(testUserId, "2026-03");
        assertThat(spendings).hasSize(1);
        assertThat(spendings.get(0).amount()).isEqualByComparingTo(new BigDecimal("850.00"));
    }
}
