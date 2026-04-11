package com.experis.sofia.bankportal.notification.api;

import com.experis.sofia.bankportal.notification.application.ManagePreferencesUseCase;
import com.experis.sofia.bankportal.notification.application.ManagePreferencesUseCase.PreferencePatchRequest;
import com.experis.sofia.bankportal.notification.domain.NotificationEventType;
import com.experis.sofia.bankportal.notification.domain.NotificationPreference;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * GET/PATCH /api/v1/notifications/preferences — FEAT-014.
 * RV-F014-08 fix: {@code @NotNull} en {@code eventType} del DTO de entrada.
 */
@RestController
@RequestMapping("/api/v1/notifications/preferences")
@RequiredArgsConstructor
public class NotificationPreferenceController {

    private final ManagePreferencesUseCase useCase;

    @GetMapping
    public ResponseEntity<List<PreferenceDto>> getPreferences(
            HttpServletRequest request) {
        UUID userId = (UUID) request.getAttribute("authenticatedUserId");
        return ResponseEntity.ok(
                useCase.getPreferences(userId).stream()
                        .map(PreferenceDto::from)
                        .toList());
    }

    @PatchMapping
    public ResponseEntity<PreferenceDto> updatePreference(
            HttpServletRequest request,
            @Valid @RequestBody PreferencePatchDto req) {
        UUID userId = (UUID) request.getAttribute("authenticatedUserId");
        NotificationPreference updated = useCase.updatePreference(userId,
                new PreferencePatchRequest(req.eventType(), req.emailEnabled(),
                        req.pushEnabled(), req.inAppEnabled()));
        return ResponseEntity.ok(PreferenceDto.from(updated));
    }

    // ── DTOs ─────────────────────────────────────────────────────────────────

    public record PreferenceDto(
            NotificationEventType eventType,
            boolean emailEnabled,
            boolean pushEnabled,
            boolean inAppEnabled
    ) {
        static PreferenceDto from(NotificationPreference p) {
            return new PreferenceDto(p.getEventType(), p.isEmailEnabled(),
                    p.isPushEnabled(), p.isInAppEnabled());
        }
    }

    /** RV-F014-08 fix: @NotNull en eventType para retornar 400 en lugar de NPE. */
    public record PreferencePatchDto(
            @NotNull NotificationEventType eventType,
            Boolean emailEnabled,
            Boolean pushEnabled,
            Boolean inAppEnabled
    ) {}
}
