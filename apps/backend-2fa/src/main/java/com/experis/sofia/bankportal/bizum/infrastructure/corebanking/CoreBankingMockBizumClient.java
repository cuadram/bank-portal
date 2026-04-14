package com.experis.sofia.bankportal.bizum.infrastructure.corebanking;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * ADR-038: Mock SEPA Instant sincrono en STG (<100ms).
 * @Primary activo en todos los entornos sin restriccion de perfil (LA-019-08).
 * DEBT-045: Implementa SepaInstantPort para Bizum P2P.
 */
@Primary
@Component
public class CoreBankingMockBizumClient implements SepaInstantPort {
    private static final Logger log = LoggerFactory.getLogger(CoreBankingMockBizumClient.class);

    @Override
    public SepaInstantResult executeTransfer(UUID debtorUserId, String creditorPhone, BigDecimal amount, String concept) {
        // Referencia SEPA Instant canonico: BIZUM-{uuid} — ADR-038
        String ref = "BIZUM-" + UUID.randomUUID();
        log.info("[STG-MOCK] SEPA Instant: debtor={} creditor={} amount={} ref={}",
            debtorUserId, creditorPhone, amount, ref);
        return new SepaInstantResult(ref, "COMPLETED", Instant.now());
    }
}
