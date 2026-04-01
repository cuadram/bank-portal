package com.experis.sofia.bankportal.privacy.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para solicitar eliminación de cuenta (Paso 1 — OTP).
 * RN-F019-25: requiere OTP 2FA válido.
 * @author SOFIA — FEAT-019
 */
public record DeletionRequestDto(
    @NotBlank @Size(min = 6, max = 6) String otpCode
) {}
