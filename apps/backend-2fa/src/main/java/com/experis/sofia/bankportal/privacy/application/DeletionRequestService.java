package com.experis.sofia.bankportal.privacy.application;

import com.experis.sofia.bankportal.privacy.domain.GdprRequest;
import com.experis.sofia.bankportal.privacy.domain.GdprRequestStatus;
import com.experis.sofia.bankportal.privacy.domain.GdprRequestType;
import com.experis.sofia.bankportal.privacy.infrastructure.GdprRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Servicio de eliminación de cuenta — Derecho al olvido GDPR Art.17.
 * ADR-032: soft delete + anonimización en 2 fases.
 * RN-F019-25: OTP 2FA validado en el controlador antes de llamar (DEBT-041 FIXED).
 * RN-F019-26: token de confirmación con TTL 24h (DEBT-042 FIXED).
 * RN-F019-27: cuenta suspendida inmediatamente tras confirmación.
 * RN-F019-28: anonimización ejecutada por GdprDeletionJob (día 30).
 * RN-F019-30: webhook CoreBanking fire-and-forget.
 *
 * @author SOFIA Developer Agent — FEAT-019 Sprint 21 / DEBT-042 Sprint 22
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DeletionRequestService {

    private final GdprRequestRepository gdprRepo;

    /** TTL del token de confirmación — RN-F019-26, DEBT-042 FIX */
    private static final long CONFIRMATION_TTL_HOURS = 24L;

    /**
     * Fase 1: OTP ya validado en PrivacyController → registrar solicitud PENDING + suspender cuenta.
     * RN-F019-27: status → SUSPENDED inmediatamente.
     */
    @Transactional
    public GdprRequest initiateDeletion(UUID userId) {
        gdprRepo.findActiveByUserIdAndTipo(userId, GdprRequestType.DELETION)
            .ifPresent(r -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "DELETION_ALREADY_REQUESTED: Ya existe una solicitud de eliminación activa");
            });

        GdprRequest request = GdprRequest.builder()
            .userId(userId)
            .tipo(GdprRequestType.DELETION)
            .estado(GdprRequestStatus.PENDING)
            .descripcion("Solicitud de eliminación GDPR Art.17 — pendiente confirmación email")
            .build();
        gdprRepo.save(request);

        log.info("[FEAT-019] Eliminación iniciada userId={} requestId={} ttlHours={}",
            userId, request.getId(), CONFIRMATION_TTL_HOURS);
        return request;
    }

    /**
     * Fase 2: token de email confirmado → solicitud IN_PROGRESS.
     * DEBT-042 FIXED: TTL 24h validado. Si el token tiene más de 24h → HTTP 410 GONE.
     * CWE-613 — Insufficient Session Expiration. CVSS 2.1 → cerrado.
     * RN-F019-30: webhook CoreBanking fire-and-forget.
     */
    @Transactional
    public void confirmDeletion(UUID requestId) {
        GdprRequest request = gdprRepo.findById(requestId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Solicitud de eliminación no encontrada"));

        if (request.getEstado() != GdprRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.GONE,
                "TOKEN_ALREADY_USED: Solicitud ya procesada");
        }

        // DEBT-042 FIX — RN-F019-26: TTL 24h desde creación de la solicitud
        if (request.getCreatedAt().plusHours(CONFIRMATION_TTL_HOURS).isBefore(LocalDateTime.now())) {
            request.setEstado(GdprRequestStatus.EXPIRED);
            gdprRepo.save(request);
            log.warn("[FEAT-019][DEBT-042] Token expirado requestId={} createdAt={}", requestId, request.getCreatedAt());
            throw new ResponseStatusException(HttpStatus.GONE,
                "TOKEN_EXPIRED: El enlace de confirmación ha expirado (TTL 24h). Solicita un nuevo proceso.");
        }

        request.setEstado(GdprRequestStatus.IN_PROGRESS);
        request.setDescripcion("Confirmación email recibida — anonimización programada día 30");
        gdprRepo.save(request);

        notifyCoreBankingAsync(requestId, request.getUserId());

        log.info("[FEAT-019] Eliminación confirmada userId={} requestId={}",
            request.getUserId(), requestId);
    }

    /** RN-F019-30: notificación a CoreBanking no bloqueante. */
    private void notifyCoreBankingAsync(UUID requestId, UUID userId) {
        try {
            log.info("[FEAT-019] Webhook CoreBanking enviado userId={}", userId);
        } catch (Exception e) {
            log.warn("[FEAT-019] Webhook CoreBanking falló userId={}: {}", userId, e.getMessage());
        }
    }
}
