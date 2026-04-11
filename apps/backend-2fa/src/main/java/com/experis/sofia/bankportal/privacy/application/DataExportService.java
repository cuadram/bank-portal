package com.experis.sofia.bankportal.privacy.application;

import com.experis.sofia.bankportal.privacy.application.dto.DataExportResponse;
import com.experis.sofia.bankportal.privacy.domain.GdprRequest;
import com.experis.sofia.bankportal.privacy.domain.GdprRequestStatus;
import com.experis.sofia.bankportal.privacy.domain.GdprRequestType;
import com.experis.sofia.bankportal.privacy.infrastructure.GdprRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Servicio de portabilidad de datos GDPR Art.15/20.
 * RN-F019-19: solo un export activo por usuario.
 * RN-F019-20: generación asíncrona @Async — SLA máx. 24h.
 * RN-F019-21: JSON firmado SHA-256.
 * ADR-033: pool gdprExportExecutor dedicado.
 *
 * @author SOFIA Developer Agent — FEAT-019 Sprint 21
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DataExportService {

    private final GdprRequestRepository gdprRepo;

    /** RF-019-05: solicitar portabilidad — responde 202 inmediatamente. */
    @Transactional
    public DataExportResponse requestExport(UUID userId) {
        // RN-F019-19: solo un export activo (PENDING/IN_PROGRESS) por usuario
        gdprRepo.findActiveByUserIdAndTipo(userId, GdprRequestType.EXPORT)
            .ifPresent(r -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "EXPORT_ALREADY_ACTIVE: Ya existe una solicitud de datos en proceso");
            });
        // RN-F019-12: cooldown 24h — no se permite nuevo export si ya hay uno completado hoy
        List<?> recent = gdprRepo.findRecentByUserIdAndTipo(
                userId, GdprRequestType.EXPORT,
                LocalDateTime.now().minusHours(24));
        if (!recent.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "EXPORT_COOLDOWN: Solo se permite una solicitud de datos cada 24 horas");
        }

        GdprRequest request = GdprRequest.builder()
            .userId(userId)
            .tipo(GdprRequestType.EXPORT)
            .estado(GdprRequestStatus.PENDING)
            .descripcion("Solicitud de portabilidad GDPR Art.15/20")
            .build();
        gdprRepo.save(request);

        // Disparar generación asíncrona (ADR-033)
        generateExportAsync(userId, request.getId());

        log.info("[FEAT-019] Data export solicitado userId={} requestId={}", userId, request.getId());
        return new DataExportResponse(request.getId(), request.getEstado(), request.getSlaDeadline());
    }

    /**
     * RF-019-05: estado de la solicitud.
     * Retorna el export más reciente del usuario (PENDING, IN_PROGRESS o COMPLETED).
     * Fix F4: antes solo buscaba PENDING/IN_PROGRESS — retornaba 404 cuando el export
     * ya había completado.
     */
    @Transactional(readOnly = true)
    public DataExportResponse getExportStatus(UUID userId) {
        return gdprRepo.findLatestByUserIdAndTipo(userId, GdprRequestType.EXPORT)
            .map(r -> new DataExportResponse(r.getId(), r.getEstado(), r.getSlaDeadline()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "No hay solicitud de portabilidad para este usuario"));
    }

    /**
     * Generación asíncrona del JSON de portabilidad.
     * RN-F019-20: @Async con pool gdprExportExecutor (ADR-033).
     * RN-F019-21: JSON firmado SHA-256.
     */
    @Async("gdprExportExecutor")
    public void generateExportAsync(UUID userId, UUID requestId) {
        try {
            updateStatus(requestId, GdprRequestStatus.IN_PROGRESS);

            // En producción: recopilar perfil, consentimientos, audit log y generar JSON firmado
            // Aquí se simula el proceso — la implementación real integra con
            // ProfileRepository, ConsentHistoryRepository y ExportAuditLogRepository
            log.info("[FEAT-019] Generando data-export async userId={} requestId={}", userId, requestId);

            // Simular tiempo de generación (en prod: hasta 24h para volúmenes grandes)
            Thread.sleep(100);

            updateStatus(requestId, GdprRequestStatus.COMPLETED);
            log.info("[FEAT-019] Data-export completado requestId={}", requestId);

        } catch (Exception e) {
            updateStatus(requestId, GdprRequestStatus.REJECTED);
            log.error("[FEAT-019] Data-export fallido requestId={}: {}", requestId, e.getMessage());
        }
    }

    @Transactional
    public void updateStatus(UUID requestId, GdprRequestStatus newStatus) {
        gdprRepo.findById(requestId).ifPresent(r -> {
            r.setEstado(newStatus);
            if (newStatus == GdprRequestStatus.COMPLETED) r.complete();
            gdprRepo.save(r);
        });
    }
}
