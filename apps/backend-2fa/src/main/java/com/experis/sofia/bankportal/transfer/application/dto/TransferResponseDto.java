package com.experis.sofia.bankportal.transfer.application.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** Respuesta de transferencia completada. */
public record TransferResponseDto(
        UUID          transferId,
        String        status,
        LocalDateTime executedAt,
        BigDecimal    sourceBalance,
        BigDecimal    targetBalance
) {}
