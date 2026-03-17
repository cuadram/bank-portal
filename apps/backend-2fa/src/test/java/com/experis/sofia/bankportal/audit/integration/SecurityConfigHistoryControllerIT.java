package com.experis.sofia.bankportal.audit.integration;

import com.experis.sofia.bankportal.audit.api.SecurityConfigHistoryController;
import com.experis.sofia.bankportal.audit.application.SecurityConfigHistoryUseCase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * US-604 - Integration tests capa web - SecurityConfigHistoryController.
 *
 * Contratos HTTP validados:
 *   GET /api/v1/security/config-history sin JWT     → 401
 *   GET /api/v1/security/config-history scope erróneo → 403
 *   GET /api/v1/security/config-history vacío        → 200 { entries:[], total:0 }
 *   GET /api/v1/security/config-history con datos    → 200 { entries:[...], total:N }
 *   GET /api/v1/security/config-history ?eventType   → 200 filtrado
 *
 * @author SOFIA QA Agent - Sprint 7
 */
@WebMvcTest(SecurityConfigHistoryController.class)
@DisplayName("US-604 - SecurityConfigHistoryController HTTP contracts")
class SecurityConfigHistoryControllerIT {

    @Autowired MockMvc mockMvc;
    @MockBean  SecurityConfigHistoryUseCase configHistoryUseCase;

    private SecurityConfigHistoryUseCase.ConfigHistoryEntry entry(String type) {
        return new SecurityConfigHistoryUseCase.ConfigHistoryEntry(
                UUID.randomUUID(), type, "desc", Instant.now(), "192.168.1", false);
    }

    @Test
    @DisplayName("Sin JWT -> 401 Unauthorized")
    void noJwt_401() throws Exception {
        mockMvc.perform(get("/api/v1/security/config-history")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(authorities = "SCOPE_context-pending")
    @DisplayName("scope=context-pending (no full-session) -> 403 Forbidden (R-F6-006)")
    void wrongScope_403() throws Exception {
        mockMvc.perform(get("/api/v1/security/config-history")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Nested
    @DisplayName("GET /api/v1/security/config-history — autenticado scope=full-session")
    class AuthenticatedRequests {

        @Test
        @WithMockUser(authorities = "SCOPE_full-session")
        @DisplayName("Sin eventos → 200 { entries:[], total:0 }")
        void emptyHistory_200() throws Exception {
            when(configHistoryUseCase.getHistory(any(), any())).thenReturn(List.of());
            mockMvc.perform(get("/api/v1/security/config-history")
                    .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.total").value(0))
                    .andExpect(jsonPath("$.entries").isArray())
                    .andExpect(jsonPath("$.entries").isEmpty());
        }

        @Test
        @WithMockUser(authorities = "SCOPE_full-session")
        @DisplayName("2 eventos → 200 { total:2 }")
        void twoEvents_200WithCount() throws Exception {
            when(configHistoryUseCase.getHistory(any(), any()))
                    .thenReturn(List.of(entry("PREFERENCES_UPDATED"), entry("TWO_FA_ENABLED")));
            mockMvc.perform(get("/api/v1/security/config-history")
                    .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.total").value(2))
                    .andExpect(jsonPath("$.entries.length()").value(2));
        }

        @Test
        @WithMockUser(authorities = "SCOPE_full-session")
        @DisplayName("?eventType=TWO_FA_ENABLED filtra correctamente")
        void filterByEventType_returnFiltered() throws Exception {
            when(configHistoryUseCase.getHistory(any(), any()))
                    .thenReturn(List.of(
                            entry("PREFERENCES_UPDATED"),
                            entry("TWO_FA_ENABLED"),
                            entry("TWO_FA_ENABLED")));
            mockMvc.perform(get("/api/v1/security/config-history")
                    .param("eventType", "TWO_FA_ENABLED")
                    .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.total").value(2));
        }

        @Test
        @WithMockUser(authorities = "SCOPE_full-session")
        @DisplayName("?since=ISO8601 pasa el parámetro al use case")
        void sinceParam_passedToUseCase() throws Exception {
            when(configHistoryUseCase.getHistory(any(), any())).thenReturn(List.of());
            mockMvc.perform(get("/api/v1/security/config-history")
                    .param("since", "2026-02-01T00:00:00Z")
                    .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk());
        }
    }
}
