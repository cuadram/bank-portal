package com.experis.sofia.bankportal.notification.integration;

import com.experis.sofia.bankportal.auth.application.SseRegistry;
import com.experis.sofia.bankportal.notification.api.SseNotificationController;
import com.experis.sofia.bankportal.notification.application.NotificationActionService;
import com.experis.sofia.bankportal.notification.application.UnreadCountService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * US-305 + US-304 — Integration tests SseNotificationController.
 *
 * Contratos HTTP validados:
 *   GET  /stream sin JWT               → 401
 *   GET  /stream scope=full-session    → 200 text/event-stream
 *   GET  /stream scope erróneo         → 403
 *   POST /{id}/revoke-session ok       → 204
 *   POST /{id}/revoke-session error    → 400
 *   POST /{id}/revoke-session sin JWT  → 401
 *
 * @author SOFIA QA Agent — Sprint 8 Semana 2
 */
@WebMvcTest(SseNotificationController.class)
@DisplayName("US-305/304 - SseNotificationController HTTP contracts")
class SseNotificationControllerIT {

    @Autowired MockMvc mockMvc;

    @MockBean SseRegistry             sseRegistry;
    @MockBean UnreadCountService      unreadCountService;
    @MockBean NotificationActionService actionService;

    // ─── SSE stream ───────────────────────────────────────────────────────────

    @Nested @DisplayName("GET /api/v1/notifications/stream")
    class SseStream {

        @Test @DisplayName("Sin JWT → 401 Unauthorized")
        void noJwt_401() throws Exception {
            mockMvc.perform(get("/api/v1/notifications/stream")
                    .accept(MediaType.TEXT_EVENT_STREAM))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @WithMockUser(authorities = "SCOPE_full-session")
        @DisplayName("scope=full-session → 200 text/event-stream")
        void validScope_200_eventStream() throws Exception {
            when(sseRegistry.register(any())).thenReturn(new org.springframework.web.servlet.mvc.method.annotation.SseEmitter(100L));
            when(unreadCountService.getUnreadCount(any())).thenReturn(3L);

            mockMvc.perform(get("/api/v1/notifications/stream")
                    .accept(MediaType.TEXT_EVENT_STREAM))
                    .andExpect(status().isOk())
                    .andExpect(header().string("X-Accel-Buffering", "no"))
                    .andExpect(header().string("Cache-Control", "no-cache, no-store"));
        }

        @Test
        @WithMockUser(authorities = "SCOPE_context-pending")
        @DisplayName("scope=context-pending → 403 Forbidden")
        void wrongScope_403() throws Exception {
            mockMvc.perform(get("/api/v1/notifications/stream")
                    .accept(MediaType.TEXT_EVENT_STREAM))
                    .andExpect(status().isForbidden());
        }
    }

    // ─── Revoke session ───────────────────────────────────────────────────────

    @Nested @DisplayName("POST /api/v1/notifications/{id}/revoke-session")
    class RevokeSession {

        private final UUID NOTIF_ID = UUID.randomUUID();

        @Test @DisplayName("Sin JWT → 401")
        void noJwt_401() throws Exception {
            mockMvc.perform(post("/api/v1/notifications/" + NOTIF_ID + "/revoke-session"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @WithMockUser(authorities = "SCOPE_full-session")
        @DisplayName("Accion exitosa → 204 No Content")
        void success_204() throws Exception {
            doNothing().when(actionService)
                    .revokeSessionFromNotification(any(), eq(NOTIF_ID));

            mockMvc.perform(post("/api/v1/notifications/" + NOTIF_ID + "/revoke-session"))
                    .andExpect(status().isNoContent());
        }

        @Test
        @WithMockUser(authorities = "SCOPE_full-session")
        @DisplayName("NotificationActionException → 400 Bad Request")
        void actionException_400() throws Exception {
            doThrow(new NotificationActionService.NotificationActionException("no tiene sesión"))
                    .when(actionService).revokeSessionFromNotification(any(), eq(NOTIF_ID));

            mockMvc.perform(post("/api/v1/notifications/" + NOTIF_ID + "/revoke-session"))
                    .andExpect(status().isBadRequest());
        }
    }
}
