package com.experis.sofia.bankportal.directdebit.webhook;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * DEBT-035: R-codes SEPA DD Core Rulebook 2024 — Sección 4.5 Return.
 * HOTFIX-S20: paquete corregido a com.experis.sofia.bankportal.
 */
@Getter
@RequiredArgsConstructor
public enum SepaReturnCode {
    R01("Fondos insuficientes"),
    R02("Cuenta cerrada"),
    R03("Cuenta inexistente o titular incorrecto"),
    R04("Número de cuenta inválido"),
    R05("Cuenta bloqueada"),
    R07("Revocación del mandato por el deudor"),
    R08("Instrucción de no pago del deudor"),
    R09("Servicio bancario no operativo"),
    R10("Autorización inválida — mandato no emitido");

    private final String description;

    public static SepaReturnCode fromCode(String code) {
        for (SepaReturnCode r : values()) {
            if (r.name().equalsIgnoreCase(code)) return r;
        }
        return null;
    }
}
