package com.experis.sofia.bankportal.transfer;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.transfer.application.TransferLimitValidationService;
import com.experis.sofia.bankportal.transfer.application.TransferUseCase;
import com.experis.sofia.bankportal.transfer.application.dto.OwnTransferCommand;
import com.experis.sofia.bankportal.transfer.domain.BankCoreTransferPort;
import com.experis.sofia.bankportal.transfer.domain.Transfer;
import com.experis.sofia.bankportal.transfer.domain.TransferRepositoryPort;
import com.experis.sofia.bankportal.twofa.domain.service.TwoFactorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — US-801 TransferUseCase.
 * Cobertura objetivo >= 80% (CMMI DoD + RF-801).
 *
 * @author SOFIA Developer Agent — FEAT-008 Sprint 10
 */
@ExtendWith(MockitoExtension.class)
class TransferUseCaseTest {

    @Mock TransferLimitValidationService limitService;
    @Mock BankCoreTransferPort           corePort;
    @Mock TransferRepositoryPort         transferRepo;
    @Mock TwoFactorService               twoFactorService;
    @Mock AuditLogService                auditLog;
    @InjectMocks TransferUseCase         useCase;

    private UUID userId;
    private UUID sourceId;
    private UUID targetId;

    @BeforeEach
    void setUp() {
        userId   = UUID.randomUUID();
        sourceId = UUID.randomUUID();
        targetId = UUID.randomUUID();
    }

    @Test
    @DisplayName("US-801 Escenario 1: Transferencia propia exitosa — saldo actualizado")
    void execute_ownTransfer_success() {
        var amount = new BigDecimal("500.00");
        var cmd = new OwnTransferCommand(userId, sourceId, targetId, amount, "Test", "123456");

        when(corePort.getAvailableBalance(sourceId)).thenReturn(new BigDecimal("2000.00"));
        when(corePort.executeOwnTransfer(sourceId, targetId, amount, "Test"))
                .thenReturn(new BankCoreTransferPort.TransferResult(
                        true, new BigDecimal("1500.00"), new BigDecimal("500.00"), null));
        when(transferRepo.save(any(Transfer.class))).thenAnswer(i -> i.getArgument(0));

        var result = useCase.execute(cmd);

        assertThat(result.status()).isEqualTo("COMPLETED");
        assertThat(result.sourceBalance()).isEqualByComparingTo("1500.00");
        assertThat(result.targetBalance()).isEqualByComparingTo("500.00");
        assertThat(result.transferId()).isNotNull();
        verify(limitService).incrementDailyAccumulated(userId, amount);
    }

    @Test
    @DisplayName("US-801 Escenario 2: Saldo insuficiente — OTP nunca se solicita")
    void execute_insufficientFunds_throwsBeforeOtp() {
        var cmd = new OwnTransferCommand(userId, sourceId, targetId,
                new BigDecimal("1500.00"), "Test", "123456");
        when(corePort.getAvailableBalance(sourceId)).thenReturn(new BigDecimal("1000.00"));

        assertThatThrownBy(() -> useCase.execute(cmd))
                .isInstanceOf(TransferUseCase.InsufficientFundsException.class);

        verify(twoFactorService, never()).verifyCurrentOtp(any(), any());
        verify(transferRepo, never()).save(any());
    }

    @Test
    @DisplayName("US-801 Escenario 3: OTP incorrecto — transferencia no se persiste")
    void execute_invalidOtp_transferNotPersisted() {
        var cmd = new OwnTransferCommand(userId, sourceId, targetId,
                new BigDecimal("100.00"), "Test", "000000");
        when(corePort.getAvailableBalance(sourceId)).thenReturn(new BigDecimal("2000.00"));
        doThrow(new RuntimeException("OTP_INVALID"))
                .when(twoFactorService).verifyCurrentOtp(userId, "000000");

        assertThatThrownBy(() -> useCase.execute(cmd))
                .hasMessageContaining("OTP_INVALID");

        verify(corePort, never()).executeOwnTransfer(any(), any(), any(), any());
        verify(transferRepo, never()).save(any());
    }

    @Test
    @DisplayName("US-801 Escenario 4: audit_log contiene los 3 eventos de trazabilidad")
    void execute_success_auditLogHasThreeEvents() {
        var amount = new BigDecimal("200.00");
        var cmd = new OwnTransferCommand(userId, sourceId, targetId, amount, "Test", "123456");
        when(corePort.getAvailableBalance(sourceId)).thenReturn(new BigDecimal("1000.00"));
        when(corePort.executeOwnTransfer(any(), any(), any(), any()))
                .thenReturn(new BankCoreTransferPort.TransferResult(
                        true, new BigDecimal("800.00"), new BigDecimal("200.00"), null));
        when(transferRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        useCase.execute(cmd);

        verify(auditLog).log(eq("TRANSFER_INITIATED"),    eq(userId), anyString());
        verify(auditLog).log(eq("TRANSFER_OTP_VERIFIED"), eq(userId), anyString());
        verify(auditLog).log(eq("TRANSFER_COMPLETED"),    eq(userId), anyString());
    }

    @Test
    @DisplayName("Transfer domain: importe negativo rechazado en constructor")
    void domain_negativeAmount_rejected() {
        assertThatThrownBy(() ->
                new Transfer(userId, sourceId, targetId, null, new BigDecimal("-1.00"), "Test"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("positivo");
    }

    @Test
    @DisplayName("Transfer domain: sin destino rechazado en constructor")
    void domain_noDestination_rejected() {
        assertThatThrownBy(() ->
                new Transfer(userId, sourceId, null, null, new BigDecimal("100.00"), "Test"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("destino");
    }
}
