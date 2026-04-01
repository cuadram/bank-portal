package com.experis.sofia.bankportal.privacy.application.dto;

import com.experis.sofia.bankportal.privacy.domain.GdprRequestStatus;
import com.experis.sofia.bankportal.privacy.domain.GdprRequestType;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/** DTO de respuesta para el panel admin GDPR. @author SOFIA — FEAT-019 */
public record GdprRequestResponse(
    UUID              id,
    UUID              userId,
    GdprRequestType   tipo,
    GdprRequestStatus estado,
    LocalDateTime     createdAt,
    LocalDateTime     slaDeadline,
    long              diasRestantes,
    boolean           slaAlertSent
) {
    public static GdprRequestResponse from(
            com.experis.sofia.bankportal.privacy.domain.GdprRequest r) {
        long dias = ChronoUnit.DAYS.between(LocalDateTime.now(), r.getSlaDeadline());
        return new GdprRequestResponse(
            r.getId(), r.getUserId(), r.getTipo(), r.getEstado(),
            r.getCreatedAt(), r.getSlaDeadline(), dias, r.isSlaAlertSent()
        );
    }
}
