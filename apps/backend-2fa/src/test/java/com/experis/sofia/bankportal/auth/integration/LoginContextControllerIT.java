package com.experis.sofia.bankportal.auth.integration;

import com.experis.sofia.bankportal.auth.api.AccountAndContextController;
import com.experis.sofia.bankportal.auth.application.AccountUnlockUseCase;
import com.experis.sofia.bankportal.auth.application.LoginContextUseCase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** US-603 - Integration tests capa web - contratos HTTP confirm-context. SOFIA QA Agent Sprint 7 */
@WebMvcTest(AccountAndContextController.class)
@DisplayName("US-603 - confirm-context HTTP contracts")
class LoginContextControllerIT {

    @Autowired MockMvc mockMvc;
    @MockBean AccountUnlockUseCase accountUnlockUseCase;
    @MockBean LoginContextUseCase  loginContextUseCase;

    @Nested @DisplayName("POST /api/v1/auth/confirm-context")
    class ConfirmContext {

        @Test @DisplayName("Sin JWT -> 401 Unauthorized")
        void noJwt_401() throws Exception {
            mockMvc.perform(post("/api/v1/auth/confirm-context")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"confirmToken\":\"tok\",\"currentSubnet\":\"192.168.1\"}"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @WithMockUser(authorities = "SCOPE_context-pending")
        @DisplayName("JWT scope=context-pending + token valido -> 204")
        void validJwt_204() throws Exception {
            doNothing().when(loginContextUseCase)
                    .confirmContext(any(), anyString(), anyString(), anyString());
            mockMvc.perform(post("/api/v1/auth/confirm-context")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"confirmToken\":\"valid-token\",\"currentSubnet\":\"192.168.1\"}"))
                    .andExpect(status().isNoContent());
        }

        @Test
        @WithMockUser(authorities = "SCOPE_context-pending")
        @DisplayName("Token expirado -> 400")
        void expiredToken_400() throws Exception {
            doThrow(new LoginContextUseCase.ContextConfirmException("Token expirado"))
                    .when(loginContextUseCase)
                    .confirmContext(any(), anyString(), anyString(), anyString());
            mockMvc.perform(post("/api/v1/auth/confirm-context")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"confirmToken\":\"expired\",\"currentSubnet\":\"192.168.1\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @WithMockUser(authorities = "SCOPE_full-session")
        @DisplayName("JWT scope=full-session (no context-pending) -> 403 Forbidden (ADR-011)")
        void wrongScope_403() throws Exception {
            mockMvc.perform(post("/api/v1/auth/confirm-context")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"confirmToken\":\"tok\",\"currentSubnet\":\"192.168.1\"}"))
                    .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(authorities = "SCOPE_context-pending")
        @DisplayName("Body sin confirmToken -> 400 Bean Validation")
        void missingToken_400() throws Exception {
            mockMvc.perform(post("/api/v1/auth/confirm-context")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"currentSubnet\":\"192.168.1\"}"))
                    .andExpect(status().isBadRequest());
        }
    }
}
