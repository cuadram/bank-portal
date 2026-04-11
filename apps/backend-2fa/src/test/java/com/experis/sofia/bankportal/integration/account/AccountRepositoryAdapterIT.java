package com.experis.sofia.bankportal.integration.account;

import com.experis.sofia.bankportal.integration.config.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test — Spring context + bean wiring completo.
 * Verifica que todos los beans críticos arrancan correctamente.
 * DEBT-030 — el primer test que habría detectado los 25+ beans faltantes.
 */
@DisplayName("Spring Context — Integration Tests")
class AccountRepositoryAdapterIT extends IntegrationTestBase {

    @Test
    @DisplayName("El contexto Spring arranca sin errores de wiring")
    void springContext_startsWithoutErrors() {
        // Si el contexto no arranca, este test falla con un mensaje claro
        // indicando exactamente qué bean falta o qué property no está configurada
        assertThat(mockMvc).isNotNull();
        assertThat(jdbc).isNotNull();
    }

    @Test
    @DisplayName("La tabla accounts existe y tiene el schema correcto")
    void accountsTable_hasCorrectSchema() {
        // Verifica que las columnas críticas existen en BD
        var count = jdbc.sql("""
            SELECT COUNT(*) FROM information_schema.columns
            WHERE table_name = 'accounts'
            AND column_name IN ('id','user_id','alias','iban','type','status')
            """).query(Integer.class).single();

        assertThat(count).isEqualTo(6);
    }

    @Test
    @DisplayName("La tabla transactions tiene las columnas que usa DashboardJpaAdapter")
    void transactionsTable_hasDashboardColumns() {
        // Este test habría detectado que 'target_account_id' no existe
        var count = jdbc.sql("""
            SELECT COUNT(*) FROM information_schema.columns
            WHERE table_name = 'transactions'
            AND column_name IN ('account_id','transaction_date','amount','type','category','concept')
            """).query(Integer.class).single();

        assertThat(count).isEqualTo(6);
    }

    @Test
    @DisplayName("Las tablas críticas existen en el schema")
    void criticalTables_exist() {
        var tables = jdbc.sql("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN (
                'users','accounts','account_balances','transactions',
                'transfers','bill_payments','user_notifications',
                'trusted_devices','spending_categories'
            )
            ORDER BY table_name
            """).query(String.class).list();

        assertThat(tables).containsExactlyInAnyOrder(
            "account_balances","accounts","bill_payments",
            "spending_categories","transactions","transfers",
            "trusted_devices","user_notifications","users"
        );
    }
}
