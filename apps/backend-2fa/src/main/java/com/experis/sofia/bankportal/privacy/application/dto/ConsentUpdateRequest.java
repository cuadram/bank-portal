package com.experis.sofia.bankportal.privacy.application.dto;

import com.experis.sofia.bankportal.privacy.domain.ConsentType;
import jakarta.validation.constraints.NotNull;

/**
 * Request para actualizar un consentimiento GDPR.
 * RN-F019-15: SECURITY no puede enviarse como tipo (validado en servicio).
 * @author SOFIA — FEAT-019
 */
public record ConsentUpdateRequest(
    @NotNull ConsentType tipo,
    @NotNull Boolean     activo
) {}
