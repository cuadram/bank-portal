package com.experis.sofia.bankportal.loan.application.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record ApplyLoanRequest(
        @NotNull @DecimalMin("1000.00") @DecimalMax("60000.00")
        BigDecimal importe,

        @NotNull @Min(12) @Max(84)
        Integer plazo,

        @NotBlank
        String finalidad,

        @NotBlank @Size(min = 6, max = 6)
        String otpCode
) {}
