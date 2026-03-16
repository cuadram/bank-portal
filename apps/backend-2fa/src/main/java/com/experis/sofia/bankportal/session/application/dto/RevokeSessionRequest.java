package com.experis.sofia.bankportal.session.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO de request para revocar una sesión — requiere OTP de confirmación.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
public record RevokeSessionRequest(
        @NotBlank(message = "OTP code is required")
        @Pattern(regexp = "\\d{6}", message = "OTP must be 6 digits")
        String otpCode
) {}
