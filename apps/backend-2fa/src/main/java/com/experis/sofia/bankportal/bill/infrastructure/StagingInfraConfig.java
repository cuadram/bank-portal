package com.experis.sofia.bankportal.bill.infrastructure;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.client.RestClient;

/**
 * Beans de infraestructura para STG e ITs — FEAT-009.
 * RestClient stub para BillCoreAdapter en entornos de pruebas.
 */
@Configuration
@Profile({"staging", "integration-compose"})
public class StagingInfraConfig {

    @Bean
    public RestClient restClient() {
        return RestClient.create();
    }
}
