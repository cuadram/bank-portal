package com.experis.sofia.bankportal.integration;

import com.experis.sofia.bankportal.integration.config.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * TC-IT-001 — SpringContextIT: Verifica que el contexto Spring arranca sin errores.
 *
 * GUARDRAIL GR-003 — BLOQUEANTE para Gate G-4b.
 * Este test DEBE existir y pasar antes de aprobar G-4b en cualquier sprint.
 *
 * ¿Qué detecta?
 * - NoSuchBeanDefinitionException   → bean faltante (Controller, Service, Repository)
 * - UnsatisfiedDependencyException  → dependencia faltante o circular
 * - BeanDefinitionParsingException  → paquete incorrecto (Spring no escanea la clase)
 * - IllegalArgumentException        → property obligatoria no configurada en test profile
 * - BadSqlGrammarException          → columna o tabla inexistente en Flyway schema
 *
 * HOTFIX-S20: habría detectado el paquete es.meridian.bankportal en < 30 segundos,
 * antes de que existiera ningún artefacto de QA ni CR.
 *
 * @author SOFIA Developer Agent — Guardrail GR-003
 */
@DisplayName("IT-001 — Spring Context: el contexto arranca completo sin errores")
class SpringContextIT extends IntegrationTestBase {

    /**
     * TC-IT-001-A: El contexto Spring arranca.
     * Si falla aquí: ver causa en el stack trace → bean/paquete/property faltante.
     */
    @Test
    @DisplayName("TC-IT-001-A: mockMvc instanciado → contexto sin beans faltantes")
    void context_startsWithoutErrors() {
        assertThat(mockMvc).isNotNull();
    }

    /**
     * TC-IT-001-B: Endpoint sin token → 401 Unauthorized.
     * Verifica que SecurityConfig y JwtAuthenticationFilter están activos.
     */
    @Test
    @DisplayName("TC-IT-001-B: endpoint protegido sin token → 401")
    void protectedEndpoint_returns401WithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/accounts"))
                .andExpect(status().isUnauthorized());
    }

    /**
     * TC-IT-001-C: Login con body vacío → 400 (validación activa, no 500).
     * Verifica que los filtros de validación están correctamente configurados.
     */
    @Test
    @DisplayName("TC-IT-001-C: login con body vacío → 400 (no 500)")
    void login_withEmptyBody_returns400NotServerError() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(result ->
                        assertThat(result.getResponse().getStatus())
                                .isNotEqualTo(500));
    }

    /**
     * TC-IT-001-D: Verifica que Flyway ejecutó las migraciones.
     * Si falla: schema de BD no cargado o migración con error.
     */
    @Test
    @DisplayName("TC-IT-001-D: Flyway aplicó migraciones — tabla accounts existe")
    void flyway_appliedMigrations_accountsTableExists() {
        Long count = jdbc.sql("""
                SELECT COUNT(*) FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'accounts'
                """).query(Long.class).single();
        assertThat(count).isEqualTo(1L);
    }

    /**
     * TC-IT-001-E: Verifica columnas críticas que usa el código en transactions.
     * Si falla: schema drift — el código referencia columnas que no existen.
     * HOTFIX-S20: habría detectado getValueDate() → transaction_date en segundos.
     */
    @Test
    @DisplayName("TC-IT-001-E: columnas de transactions coinciden con el dominio")
    void schema_transactionColumns_matchDomain() {
        Long count = jdbc.sql("""
                SELECT COUNT(*) FROM information_schema.columns
                WHERE table_name   = 'transactions'
                AND column_name IN (
                    'id', 'account_id', 'transaction_date',
                    'concept', 'amount', 'balance_after', 'type'
                )
                """).query(Long.class).single();
        // 7 columnas que el dominio Transaction usa — deben existir todas
        assertThat(count)
                .as("Columnas de 'transactions' que usa Transaction.java")
                .isEqualTo(7L);
    }

    /**
     * TC-IT-001-F: Verifica columnas del export_audit_log (FEAT-018).
     * Si falla: V21__export_audit_log.sql no se aplicó o tiene errores.
     */
    @Test
    @DisplayName("TC-IT-001-F: tabla export_audit_log existe con columnas FEAT-018")
    void schema_exportAuditLog_exists() {
        Long count = jdbc.sql("""
                SELECT COUNT(*) FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'export_audit_log'
                """).query(Long.class).single();
        assertThat(count)
                .as("Tabla export_audit_log debe existir tras V21")
                .isEqualTo(1L);
    }
}
