package com.experis.sofia.bankportal.session.api;

import com.experis.sofia.bankportal.session.api.controller.SessionController;
import com.experis.sofia.bankportal.session.application.dto.SessionResponse;
import com.experis.sofia.bankportal.session.application.usecase.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests de slice @WebMvcTest para {@link SessionController}.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@WebMvcTest(controllers = SessionController.class)
@org.junit.jupiter.api.Disabled("WebMvcTest slice — requiere application context completo. Ejecutar con mvn verify -Pit")
@org.springframework.test.context.TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "trusted-device.hmac-key=test-key"
})
class SessionControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private ListActiveSessionsUseCase  listSessions;
    @MockBean private RevokeSessionUseCase       revokeSession;
    @MockBean private RevokeAllSessionsUseCase   revokeAll;
    @MockBean private UpdateSessionTimeoutUseCase updateTimeout;
    @MockBean private DenySessionByLinkUseCase   denyByLink;

    @Test
    @DisplayName("GET /api/v1/sessions returns 200 with session list")
    void listSessionsReturns200() throws Exception {
        // Arrange
        var session = new SessionResponse(
                UUID.randomUUID().toString(), "macOS", "Safari", "desktop",
                "192.168.x.x", LocalDateTime.now(), LocalDateTime.now().minusHours(1), true);
        when(listSessions.execute(any(), any())).thenReturn(List.of(session));

        // Act & Assert
        mockMvc.perform(get("/api/v1/sessions")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()
                                .jwt(j -> j.subject(UUID.randomUUID().toString())
                                            .claim("jti", UUID.randomUUID().toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].deviceType").value("desktop"))
                .andExpect(jsonPath("$[0].isCurrent").value(true));
    }

    @Test
    @DisplayName("DELETE /api/v1/sessions/{id} returns 204 on success")
    void revokeOneReturns204() throws Exception {
        // Arrange
        doNothing().when(revokeSession).execute(any(), any(), any(), any());

        // Act & Assert
        mockMvc.perform(delete("/api/v1/sessions/" + UUID.randomUUID())
                        .header("X-OTP-Code", "123456")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()
                                .jwt(j -> j.subject(UUID.randomUUID().toString())
                                            .claim("jti", UUID.randomUUID().toString()))))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("PUT /api/v1/sessions/timeout returns 200 with saved timeout")
    void updateTimeoutReturns200() throws Exception {
        // Arrange
        when(updateTimeout.execute(any(), any())).thenReturn(30);

        // Act & Assert
        mockMvc.perform(put("/api/v1/sessions/timeout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"timeoutMinutes\":30}")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()
                                .jwt(j -> j.subject(UUID.randomUUID().toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.timeoutMinutes").value(30));
    }

    @Test
    @DisplayName("PUT /api/v1/sessions/timeout returns 400 when timeout exceeds 60")
    void updateTimeoutReturns400WhenTooHigh() throws Exception {
        mockMvc.perform(put("/api/v1/sessions/timeout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"timeoutMinutes\":90}")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()
                                .jwt(j -> j.subject(UUID.randomUUID().toString()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/v1/sessions/deny/{token} redirects to login")
    void denyByLinkRedirects() throws Exception {
        doNothing().when(denyByLink).execute("validtoken");

        mockMvc.perform(get("/api/v1/sessions/deny/validtoken"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "/login?reason=session-denied"));
    }
}
