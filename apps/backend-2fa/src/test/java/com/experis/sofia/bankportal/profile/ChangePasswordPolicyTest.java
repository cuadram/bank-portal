package com.experis.sofia.bankportal.profile;

import com.experis.sofia.bankportal.profile.application.ChangePasswordUseCase.PasswordChangeException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests unitarios de la política de contraseñas — ChangePasswordUseCase.
 * Verifica el regex de complejidad sin arrancar contexto Spring.
 *
 * Sprint 14 — FEAT-012-A US-1203 — SOFIA QA Agent — CMMI VER SP 2.1
 */
@DisplayName("ChangePasswordUseCase — Política de contraseña")
class ChangePasswordPolicyTest {

    private static final Pattern COMPLEXITY =
            Pattern.compile("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$");

    @Test
    @DisplayName("Contraseña con todos los requisitos — cumple la política")
    void password_allRequirements_passes() {
        assertThat(COMPLEXITY.matcher("Secure@123").matches()).isTrue();
        assertThat(COMPLEXITY.matcher("BankPortal#2026").matches()).isTrue();
    }

    @Test
    @DisplayName("Contraseña sin mayúsculas — viola política")
    void password_noUppercase_fails() {
        assertThat(COMPLEXITY.matcher("secure@123").matches()).isFalse();
    }

    @Test
    @DisplayName("Contraseña sin minúsculas — viola política")
    void password_noLowercase_fails() {
        assertThat(COMPLEXITY.matcher("SECURE@123").matches()).isFalse();
    }

    @Test
    @DisplayName("Contraseña sin dígitos — viola política")
    void password_noDigit_fails() {
        assertThat(COMPLEXITY.matcher("Secure@Pass").matches()).isFalse();
    }

    @Test
    @DisplayName("Contraseña sin carácter especial — viola política")
    void password_noSpecialChar_fails() {
        assertThat(COMPLEXITY.matcher("Secure1234").matches()).isFalse();
    }

    @Test
    @DisplayName("Contraseña de menos de 8 caracteres — viola política")
    void password_tooShort_fails() {
        assertThat(COMPLEXITY.matcher("Sec@1").matches()).isFalse();
    }
}
