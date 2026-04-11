package com.experis.sofia.bankportal.cards.domain;
import java.util.UUID;

public interface CoreBankingPort {
    /** Delega cambio de PIN al core bancario. PIN nunca se almacena en BankPortal. */
    void changePin(UUID cardId, String newPinHash);
}
