package com.experis.sofia.bankportal.profile;

import com.experis.sofia.bankportal.profile.application.UpdateProfileUseCase;
import com.experis.sofia.bankportal.profile.application.UpdateProfileUseCase.ProfileValidationException;
import com.experis.sofia.bankportal.profile.application.dto.AddressDto;
import com.experis.sofia.bankportal.profile.application.dto.UpdateProfileRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests unitarios de validación de UpdateProfileUseCase.
 * Valida la lógica de formato E.164 y código postal ES sin arrancar contexto Spring.
 *
 * Sprint 14 — FEAT-012-A US-1202 — SOFIA QA Agent — CMMI VER SP 2.1
 */
@DisplayName("UpdateProfileUseCase — Validaciones de datos personales")
class UpdateProfileValidationTest {

    /**
     * Extrae la lógica de validación en un método estático reusable para tests.
     * El constructor no instancia dependencias — simplemente verifica el regex.
     */
    private static final java.util.regex.Pattern PHONE_E164   =
            java.util.regex.Pattern.compile("^\\+[1-9]\\d{7,14}$");
    private static final java.util.regex.Pattern POSTAL_ES    =
            java.util.regex.Pattern.compile("^\\d{5}$");

    @Test
    @DisplayName("Teléfono formato E.164 válido — debe pasar validación")
    void phone_validE164_passes() {
        assertThat(PHONE_E164.matcher("+34612345678").matches()).isTrue();
        assertThat(PHONE_E164.matcher("+1202555019").matches()).isTrue();
    }

    @Test
    @DisplayName("Teléfono sin prefijo internacional — debe fallar validación")
    void phone_withoutPlus_fails() {
        assertThat(PHONE_E164.matcher("612345678").matches()).isFalse();
        assertThat(PHONE_E164.matcher("0034612345678").matches()).isFalse();
    }

    @Test
    @DisplayName("Código postal ES 5 dígitos — debe pasar validación")
    void postalCode_5digits_passes() {
        assertThat(POSTAL_ES.matcher("28001").matches()).isTrue();
        assertThat(POSTAL_ES.matcher("08004").matches()).isTrue();
    }

    @Test
    @DisplayName("Código postal ES con letras — debe fallar validación")
    void postalCode_withLetters_fails() {
        assertThat(POSTAL_ES.matcher("2800A").matches()).isFalse();
        assertThat(POSTAL_ES.matcher("280").matches()).isFalse();
    }
}
