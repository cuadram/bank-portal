package com.experis.sofia.bankportal.beneficiary.domain;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad de dominio — Beneficiario (US-803).
 * Soft delete: deletedAt != null indica beneficiario eliminado.
 * El historial de transferencias conserva la referencia (integridad referencial).
 *
 * @author SOFIA Developer Agent — FEAT-008 Sprint 10
 */
public class Beneficiary {

    private final UUID          id;
    private final UUID          userId;
    private       String        alias;
    private final String        iban;
    private final String        holderName;
    private final LocalDateTime createdAt;
    private       LocalDateTime deletedAt;

    public Beneficiary(UUID userId, String alias, String iban, String holderName) {
        if (iban  == null || iban.isBlank())  throw new IllegalArgumentException("IBAN requerido");
        if (alias == null || alias.isBlank()) throw new IllegalArgumentException("Alias requerido");
        this.id         = UUID.randomUUID();
        this.userId     = userId;
        this.alias      = alias;
        this.iban       = iban.toUpperCase().replaceAll("\\s", "");
        this.holderName = holderName;
        this.createdAt  = LocalDateTime.now();
    }

    public void softDelete() {
        if (deletedAt != null) throw new IllegalStateException("Beneficiario ya eliminado");
        this.deletedAt = LocalDateTime.now();
    }

    public void updateAlias(String newAlias) {
        if (newAlias == null || newAlias.isBlank())
            throw new IllegalArgumentException("Alias no puede estar vacío");
        this.alias = newAlias;
    }

    /** IBAN enmascarado — nunca exponer completo en logs ni respuestas. */
    public String getMaskedIban() {
        if (iban.length() < 8) return "****";
        return iban.substring(0, 4) + "****" + iban.substring(iban.length() - 4);
    }

    public boolean       isActive()      { return deletedAt == null; }
    public UUID          getId()         { return id; }
    public UUID          getUserId()     { return userId; }
    public String        getAlias()      { return alias; }
    public String        getIban()       { return iban; }
    public String        getHolderName() { return holderName; }
    public LocalDateTime getCreatedAt()  { return createdAt; }
    public LocalDateTime getDeletedAt()  { return deletedAt; }
}
