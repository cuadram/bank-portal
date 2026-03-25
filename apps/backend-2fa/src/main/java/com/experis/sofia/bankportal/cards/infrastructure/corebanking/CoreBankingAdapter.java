package com.experis.sofia.bankportal.cards.infrastructure.corebanking;

import com.experis.sofia.bankportal.cards.domain.CoreBankingPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.util.UUID;

/**
 * Mock adapter del core bancario para cambio de PIN.
 * En producción: sustituir por cliente HTTP al sistema core del banco.
 * PIN nunca almacenado en BankPortal — solo se delega el hash al core.
 */
@Component
@Slf4j
public class CoreBankingAdapter implements CoreBankingPort {

    @Override
    public void changePin(UUID cardId, String newPinHash) {
        // Mock: simula llamada HTTP al core bancario
        log.info("CoreBanking [MOCK]: PIN change delegated for card {}", maskId(cardId));
        // Producción: restTemplate.postForEntity(coreUrl + "/cards/" + cardId + "/pin", body, Void.class)
    }

    private String maskId(UUID id) {
        String s = id.toString();
        return "****-****-****-" + s.substring(s.length() - 4);
    }
}
