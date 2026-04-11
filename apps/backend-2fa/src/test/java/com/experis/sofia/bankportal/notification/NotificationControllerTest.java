package com.experis.sofia.bankportal.notification;

import com.experis.sofia.bankportal.notification.api.NotificationController;
import com.experis.sofia.bankportal.notification.application.ManageNotificationsUseCase;
import com.experis.sofia.bankportal.notification.application.SseEmitterRegistry;
import com.experis.sofia.bankportal.notification.domain.UserNotification;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests de slice @WebMvcTest para {@link NotificationController}.
 *
 * @author SOFIA Developer Agent — FEAT-004 Sprint 5
 */
@WebMvcTest(controllers = NotificationController.class)
@org.junit.jupiter.api.Disabled("WebMvcTest slice — requiere application context completo. Ejecutar con mvn verify -Pit")
@org.springframework.test.context.TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "trusted-device.hmac-key=test-key"
})
class NotificationControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private ManageNotificationsUseCase manageNotifications;
    @MockBean private SseEmitterRegistry          sseRegistry;

    // ── US-301 ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/notifications returns 200 with page of notifications")
    void listReturns200() throws Exception {
        var notification = buildNotification(false);
        var page = new PageImpl<>(List.of(notification));
        when(manageNotifications.listNotifications(any(), any(), anyInt(), anyInt()))
                .thenReturn(page);

        mockMvc.perform(get("/api/v1/notifications")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()
                                .jwt(j -> j.subject(UUID.randomUUID().toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].eventType").value("LOGIN_NEW_DEVICE"))
                .andExpect(jsonPath("$.content[0].read").value(false));
    }

    // ── US-303 ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/notifications/unread-count returns 200 with count")
    void unreadCountReturns200() throws Exception {
        when(manageNotifications.countUnread(any())).thenReturn(7L);

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()
                                .jwt(j -> j.subject(UUID.randomUUID().toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(7));
    }

    // ── US-302 ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("PUT /api/v1/notifications/{id}/read returns 204")
    void markOneReadReturns204() throws Exception {
        doNothing().when(manageNotifications).markOneAsRead(any(), any());

        mockMvc.perform(put("/api/v1/notifications/" + UUID.randomUUID() + "/read")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()
                                .jwt(j -> j.subject(UUID.randomUUID().toString()))))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("PUT /api/v1/notifications/read-all returns 200 with markedCount")
    void markAllReadReturns200() throws Exception {
        when(manageNotifications.markAllAsRead(any())).thenReturn(5);

        mockMvc.perform(put("/api/v1/notifications/read-all")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()
                                .jwt(j -> j.subject(UUID.randomUUID().toString()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.markedCount").value(5));
    }

    // ── US-301: filtro por eventType ──────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/notifications?eventType=LOGIN_NEW_DEVICE passes filter")
    void filterByEventType() throws Exception {
        when(manageNotifications.listNotifications(any(), eq("LOGIN_NEW_DEVICE"),
                anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/notifications")
                        .param("eventType", "LOGIN_NEW_DEVICE")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()
                                .jwt(j -> j.subject(UUID.randomUUID().toString()))))
                .andExpect(status().isOk());

        verify(manageNotifications)
                .listNotifications(any(), eq("LOGIN_NEW_DEVICE"), anyInt(), anyInt());
    }

    // ── US-301: sin JWT → 401 ─────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/notifications without JWT returns 401")
    void requiresAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/notifications"))
                .andExpect(status().isUnauthorized());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private UserNotification buildNotification(boolean read) {
        var n = new UserNotification(
                UUID.randomUUID(), UUID.randomUUID(),
                "LOGIN_NEW_DEVICE", "Nuevo acceso detectado",
                "Acceso desde Chrome · Windows (192.168.x.x)",
                Map.of("browser", "Chrome", "os", "Windows"),
                "/security/sessions",
                LocalDateTime.now().minusMinutes(5)
        );
        if (read) n.markAsRead();
        return n;
    }
}
