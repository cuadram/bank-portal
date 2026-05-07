package com.experis.sofia.bankportal.twofa.infrastructure.config;

import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.provider.jdbctemplate.JdbcTemplateLockProvider;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

/**
 * Configuracion ShedLock — distributed scheduler locking (DEBT-051 · ADR-028).
 *
 * <p>Activa el AOP de {@code @SchedulerLock} a nivel de aplicacion y expone
 * un {@link LockProvider} basado en JdbcTemplate sobre la tabla {@code shedlock}
 * (V18c). Esto garantiza que cualquier {@code @Scheduled @SchedulerLock} solo
 * se ejecute en una instancia simultaneamente, requisito de idempotencia para
 * AutoContributionScheduler (RN-F024-04 · FEAT-024 Sprint 26).</p>
 *
 * <p><b>{@code defaultLockAtMostFor}:</b> safety net que libera el lock si el
 * proceso muere sin liberarlo. PT10M cubre el peor caso del scheduler de
 * aportaciones automaticas (lectura + procesamiento de reglas due) con margen.
 * Cada {@code @SchedulerLock} concreto puede sobreescribir este valor.</p>
 *
 * <p><b>{@code usingDbTime()}:</b> usa {@code now()} de la BD en lugar del reloj
 * de la JVM, evitando drift entre nodos en escenarios multi-replica. Best
 * practice oficial ShedLock para PostgreSQL.</p>
 *
 * <p><b>{@code @EnableScheduling}:</b> NO se replica aqui. Ya esta activo en
 * {@code BackendTwoFactorApplication} y {@code AsyncConfig}.</p>
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase H.2
 */
@Configuration
@EnableSchedulerLock(defaultLockAtMostFor = "PT10M")
public class SchedulingConfig {

    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(
                JdbcTemplateLockProvider.Configuration.builder()
                        .withJdbcTemplate(new JdbcTemplate(dataSource))
                        .usingDbTime()
                        .build()
        );
    }
}
