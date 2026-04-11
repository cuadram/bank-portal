package com.experis.sofia.bankportal.deposit.application.dto;

import com.experis.sofia.bankportal.deposit.domain.model.RenewalInstruction;
import jakarta.validation.constraints.NotNull;

public record RenewalRequest(@NotNull RenewalInstruction instruction) {}
