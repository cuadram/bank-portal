package com.experis.sofia.bankportal.savings.infrastructure.scheduler;

import com.experis.sofia.bankportal.integration.SavingsIntegrationTestBase;
import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * IT-SHEDLOCK · verifica el cableado de ShedLock requerido para que el
 * AutoContributionScheduler funcione con idempotencia multi-replica
 * (DEBT-051 · RN-F024-04 · FEAT-024 Sprint 26 Fase H.2).
 *
 * <p>El test no ejecuta el scheduler ni intenta adquirir un lock real; eso
 * lo cubre {@code AutoContributionSchedulerIT} con perfil de cron acelerado.
 * Aqui solo se valida la presencia de los componentes infraestructurales:</p>
 *
 * <ul>
 *   <li>{@link LockProvider} cableado como bean Spring y de tipo
 *       {@link JdbcTemplateLockProvider} (no {@code DefaultLockProvider} u
 *       otro fallback in-memory que invalidaria la garantia distribuida).</li>
 *   <li>Tabla {@code shedlock} presente en la BD del compose externo
 *       (V31__shedlock.sql aplicada por Flyway en S26 Fase H.7, originalmente V18c).</li>
 * </ul>
 *
 * <p>Si alguno falla, el AutoContributionScheduler se ejecutaria sin lock o
 * con lock in-memory, rompiendo idempotencia en multi-replica.</p>
 */
class ShedLockEnabledIT extends SavingsIntegrationTestBase {

    @Autowired LockProvider lockProvider;
    @Autowired JdbcClient jdbc;

    @Test
    @DisplayName("IT-SHEDLOCK-001 - LockProvider cableado como JdbcTemplateLockProvider")
    void lockProvider_isWired() {
        assertThat(lockProvider)
                .as("LockProvider debe estar registrado como bean Spring")
                .isNotNull()
                .as("LockProvider debe ser JdbcTemplateLockProvider (no fallback in-memory)")
                .isInstanceOf(JdbcTemplateLockProvider.class);
    }

    @Test
    @DisplayName("IT-SHEDLOCK-002 - tabla shedlock existe en BD (V31 aplicada)")
    void shedlockTable_exists() {
        Long count = jdbc.sql("""
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = current_schema()
                  AND table_name = 'shedlock'
                """)
                .query(Long.class)
                .single();
        assertThat(count)
                .as("Tabla shedlock debe existir (migracion V31__shedlock.sql)")
                .isEqualTo(1L);
    }
}
