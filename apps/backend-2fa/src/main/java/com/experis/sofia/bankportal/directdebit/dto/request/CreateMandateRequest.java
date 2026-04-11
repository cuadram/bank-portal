package com.experis.sofia.bankportal.directdebit.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.UUID;

/** FEAT-017 Sprint 19 */
@Data
public class CreateMandateRequest {
    @NotBlank @Size(max = 140)
    private String creditorName;

    @NotBlank @Size(min = 5, max = 34)
    private String creditorIban;

    @NotNull
    private UUID accountId;

    @NotBlank @Pattern(regexp = "\\d{6}")
    private String otp;
}
