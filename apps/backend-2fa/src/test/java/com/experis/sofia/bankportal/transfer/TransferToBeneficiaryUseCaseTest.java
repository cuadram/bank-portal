package com.experis.sofia.bankportal.transfer;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.beneficiary.domain.Beneficiary;
import com.experis.sofia.bankportal.beneficiary.domain.BeneficiaryRepositoryPort;
import com.experis.sofia.bankportal.transfer.application.TransferLimitValidationService;
import com.experis.sofia.bankportal.transfer.application.TransferToBeneficiaryUseCase;
import com.experis.sofia.bankportal.transfer.application.TransferUseCase;
import com.experis.sofia.bankportal.transfer.application.dto.BeneficiaryTransferCommand;
import com.experis.sofia.bankportal.transfer.domain.BankCoreTransferPort;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — US-802 TransferToBeneficiaryUseCase.
 * Cubre los 4 escenarios Gherkin del SRS RF-802 (RV-004 fix).
 *
 * @author SOFIA Developer Agent — FEAT-008 Sprint 10
 */
@ExtendWith(MockitoExtension.class)
class TransferToBeneficiaryUseCaseTest {

    @Mock TransferLimitValidationService limitService;
    @Mock BankCoreTransferPort           corePort;
    @Mock TransferRepositoryPort         transferRepo;
    @Mock BeneficiaryRepositoryPort      beneficiaryRepo;
    @Mock TwoFactorService               twoFactorService;
    @Mock AuditLogService                auditLog;
    @InjectMocks TransferToBeneficiaryUseCase useCase;

    private UUID       userId;
    private UUID       beneficiaryId;
    private UUID       sourceId;
    private Beneficiary activeBeneficiary;

    @BeforeEach
    void setUp() {
        userId        = UUID.randomUUID();
        beneficiaryId = UUID.randomUUID();
        sourceId      = UUID.randomUUID();
        activeBeneficiary = new com.experis.sofia.bankportal.beneficiary.domain.Beneficiary(
                userId, "Test Alias", "ES9121000418450200051332", "Test Holder");
    }

    @Test
    @DisplayName("US-802 Escenario 1: Transferencia a beneficiario exitosa — historial previo existe")
    void execute_beneficiaryTransfer_success_withPreviousTransfer() {
        var amount = new BigDecimal("300.00");
        var cmd = new BeneficiaryTransferCommand(userId, beneficiaryId, sourceId,
                amount, "Pago", "123456", false);

        when(beneficiaryRepo.findByIdAndUserId(beneficiaryId, userId))
                .thenReturn(Optional.of(activeBeneficiary));
        when(transferRepo.existsCompletedTransferToBeneficiary(userId, beneficiaryId))
                .thenReturn(true);  // NO es primera transferencia
        when(corePort.getAvailableBalance(sourceId)).thenReturn(new BigDecimal("1000.00"));
        when(corePort.executeExternalTransfer(any(), any(), any(), any()))
                .thenReturn(new BankCoreTransferPort.TransferResult(
                        true, new BigDecimal("700.00"), BigDecimal.ZERO, null));
        when(transferRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        var result = useCase.execute(cmd);

        assertThat(result.status()).isEqualTo("COMPLETED");
        assertThat(result.sourceBalance()).isEqualByComparingTo("700.00");
        verify(auditLog).log(eq("TRANSFER_TO_BENEFICIARY_COMPLETED"), eq(userId), anyString());
        verify(limitService).incrementDailyAccumulated(userId, amount);
    }

    @Test
    @DisplayName("US-802 Escenario 2: Primera transferencia sin confirmación → FIRST_TRANSFER_CONFIRMATION_REQUIRED")
    void execute_firstTransfer_withoutConfirmation_throws() {
        var cmd = new BeneficiaryTransferCommand(userId, beneficiaryId, sourceId,
                new BigDecimal("100.00"), "Test", "123456", false);  // firstTransferConfirmed=false

        when(beneficiaryRepo.findByIdAndUserId(beneficiaryId, userId))
                .thenReturn(Optional.of(activeBeneficiary));
        when(transferRepo.existsCompletedTransferToBeneficiary(userId, beneficiaryId))
                .thenReturn(false);  // ES primera transferencia

        assertThatThrownBy(() -> useCase.execute(cmd))
                .isInstanceOf(TransferToBeneficiaryUseCase.BeneficiaryTransferException.class)
                .hasMessage("FIRST_TRANSFER_CONFIRMATION_REQUIRED");

        // OTP nunca debe verificarse si falta confirmación
        verify(twoFactorService, never()).verifyCurrentOtp(any(), any());
        verify(transferRepo, never()).save(any());
    }

    @Test
    @DisplayName("US-802 Escenario 4: Beneficiario eliminado → BENEFICIARY_NOT_FOUND")
    void execute_deletedBeneficiary_throws() {
        activeBeneficiary.softDelete();
        var cmd = new BeneficiaryTransferCommand(userId, beneficiaryId, sourceId,
                new BigDecimal("100.00"), "Test", "123456", true);

        when(beneficiaryRepo.findByIdAndUserId(beneficiaryId, userId))
                .thenReturn(Optional.of(activeBeneficiary));

        assertThatThrownBy(() -> useCase.execute(cmd))
                .isInstanceOf(TransferToBeneficiaryUseCase.BeneficiaryTransferException.class)
                .hasMessage("BENEFICIARY_NOT_FOUND");
    }

    @Test
    @DisplayName("US-802 Escenario 3: Límite diario superado → excepción antes de OTP")
    void execute_dailyLimitExceeded_throwsBeforeOtp() {
        var cmd = new BeneficiaryTransferCommand(userId, beneficiaryId, sourceId,
                new BigDecimal("600.00"), "Test", "123456", true);

        when(beneficiaryRepo.findByIdAndUserId(beneficiaryId, userId))
                .thenReturn(Optional.of(activeBeneficiary));
        when(transferRepo.existsCompletedTransferToBeneficiary(userId, beneficiaryId))
                .thenReturn(true);
        doThrow(new TransferLimitValidationService.TransferLimitExceededException(
                "DAILY_LIMIT_EXCEEDED", "Límite diario restante: 400€"))
                .when(limitService).validate(userId, new BigDecimal("600.00"));

        assertThatThrownBy(() -> useCase.execute(cmd))
                .isInstanceOf(TransferLimitValidationService.TransferLimitExceededException.class)
                .extracting("errorCode").isEqualTo("DAILY_LIMIT_EXCEEDED");

        verify(twoFactorService, never()).verifyCurrentOtp(any(), any());
        verify(transferRepo, never()).save(any());
    }

    @Test
    @DisplayName("US-802: audit_log contiene TRANSFER_INITIATED + OTP_VERIFIED + COMPLETED")
    void execute_success_auditLogHasThreeEvents() {
        var cmd = new BeneficiaryTransferCommand(userId, beneficiaryId, sourceId,
                new BigDecimal("200.00"), "Test", "123456", true);

        when(beneficiaryRepo.findByIdAndUserId(beneficiaryId, userId))
                .thenReturn(Optional.of(activeBeneficiary));
        when(transferRepo.existsCompletedTransferToBeneficiary(userId, beneficiaryId))
                .thenReturn(false);  // primera transferencia pero confirmada
        when(corePort.getAvailableBalance(sourceId)).thenReturn(new BigDecimal("1000.00"));
        when(corePort.executeExternalTransfer(any(), any(), any(), any()))
                .thenReturn(new BankCoreTransferPort.TransferResult(
                        true, new BigDecimal("800.00"), BigDecimal.ZERO, null));
        when(transferRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        useCase.execute(cmd);

        verify(auditLog).log(eq("TRANSFER_INITIATED"),             eq(userId), anyString());
        verify(auditLog).log(eq("TRANSFER_OTP_VERIFIED"),          eq(userId), anyString());
        verify(auditLog).log(eq("TRANSFER_TO_BENEFICIARY_COMPLETED"), eq(userId), anyString());
    }
}
