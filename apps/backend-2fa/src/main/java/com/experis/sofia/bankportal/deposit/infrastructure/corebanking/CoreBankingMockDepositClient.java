package com.experis.sofia.bankportal.deposit.infrastructure.corebanking;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Mock determinista del CoreBanking para depósitos en STG.
 * Patrón ADR-037 — coherente con ADR-035 (préstamos).
 * Sin @Profile: único client disponible en dev/stg/prod.
 */
@Component
public class CoreBankingMockDepositClient {

    private static final Logger log = LoggerFactory.getLogger(CoreBankingMockDepositClient.class);

    public void registrarApertura(UUID depositId, UUID userId, BigDecimal importe) {
        log.info("[CoreBanking-Mock] APERTURA depositId={} userId={} importe={}",
            depositId, userId, importe);
    }

    public void registrarCancelacion(UUID depositId, BigDecimal importeAbonado) {
        log.info("[CoreBanking-Mock] CANCELACION depositId={} importeAbonado={}",
            depositId, importeAbonado);
    }
}
