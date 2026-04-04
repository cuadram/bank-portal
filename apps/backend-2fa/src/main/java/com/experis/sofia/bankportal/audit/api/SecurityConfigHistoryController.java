package com.experis.sofia.bankportal.audit.api;

import com.experis.sofia.bankportal.audit.application.SecurityConfigHistoryUseCase;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * US-604 — Endpoint para consultar historial de cambios de configuración de seguridad.
 *
 * <p>Ruta: {@code GET /api/v1/security/config-history}
 *
 * <p>Seguridad:
 * <ul>
 *   <li>Requiere JWT scope=full-session (R-F6-006)</li>
 *   <li>userId extraído del claim {@code sub} del JWT — no del request body</li>
 *   <li>El usuario solo puede ver su propio historial</li>
 * </ul>
 *
 * <p>Query params opcionales:
 * <ul>
 *   <li>{@code since} — ISO-8601 timestamp de inicio (máx. 90 días atrás)</li>
 *   <li>{@code eventType} — filtro por tipo de evento (ej. "PREFERENCES_UPDATED")</li>
 * </ul>
 *
 * @author SOFIA Developer Agent — FEAT-006 US-604 Sprint 7
 */
@RestController
@RequiredArgsConstructor
public class SecurityConfigHistoryController {

    private final SecurityConfigHistoryUseCase configHistoryUseCase;

    /**
     * Retorna el historial de cambios de configuración del usuario autenticado.
     *
     * <p>Respuesta 200 con lista (puede ser vacía). Nunca 404 — un historial vacío
     * es un estado válido (usuario nuevo o sin cambios en los últimos 90 días).
     */
    @GetMapping("/api/v1/security/config-history")
    public ResponseEntity<ConfigHistoryResponse> getConfigHistory(
            HttpServletRequest request,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            Instant since,
            @RequestParam(required = false) String eventType) {

        UUID userId = (UUID) request.getAttribute("authenticatedUserId");

        List<SecurityConfigHistoryUseCase.ConfigHistoryEntry> entries =
                configHistoryUseCase.getHistory(userId, since);

        // Filtro opcional por eventType en memoria (lista pequeña — máx. 90 días)
        if (eventType != null && !eventType.isBlank()) {
            entries = entries.stream()
                    .filter(e -> eventType.equalsIgnoreCase(e.eventType()))
                    .toList();
        }

        return ResponseEntity.ok(new ConfigHistoryResponse(entries, entries.size()));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DTOs de respuesta
    // ─────────────────────────────────────────────────────────────────────────

    record ConfigHistoryResponse(
            List<SecurityConfigHistoryUseCase.ConfigHistoryEntry> entries,
            int total
    ) {}
}
