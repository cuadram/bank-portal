package com.experis.sofia.bankportal.beneficiary.domain;

import org.springframework.stereotype.Component;

/**
 * Validador IBAN según ISO 13616 (módulo 97).
 * Pasos: mover 4 primeros al final → letras a números → mod97 == 1.
 *
 * @author SOFIA Developer Agent — FEAT-008 Sprint 10
 */
@Component
public class IbanValidator {

    public void validate(String iban) {
        if (iban == null || iban.isBlank())
            throw new InvalidIbanException("IBAN vacío");

        String n = iban.toUpperCase().replaceAll("\\s", "");
        if (n.length() < 15 || n.length() > 34)
            throw new InvalidIbanException("Longitud inválida: " + n.length());
        if (!n.matches("[A-Z]{2}\\d{2}[A-Z0-9]+"))
            throw new InvalidIbanException("Formato inválido");

        String rearranged = n.substring(4) + n.substring(0, 4);
        StringBuilder numeric = new StringBuilder();
        for (char c : rearranged.toCharArray()) {
            if (Character.isLetter(c)) numeric.append(c - 'A' + 10);
            else                        numeric.append(c);
        }
        if (mod97(numeric.toString()) != 1)
            throw new InvalidIbanException("Dígito de control inválido");
    }

    private int mod97(String s) {
        int r = 0;
        for (char d : s.toCharArray()) r = (r * 10 + (d - '0')) % 97;
        return r;
    }

    public static class InvalidIbanException extends RuntimeException {
        public InvalidIbanException(String msg) { super(msg); }
    }
}
