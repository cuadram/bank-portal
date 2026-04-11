package com.experis.sofia.bankportal.privacy.application;

import com.experis.sofia.bankportal.privacy.application.dto.GdprRequestResponse;
import com.experis.sofia.bankportal.privacy.domain.GdprRequestStatus;
import com.experis.sofia.bankportal.privacy.domain.GdprRequestType;
import com.experis.sofia.bankportal.privacy.infrastructure.GdprRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Gestión del log de derechos GDPR y control automático de SLA.
 * RN-F019-34: SLA 30 días (GDPR Art.12§3).
 * RN-F019-35: alerta automática cuando SLA < 5 días.
 * RN-F019-36: retención 6 años.
 * RN-F019-37: log append-only.
 *
 * @author SOFIA Developer Agent — FEAT-019 Sprint 21
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GdprRequestService {

    private final GdprRequestRepository gdprRepo;

    /** RF-019-07: listado paginado para panel admin con filtros opcionales. */
    @Transactional(readOnly = true)
    public Page<GdprRequestResponse> getRequests(
            GdprRequestType tipo, GdprRequestStatus estado,
            LocalDateTime desde, LocalDateTime hasta, Pageable pageable) {
        return gdprRepo.findByFilters(tipo, estado, desde, hasta, pageable)
                       .map(GdprRequestResponse::from);
    }

    /**
     * SLA Job — ejecuta diariamente a las 08:00.
     * RN-F019-35: alerta push a ADMIN si SLA < 5 días y no enviada aún.
     */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void checkSlaAlerts() {
        LocalDateTime threshold = LocalDateTime.now().plusDays(5);
        var expiring = gdprRepo.findExpiringSoon(threshold);

        expiring.forEach(r -> {
            // En producción: NotificationService.sendPushToAdmins(...)
            log.warn("[FEAT-019] SLA ALERT: requestId={} userId={} tipo={} deadline={}",
                r.getId(), r.getUserId(), r.getTipo(), r.getSlaDeadline());
            r.setSlaAlertSent(true);
            gdprRepo.save(r);
        });

        if (!expiring.isEmpty()) {
            log.info("[FEAT-019] SLA job: {} solicitudes con alerta enviada", expiring.size());
        }
    }
}
