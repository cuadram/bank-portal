package com.experis.sofia.bankportal.privacy.application.dto;

import com.experis.sofia.bankportal.privacy.domain.GdprRequestStatus;
import java.time.LocalDateTime;
import java.util.UUID;

/** DTO de respuesta para solicitudes de portabilidad/supresión. @author SOFIA — FEAT-019 */
public record DataExportResponse(
    UUID              requestId,
    GdprRequestStatus estado,
    LocalDateTime     slaDeadline
) {}
