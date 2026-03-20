package com.experis.sofia.bankportal.transfer;

import com.experis.sofia.bankportal.transfer.application.TransferLimitValidationService;
import com.experis.sofia.bankportal.transfer.infrastructure.redis.TransferLimitRedisAdapter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — US-804 TransferLimitValidationService.
 *
 * @author SOFIA Developer Agent — FEAT-008 Sprint 10
 */
@ExtendWith(MockitoExtension.class)
class TransferLimitValidationServiceTest {

    @Mock TransferLimitRedisAdapter redisAdapter;
    @InjectMocks TransferLimitValidationService service;

    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "perOperationLimit", new BigDecimal("2000.00"));
        ReflectionTestUtils.setField(service, "dailyLimit",        new BigDecimal("3000.00"));
    }

    @Test
    @DisplayName("US-804 Escenario 2: Límite por operación superado → OPERATION_LIMIT_EXCEEDED")
    void validate_operationLimitExceeded() {
        when(redisAdapter.getDailyAccumulated(userId)).thenReturn(BigDecimal.ZERO);

        assertThatThrownBy(() -> service.validate(userId, new BigDecimal("2500.00")))
                .isInstanceOf(TransferLimitValidationService.TransferLimitExceededException.class)
                .extracting("errorCode").isEqualTo("OPERATION_LIMIT_EXCEEDED");
    }

    @Test
    @DisplayName("US-804 Escenario 1: Límite diario superado → DAILY_LIMIT_EXCEEDED")
    void validate_dailyLimitExceeded() {
        when(redisAdapter.getDailyAccumulated(userId)).thenReturn(new BigDecimal("2500.00"));

        assertThatThrownBy(() -> service.validate(userId, new BigDecimal("600.00")))
                .isInstanceOf(TransferLimitValidationService.TransferLimitExceededException.class)
                .extracting("errorCode").isEqualTo("DAILY_LIMIT_EXCEEDED");
    }

    @Test
    @DisplayName("US-804 Escenario 3: Dentro de límites → sin excepción")
    void validate_withinLimits_noException() {
        when(redisAdapter.getDailyAccumulated(userId)).thenReturn(new BigDecimal("1000.00"));
        assertThatNoException().isThrownBy(() -> service.validate(userId, new BigDecimal("500.00")));
    }

    @Test
    @DisplayName("Redis no disponible → operación permitida (degradación graceful)")
    void validate_redisUnavailable_allowsOperation() {
        when(redisAdapter.getDailyAccumulated(userId)).thenThrow(new RuntimeException("Redis down"));
        assertThatNoException().isThrownBy(() -> service.validate(userId, new BigDecimal("100.00")));
    }

    @Test
    @DisplayName("Límite diario exactamente al máximo → sin excepción")
    void validate_exactlyAtDailyLimit_noException() {
        when(redisAdapter.getDailyAccumulated(userId)).thenReturn(new BigDecimal("1000.00"));
        // 1000 + 2000 = 3000 exactamente al límite → OK
        assertThatNoException().isThrownBy(() -> service.validate(userId, new BigDecimal("2000.00")));
    }
}
