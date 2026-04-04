package com.experis.sofia.bankportal.directdebit.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/** FEAT-017 Sprint 19 */
@Data
public class CancelMandateRequest {
    @NotBlank @Pattern(regexp = "\\d{6}")
    private String otp;
}
