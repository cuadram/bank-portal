// DEBT-066 (S27): re-habilitado como IT de contexto completo (perimetro de seguridad).
// Contrato REAL de la app: estos endpoints sensibles exigen autenticacion (sin token -> 401).
// NOTA: los tests slice previos asumian authz por scope (full-session/context-pending) que la
// app NO implementa (SecurityConfig solo .authenticated()). Ese modelo queda como SEC-OBS-S27-01
// (decision S28). Aqui se cubre el contrato que SI se cumple: perimetro de autenticacion.
package com.experis.sofia.bankportal.notification.integration;

import com.experis.sofia.bankportal.integration.config.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("SseNotificationControllerIT - perimetro de seguridad (DEBT-066)")
class SseNotificationControllerIT extends IntegrationTestBase {

    @Test
    @DisplayName("GET notifications/stream sin token -> 401")
    void stream_noToken_401() throws Exception {
        mockMvc.perform(get("/api/v1/notifications/stream").accept(MediaType.TEXT_EVENT_STREAM))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST notifications/{id}/revoke-session sin token -> 401")
    void revokeSession_noToken_401() throws Exception {
        mockMvc.perform(post("/api/v1/notifications/{id}/revoke-session", UUID.randomUUID()))
                .andExpect(status().isUnauthorized());
    }
}
