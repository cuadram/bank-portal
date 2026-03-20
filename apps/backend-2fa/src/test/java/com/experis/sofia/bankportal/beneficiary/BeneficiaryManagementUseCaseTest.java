package com.experis.sofia.bankportal.beneficiary;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.beneficiary.application.BeneficiaryManagementUseCase;
import com.experis.sofia.bankportal.beneficiary.application.dto.CreateBeneficiaryCommand;
import com.experis.sofia.bankportal.beneficiary.domain.Beneficiary;
import com.experis.sofia.bankportal.beneficiary.domain.BeneficiaryRepositoryPort;
import com.experis.sofia.bankportal.beneficiary.domain.IbanValidator;
import com.experis.sofia.bankportal.twofa.domain.service.TwoFactorService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — US-803 BeneficiaryManagementUseCase.
 *
 * @author SOFIA Developer Agent — FEAT-008 Sprint 10
 */
@ExtendWith(MockitoExtension.class)
class BeneficiaryManagementUseCaseTest {

    @Mock BeneficiaryRepositoryPort      repo;
    @Mock IbanValidator                  ibanValidator;
    @Mock TwoFactorService               twoFactorService;
    @Mock AuditLogService                auditLog;
    @InjectMocks BeneficiaryManagementUseCase useCase;

    private final UUID   userId = UUID.randomUUID();
    private final String VALID_IBAN = "ES9121000418450200051332";

    @Test
    @DisplayName("US-803 Escenario 1: Alta de beneficiario con OTP válido")
    void create_validIbanAndOtp_success() {
        var cmd = new CreateBeneficiaryCommand(userId, "Mi amigo", VALID_IBAN, "Juan García", "123456");
        doNothing().when(ibanValidator).validate(any());
        when(repo.existsActiveByUserIdAndIban(userId, VALID_IBAN)).thenReturn(false);
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        var result = useCase.create(cmd);

        assertThat(result.alias()).isEqualTo("Mi amigo");
        assertThat(result.ibanMasked()).contains("****");
        assertThat(result.ibanMasked()).doesNotContain(VALID_IBAN);
        verify(twoFactorService).verifyCurrentOtp(userId, "123456");
        verify(auditLog).log(eq("BENEFICIARY_ADDED"), eq(userId), anyString());
    }

    @Test
    @DisplayName("US-803 Escenario 2: IBAN inválido — OTP nunca se solicita")
    void create_invalidIban_throwsBeforeOtp() {
        doThrow(new IbanValidator.InvalidIbanException("Inválido"))
                .when(ibanValidator).validate(any());
        var cmd = new CreateBeneficiaryCommand(userId, "Test", "INVALID", "Test", "123456");

        assertThatThrownBy(() -> useCase.create(cmd))
                .isInstanceOf(IbanValidator.InvalidIbanException.class);
        verify(twoFactorService, never()).verifyCurrentOtp(any(), any());
        verify(repo, never()).save(any());
    }

    @Test
    @DisplayName("US-803 Escenario 4: Soft delete — beneficiario queda inactivo, historial intacto")
    void delete_existingBeneficiary_softDeletes() {
        var id = UUID.randomUUID();
        var beneficiary = new Beneficiary(userId, "Test", VALID_IBAN, "Test");
        when(repo.findByIdAndUserId(id, userId)).thenReturn(Optional.of(beneficiary));
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        useCase.delete(id, userId);

        assertThat(beneficiary.isActive()).isFalse();
        assertThat(beneficiary.getDeletedAt()).isNotNull();
        verify(auditLog).log(eq("BENEFICIARY_DELETED"), eq(userId), anyString());
    }

    @Test
    @DisplayName("US-803 Escenario 3: Editar alias no requiere OTP")
    void updateAlias_noOtpRequired() {
        var id = UUID.randomUUID();
        var beneficiary = new Beneficiary(userId, "Antiguo", VALID_IBAN, "Test");
        when(repo.findByIdAndUserId(id, userId)).thenReturn(Optional.of(beneficiary));
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));

        var result = useCase.updateAlias(id, userId, "Nuevo alias");

        assertThat(result.alias()).isEqualTo("Nuevo alias");
        verify(twoFactorService, never()).verifyCurrentOtp(any(), any());
    }

    @Test
    @DisplayName("IBAN duplicado activo → BeneficiaryAlreadyExistsException")
    void create_duplicateIban_throws() {
        doNothing().when(ibanValidator).validate(any());
        when(repo.existsActiveByUserIdAndIban(userId, VALID_IBAN)).thenReturn(true);
        var cmd = new CreateBeneficiaryCommand(userId, "Dup", VALID_IBAN, "Test", "123456");

        assertThatThrownBy(() -> useCase.create(cmd))
                .isInstanceOf(BeneficiaryManagementUseCase.BeneficiaryAlreadyExistsException.class);
        verify(twoFactorService, never()).verifyCurrentOtp(any(), any());
    }

    @Test
    @DisplayName("IbanValidator: IBAN español válido pasa sin excepción")
    void ibanValidator_validSpanishIban_noException() {
        var validator = new IbanValidator();
        assertThatNoException().isThrownBy(() -> validator.validate("ES9121000418450200051332"));
    }

    @Test
    @DisplayName("IbanValidator: IBAN con dígito control incorrecto lanza excepción")
    void ibanValidator_invalidCheckDigit_throws() {
        var validator = new IbanValidator();
        assertThatThrownBy(() -> validator.validate("ES0021000418450200051332"))
                .isInstanceOf(IbanValidator.InvalidIbanException.class);
    }
}
