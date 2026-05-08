package com.experis.sofia.bankportal.savings.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Configuracion del bounded context savings.
 *
 * <p>Expone un {@link TransactionTemplate} para que los use cases que necesiten
 * gestion programatica de transacciones (retry de optimistic lock — BUG-Q-008)
 * puedan inyectarlo. Spring Boot autoconfigura el {@link PlatformTransactionManager}
 * pero no el TransactionTemplate, por eso lo declaramos explicitamente aqui.</p>
 */
@Configuration
public class SavingsTransactionConfig {

    @Bean
    public TransactionTemplate savingsTransactionTemplate(PlatformTransactionManager txManager) {
        return new TransactionTemplate(txManager);
    }
}
