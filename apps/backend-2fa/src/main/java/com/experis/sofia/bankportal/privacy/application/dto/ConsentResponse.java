package com.experis.sofia.bankportal.privacy.application.dto;

import com.experis.sofia.bankportal.privacy.domain.ConsentType;
import java.time.LocalDateTime;

/** DTO de respuesta de consentimiento GDPR. @author SOFIA — FEAT-019 */
public record ConsentResponse(
    ConsentType tipo,
    boolean     activo,
    LocalDateTime updatedAt
) {}
