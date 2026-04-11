package com.experis.sofia.bankportal.directdebit.webhook;

import com.experis.sofia.bankportal.directdebit.domain.MandateStatus;
import com.experis.sofia.bankportal.directdebit.repository.DebitMandateRepository;
import com.experis.sofia.bankportal.notification.application.NotificationService;
import com.experis.sofia.bankportal.notification.domain.SecurityEventType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * DEBT-035: Handler para estado RETURNED de CoreBanking.
 * RN-DEBT035-01: cancela mandato cuando el deudor devuelve la domiciliación.
 * RN-DEBT035-02: notificación push al titular via NotificationService.
 * RN-DEBT035-03: audit trail cubierto por @Transactional + updated_at en entidad.
 * SEPA DD Core Rulebook 2024 — Sección 4.5 Return.
 * HOTFIX-S20: paquete corregido + API adaptada a entidades reales.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CoreBankingReturnedHandler {

    private final DebitMandateRepository mandateRepository;
    private final NotificationService    notificationService;

    @Transactional
    public void handleReturned(UUID mandateId, String rCodeStr, OffsetDateTime returnedAt) {
        log.info("Procesando RETURNED para mandateId={}, rCode={}", mandateId, rCodeStr);

        SepaReturnCode rCode = SepaReturnCode.fromCode(rCodeStr);
        String description = rCode != null ? rCode.getDescription() : "Devolución SEPA";

        // RN-DEBT035-01: cancelar mandato y registrar motivo de devolución
        mandateRepository.findById(mandateId).ifPresentOrElse(mandate -> {

            if (!MandateStatus.ACTIVE.equals(mandate.getStatus())) {
                log.warn("Mandato {} en estado {} — RETURNED ignorado", mandateId, mandate.getStatus());
                return;
            }

            mandate.cancel();   // → CANCELLED + cancelledAt = today + updatedAt = now
            mandateRepository.save(mandate);
            log.info("Mandato {} cancelado por RETURNED ({})", mandateId, rCodeStr);

            // RN-DEBT035-02: notificación al titular
            notificationService.createNotification(
                    mandate.getUserId(),
                    SecurityEventType.SESSION_REVOKED,   // reutilizamos tipo informativo genérico
                    Map.of(
                            "rCode",       rCodeStr,
                            "description", description,
                            "mandateRef",  mandate.getMandateRef(),
                            "creditor",    mandate.getCreditorName()
                    ),
                    "/domiciliaciones/" + mandateId
            );

        }, () -> log.warn("Mandato no encontrado para RETURNED: {}", mandateId));
    }
}
