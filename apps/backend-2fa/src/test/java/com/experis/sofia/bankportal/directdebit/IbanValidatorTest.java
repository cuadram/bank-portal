package com.experis.sofia.bankportal.directdebit;

import com.experis.sofia.bankportal.directdebit.exception.InvalidIbanException;
import com.experis.sofia.bankportal.directdebit.validator.IbanValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for IbanValidator — ISO 13616 mod-97.
 * FEAT-017 Sprint 19 · US-1703
 */
@DisplayName("IbanValidator — ISO 13616 mod-97")
class IbanValidatorTest {

    private IbanValidator validator;

    @BeforeEach
    void setUp() { validator = new IbanValidator(); }

    @Test
    @DisplayName("Valid Spanish IBAN passes validation")
    void validSpanishIban() {
        assertThatNoException().isThrownBy(
            () -> validator.validate("ES9121000418450200051332"));
    }

    @Test
    @DisplayName("Valid German IBAN passes validation")
    void validGermanIban() {
        assertThatNoException().isThrownBy(
            () -> validator.validate("DE89370400440532013000"));
    }

    @Test
    @DisplayName("IBAN with spaces is normalised and passes")
    void ibanWithSpaces() {
        assertThatNoException().isThrownBy(
            () -> validator.validate("ES91 2100 0418 4502 0005 1332"));
    }

    @ParameterizedTest(name = "Invalid IBAN: {0}")
    @ValueSource(strings = {
        "ES00000000000000000001",   // wrong checksum
        "XX9121000418450200051332", // non-SEPA country
        "ES12",                     // too short
        ""                          // blank
    })
    @DisplayName("Invalid IBANs throw InvalidIbanException")
    void invalidIbansThrow(String iban) {
        assertThatThrownBy(() -> validator.validate(iban))
            .isInstanceOf(InvalidIbanException.class);
    }

    @Test
    @DisplayName("Null IBAN throws InvalidIbanException")
    void nullIbanThrows() {
        assertThatThrownBy(() -> validator.validate(null))
            .isInstanceOf(InvalidIbanException.class);
    }
}
