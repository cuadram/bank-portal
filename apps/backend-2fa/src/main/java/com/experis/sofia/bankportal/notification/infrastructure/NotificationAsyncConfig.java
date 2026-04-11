package com.experis.sofia.bankportal.notification.infrastructure;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Primary;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Configuración del executor asíncrono para el {@code NotificationHub} — FEAT-014.
 *
 * <p>Pool dedicado para el despacho multicanal de notificaciones, aislado del
 * executor de la aplicación para evitar starvation del thread pool general.
 *
 * <p>Dimensionado para una instancia single-pod con carga de hasta 50 rps
 * de eventos transaccionales simultáneos:
 * <ul>
 *   <li>Core: 4 threads (eventos concurrentes habituales)</li>
 *   <li>Max: 16 threads (pico de carga)</li>
 *   <li>Queue: 200 (buffer ante picos cortos)</li>
 *   <li>Timeout: 60 s (threads extra se descartan tras inactividad)</li>
 * </ul>
 */
@Configuration
@EnableAsync
public class NotificationAsyncConfig {

    @Primary
    @Bean(name = "notificationExecutor")
    public Executor notificationExecutor() {
        var executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(200);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("notif-hub-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}
