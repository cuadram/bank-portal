package com.experis.sofia.bankportal.session.application.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * DTO de request para actualizar el timeout de inactividad (US-103).
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
public record UpdateTimeoutRequest(
        @NotNull
        @Min(value = 5,  message = "Timeout must be at least 5 minutes")
        @Max(value = 60, message = "Timeout cannot exceed 60 minutes (PCI-DSS policy)")
        Integer timeoutMinutes
) {}
