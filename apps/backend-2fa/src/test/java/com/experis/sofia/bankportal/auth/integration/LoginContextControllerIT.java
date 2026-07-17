// DEBT-066 (S27): re-habilitado como IT de contexto completo (perimetro de seguridad).
// Contrato REAL de la app: estos endpoints sensibles exigen autenticacion (sin token -> 401).
// NOTA: los tests slice previos asumian authz por scope (full-session/context-pending) que la
// app NO implementa (SecurityConfig solo .authenticated()). Ese modelo queda como SEC-OBS-S27-01
// (decision S28). Aqui se cubre el contrato que SI se cumple: perimetro de autenticacion.
package com.experis.sofia.bankportal.auth.integration;

import com.experis.sofia.bankportal.integration.config.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("LoginContextControllerIT - perimetro de seguridad (DEBT-066)")
class LoginContextControllerIT extends IntegrationTestBase {

    @Test
    @DisplayName("POST auth/confirm-context sin token -> 401")
    void confirmContext_noToken_401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/confirm-context")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
