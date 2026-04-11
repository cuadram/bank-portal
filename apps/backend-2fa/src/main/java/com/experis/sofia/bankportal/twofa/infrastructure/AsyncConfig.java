package com.experis.sofia.bankportal.twofa.infrastructure;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Configuración del pool asíncrono para exportaciones GDPR.
 * ADR-033: pool dedicado gdprExportExecutor — no compartir con otros @Async.
 * RN-F019-20: generación data-export máx. 24h — pool no bloqueante.
 *
 * @author SOFIA Developer Agent — FEAT-019 Sprint 21
 */
@Configuration
@EnableAsync
@EnableScheduling
public class AsyncConfig {

    /**
     * Pool dedicado para DataExportService (@Async gdprExportExecutor).
     * Core=2, Max=5, Queue=20 — suficiente para volumen GDPR esperado.
     */
    @Bean("gdprExportExecutor")
    public Executor gdprExportExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(20);
        executor.setThreadNamePrefix("gdpr-export-");
        executor.initialize();
        return executor;
    }
}
