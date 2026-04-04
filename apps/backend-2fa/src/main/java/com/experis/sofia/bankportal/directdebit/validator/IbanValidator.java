package com.experis.sofia.bankportal.directdebit.validator;

import com.experis.sofia.bankportal.directdebit.exception.InvalidIbanException;
import org.springframework.stereotype.Component;
import java.math.BigInteger;
import java.util.Set;

/**
 * ISO 13616 IBAN validator — mod-97 algorithm.
 * Supports all 34 SEPA EPC countries.
 * FEAT-017 Sprint 19
 */
@Component("sepaIbanValidator")
public class IbanValidator {

    private static final Set<String> SEPA_COUNTRIES = Set.of(
        "AD","AT","BE","BG","CH","CY","CZ","DE","DK","EE",
        "ES","FI","FR","GB","GI","GR","HR","HU","IE","IS",
        "IT","LI","LT","LU","LV","MC","MT","NL","NO","PL",
        "PT","RO","SE","SI","SK","SM","VA"
    );

    /**
     * Validates IBAN according to ISO 13616.
     * @throws InvalidIbanException if IBAN is invalid
     */
    public void validate(String iban) {
        if (iban == null || iban.isBlank())
            throw new InvalidIbanException("IBAN must not be blank");

        String cleaned = iban.replaceAll("\\s", "").toUpperCase();

        if (cleaned.length() < 5 || cleaned.length() > 34)
            throw new InvalidIbanException("IBAN length invalid: " + cleaned.length());

        String countryCode = cleaned.substring(0, 2);
        if (!SEPA_COUNTRIES.contains(countryCode))
            throw new InvalidIbanException("Country not in SEPA zone: " + countryCode);

        if (mod97(cleaned) != 1)
            throw new InvalidIbanException("IBAN checksum failed (mod-97)");
    }

    private int mod97(String iban) {
        String rearranged = iban.substring(4) + iban.substring(0, 4);
        StringBuilder numeric = new StringBuilder();
        for (char c : rearranged.toCharArray()) {
            if (Character.isLetter(c)) numeric.append((int)(c - 'A' + 10));
            else numeric.append(c);
        }
        return new BigInteger(numeric.toString()).mod(BigInteger.valueOf(97)).intValue();
    }
}
