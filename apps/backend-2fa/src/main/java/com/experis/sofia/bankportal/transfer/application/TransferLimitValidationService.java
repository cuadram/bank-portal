package com.experis.sofia.bankportal.transfer.application;

import com.experis.sofia.bankportal.transfer.domain.TransferLimitPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Valida límites de transferencia antes de ejecutar la operación (US-804).
 * Orden: límite por operación → límite diario (puerto, fallback graceful).
 *
 * RV-001 fix: depende de TransferLimitPort (dominio) en lugar de TransferLimitRedisAdapter (infra).
 *
 * @author SOFIA Developer Agent — FEAT-008 Sprint 10
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TransferLimitValidationService {

    private final TransferLimitPort limitPort;  // RV-001: puerto de dominio, no adaptador concreto

    @Value("${transfer.limit.per-operation:2000.00}")
    private BigDecimal perOperationLimit;

    @Value("${transfer.limit.daily:3000.00}")
    private BigDecimal dailyLimit;

    public void validate(UUID userId, BigDecimal amount) {
        if (amount.compareTo(perOperationLimit) > 0) {
            log.warn("Límite por operación superado: userId={} amount={} limit={}", userId, amount, perOperationLimit);
            throw new TransferLimitExceededException("OPERATION_LIMIT_EXCEEDED",
                    "Límite máximo por operación: " + perOperationLimit + "€");
        }
        try {
            BigDecimal accumulated = limitPort.getDailyAccumulated(userId);
            if (accumulated.add(amount).compareTo(dailyLimit) > 0) {
                BigDecimal remaining = dailyLimit.subtract(accumulated).max(BigDecimal.ZERO);
                throw new TransferLimitExceededException("DAILY_LIMIT_EXCEEDED",
                        "Límite diario restante: " + remaining + "€");
            }
        } catch (TransferLimitExceededException e) {
            throw e;
        } catch (Exception e) {
            log.error("Redis no disponible para validación de límites userId={} — operación permitida", userId);
        }
    }

    /** Retorna el límite por operación configurado. */
    public BigDecimal getPerOperationLimit() { return perOperationLimit; }

    /** Retorna el límite diario configurado. */
    public BigDecimal getDailyLimit() { return dailyLimit; }

    /** Consulta el acumulado diario del usuario sin modificarlo. */
    public BigDecimal getDailyAccumulated(UUID userId) {
        try {
            return limitPort.getDailyAccumulated(userId);
        } catch (Exception e) {
            log.error("Redis no disponible para consulta de acumulado userId={}", userId);
            return BigDecimal.ZERO;
        }
    }

    /** Incrementa el acumulado diario tras confirmar la transferencia (best-effort). */
    public void incrementDailyAccumulated(UUID userId, BigDecimal amount) {
        try {
            limitPort.incrementDaily(userId, amount);
        } catch (Exception e) {
            log.error("Redis no disponible para incrementar contador diario userId={}", userId);
        }
    }

    public static class TransferLimitExceededException extends RuntimeException {
        private final String errorCode;
        public TransferLimitExceededException(String errorCode, String message) {
            super(message);
            this.errorCode = errorCode;
        }
        public String getErrorCode() { return errorCode; }
    }
}
