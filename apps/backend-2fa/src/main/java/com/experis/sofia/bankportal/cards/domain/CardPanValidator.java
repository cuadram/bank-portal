package com.experis.sofia.bankportal.cards.domain;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * DEBT-037 CLOSED — Validación PAN tarjetas: Maestro 19 dígitos + algoritmo Luhn.
 * Soporta rangos PAN: Visa 13/16, Mastercard 16, Maestro 13-19 (PCI DSS v4).
 * Sprint 23 · FEAT-021 colateral
 */
@Component
public class CardPanValidator {

    private static final Pattern PAN_REGEX = Pattern.compile("^[0-9]{13,19}$");

    /**
     * Valida formato PAN y dígito de control Luhn.
     * @param pan PAN sin espacios ni separadores
     * @return true si el PAN es válido según regex y Luhn
     */
    public boolean isValid(String pan) {
        if (pan == null || !PAN_REGEX.matcher(pan).matches()) return false;
        return passesLuhn(pan);
    }

    /** Algoritmo Luhn — ISO/IEC 7812 */
    private boolean passesLuhn(String pan) {
        int sum = 0;
        boolean alternate = false;
        for (int i = pan.length() - 1; i >= 0; i--) {
            int digit = pan.charAt(i) - '0';
            if (alternate) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            alternate = !alternate;
        }
        return sum % 10 == 0;
    }
}
