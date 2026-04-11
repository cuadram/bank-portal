package com.experis.sofia.bankportal.audit.application;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.audit.infrastructure.AuditLogQueryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * US-604 — Historial de cambios de configuración de seguridad.
 *
 * <p>Requisitos:
 * <ul>
 *   <li>R-F6-004: el usuario puede consultar los últimos 90 días de cambios de configuración</li>
 *   <li>R-F6-005: cada entrada incluye timestamp, tipo de cambio, IP/subnet y flag unusualLocation</li>
 *   <li>R-F6-006: acceso solo al propio historial — claim sub del JWT verificado en controller</li>
 *   <li>DEBT-008 reutilizado: AuditLogQueryRepository ya optimizado con queries paralelas</li>
 * </ul>
 *
 * <p>Tipos de eventos incluidos en el historial (CONFIG_EVENT_TYPES):
 * <pre>
 *   PREFERENCES_UPDATED, PASSWORD_CHANGED, TWO_FA_ENABLED, TWO_FA_DISABLED,
 *   TRUSTED_DEVICE_ADDED, TRUSTED_DEVICE_REMOVED, NOTIFICATION_PREFS_UPDATED,
 *   LOGIN_NEW_CONTEXT_CONFIRMED, ACCOUNT_UNLOCKED
 * </pre>
 *
 * @author SOFIA Developer Agent — FEAT-006 US-604 Sprint 7
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityConfigHistoryUseCase {

    private final AuditLogQueryRepository auditLogQueryRepository;
    private final AuditLogService         auditLogService;

    /** Ventana máxima de consulta: 90 días. */
    public static final int HISTORY_WINDOW_DAYS = 90;

    /** Eventos de configuración incluidos en el historial (US-604 + DEBT-008 filter). */
    public static final List<String> CONFIG_EVENT_TYPES = List.of(
            "PREFERENCES_UPDATED",
            "PASSWORD_CHANGED",
            "TWO_FA_ENABLED",
            "TWO_FA_DISABLED",
            "TRUSTED_DEVICE_ADDED",
            "TRUSTED_DEVICE_REMOVED",
            "NOTIFICATION_PREFS_UPDATED",
            "LOGIN_NEW_CONTEXT_CONFIRMED",
            "ACCOUNT_UNLOCKED"
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Query principal
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Retorna el historial de cambios de configuración del usuario para los últimos
     * {@value HISTORY_WINDOW_DAYS} días, ordenado por timestamp descendente.
     *
     * <p>El flag {@code unusualLocation} se activa cuando el evento proviene de una
     * subnet no registrada como {@code known_subnet} en el momento del evento.
     *
     * @param userId  ID del usuario autenticado (verificado contra claim JWT en controller)
     * @param sinceOverride  si se especifica, limita la ventana (máximo HISTORY_WINDOW_DAYS)
     * @return lista inmutable de entradas de historial, vacía si no hay registros
     */
    @Transactional(readOnly = true)
    public List<ConfigHistoryEntry> getHistory(UUID userId, Instant sinceOverride) {
        Instant windowStart = computeWindowStart(sinceOverride);

        List<ConfigHistoryEntry> entries =
                auditLogQueryRepository.findConfigChangesByUserId(
                        userId, CONFIG_EVENT_TYPES, windowStart);

        auditLogService.log("CONFIG_HISTORY_VIEWED", userId,
                "entries=" + entries.size() + " since=" + windowStart);
        log.debug("[US-604] Config history consultado · user={} entries={}", userId, entries.size());

        return entries;
    }

    /** Sobrecarga sin override — usa ventana completa de 90 días. */
    @Transactional(readOnly = true)
    public List<ConfigHistoryEntry> getHistory(UUID userId) {
        return getHistory(userId, null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private Instant computeWindowStart(Instant sinceOverride) {
        Instant maxWindow = Instant.now().minus(HISTORY_WINDOW_DAYS, ChronoUnit.DAYS);
        if (sinceOverride == null) return maxWindow;
        // El override no puede superar la ventana máxima
        return sinceOverride.isBefore(maxWindow) ? maxWindow : sinceOverride;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Record de salida — proyección de AuditLog para US-604
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Entrada de historial de configuración proyectada desde AuditLog.
     *
     * @param id               UUID del registro de auditoría
     * @param eventType        tipo de evento (ej. "PREFERENCES_UPDATED")
     * @param eventDescription descripción legible del cambio
     * @param occurredAt       timestamp del evento (UTC)
     * @param ipSubnet         subnet de origen del evento (primeros 3 octetos)
     * @param unusualLocation  true si la subnet no era conocida en el momento del evento
     */
    public record ConfigHistoryEntry(
            UUID    id,
            String  eventType,
            String  eventDescription,
            Instant occurredAt,
            String  ipSubnet,
            boolean unusualLocation
    ) {}
}
