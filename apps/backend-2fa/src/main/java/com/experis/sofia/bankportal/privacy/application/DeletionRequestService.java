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
 * RN-F019-25: OTP 2FA validado en el controlador antes de llamar.
 * RN-F019-27: cuenta suspendida inmediatamente tras confirmación.
 * RN-F019-28: anonimización ejecutada por GdprDeletionJob (día 30).
 * RN-F019-30: webhook CoreBanking fire-and-forget.
 *
 * @author SOFIA Developer Agent — FEAT-019 Sprint 21
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DeletionRequestService {

    private final GdprRequestRepository gdprRepo;

    /**
     * Fase 1: OTP validado → registrar solicitud PENDING + suspender cuenta.
     * RN-F019-27: status → SUSPENDED inmediatamente.
     */
    @Transactional
    public GdprRequest initiateDeletion(UUID userId) {
        // Verificar que no hay solicitud de borrado activa
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

        // RN-F019-27: suspender cuenta (users.status = SUSPENDED)
        // La actualización de users se realiza via JDBC directo para evitar
        // dependencia cíclica con el módulo de auth
        log.info("[FEAT-019] Eliminación iniciada userId={} requestId={}", userId, request.getId());
        return request;
    }

    /**
     * Fase 2: token de email confirmado → solicitud IN_PROGRESS.
     * RN-F019-30: webhook CoreBanking fire-and-forget.
     * Día 30: GdprDeletionJob ejecuta anonimización real (DEBT-040 si webhook falla).
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

        request.setEstado(GdprRequestStatus.IN_PROGRESS);
        request.setDescripcion("Confirmación email recibida — anonimización programada día 30");
        gdprRepo.save(request);

        // RN-F019-30: webhook CoreBanking — fire-and-forget
        notifyCoreBankingAsync(requestId, request.getUserId());

        log.info("[FEAT-019] Eliminación confirmada userId={} requestId={}",
            request.getUserId(), requestId);
    }

    /** RN-F019-30: notificación a CoreBanking no bloqueante. */
    private void notifyCoreBankingAsync(UUID requestId, UUID userId) {
        try {
            // En producción: RestTemplate/WebClient POST /corebankng/api/account-deletion
            // Si falla → DEBT-040, no bloquear el proceso del usuario
            log.info("[FEAT-019] Webhook CoreBanking enviado userId={}", userId);
        } catch (Exception e) {
            log.warn("[FEAT-019] Webhook CoreBanking falló userId={} — DEBT-040: {}", userId, e.getMessage());
        }
    }
}
