package com.experis.sofia.bankportal.deposit.application.usecase;

import com.experis.sofia.bankportal.deposit.application.dto.DepositResponse;
import com.experis.sofia.bankportal.deposit.application.dto.OpenDepositRequest;
import com.experis.sofia.bankportal.deposit.application.dto.SimulationResponse;
import com.experis.sofia.bankportal.deposit.domain.model.Deposit;
import com.experis.sofia.bankportal.deposit.domain.model.DepositStatus;
import com.experis.sofia.bankportal.deposit.domain.model.RenewalInstruction;
import com.experis.sofia.bankportal.deposit.domain.repository.DepositRepositoryPort;
import com.experis.sofia.bankportal.deposit.domain.service.DepositSimulatorService;
import com.experis.sofia.bankportal.deposit.infrastructure.corebanking.CoreBankingMockDepositClient;
import com.experis.sofia.bankportal.twofa.application.OtpValidationUseCase;
import com.experis.sofia.bankportal.twofa.domain.exception.InvalidOtpException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * TC-DEPOSIT-007..011 — OpenDepositUseCase
 */
@ExtendWith(MockitoExtension.class)
class OpenDepositUseCaseTest {

    @Mock OtpValidationUseCase otpValidation;
    @Mock DepositSimulatorService simulatorService;
    @Mock DepositRepositoryPort depositRepo;
    @Mock CoreBankingMockDepositClient coreBanking;

    @InjectMocks OpenDepositUseCase useCase;

    private final UUID userId  = UUID.randomUUID();
    private final UUID cuentaId = UUID.randomUUID();
    private final OpenDepositRequest validRequest = new OpenDepositRequest(
        new BigDecimal("10000"), 12, cuentaId, RenewalInstruction.RENEW_MANUAL, "123456"
    );

    @BeforeEach
    void setUp() {
        SimulationResponse sim = new SimulationResponse(
            new BigDecimal("0.0325"), new BigDecimal("0.0330"),
            new BigDecimal("325.00"), new BigDecimal("61.75"),
            new BigDecimal("263.25"), new BigDecimal("10263.25")
        );
        when(simulatorService.calcular(any(), anyInt())).thenReturn(sim);

        Deposit saved = new Deposit();
        saved.setId(UUID.randomUUID());
        saved.setEstado(DepositStatus.ACTIVE);
        saved.setImporte(new BigDecimal("10000"));
        saved.setPlazoMeses(12);
        saved.setTin(new BigDecimal("0.0325"));
        saved.setTae(new BigDecimal("0.0330"));
        saved.setRenovacion(RenewalInstruction.RENEW_MANUAL);
        saved.setFechaApertura(LocalDate.now());
        saved.setFechaVencimiento(LocalDate.now().plusMonths(12));
        when(depositRepo.save(any())).thenReturn(saved);
    }

    @Test
    @DisplayName("TC-DEPOSIT-007 — Apertura valida devuelve deposito ACTIVE")
    void aperturaValidaDevuelveDepositoActive() {
        DepositResponse resp = useCase.execute(validRequest, userId);
        assertThat(resp).isNotNull();
        assertThat(resp.estado()).isEqualTo(DepositStatus.ACTIVE);
        assertThat(resp.importe()).isEqualByComparingTo(new BigDecimal("10000"));
    }

    @Test
    @DisplayName("TC-DEPOSIT-008 — OTP validado ANTES de persistir (LA-TEST-003, PSD2 SCA)")
    void otpValidadoAntesDeGuardar() {
        useCase.execute(validRequest, userId);
        // OTP debe llamarse antes que save
        var order = inOrder(otpValidation, depositRepo);
        order.verify(otpValidation).validate(userId, "123456");
        order.verify(depositRepo).save(any());
    }

    @Test
    @DisplayName("TC-DEPOSIT-009 — OTP invalido lanza excepcion y NO persiste")
    void otpInvalidoNoGuarda() {
        doThrow(new InvalidOtpException())
            .when(otpValidation).validate(any(), any());
        assertThatThrownBy(() -> useCase.execute(validRequest, userId))
            .isInstanceOf(InvalidOtpException.class);
        verify(depositRepo, never()).save(any());
    }

    @Test
    @DisplayName("TC-DEPOSIT-010 — CoreBanking notificado tras persistencia")
    void coreBankingNotificadoTrasPersistencia() {
        useCase.execute(validRequest, userId);
        var order = inOrder(depositRepo, coreBanking);
        order.verify(depositRepo).save(any());
        order.verify(coreBanking).registrarApertura(any(), any(), any());
    }

    @Test
    @DisplayName("TC-DEPOSIT-011 — RenovacionManual establecida por defecto (RN-F021-07)")
    void renovacionManualPorDefecto() {
        DepositResponse resp = useCase.execute(validRequest, userId);
        assertThat(resp.renovacion()).isEqualTo(RenewalInstruction.RENEW_MANUAL);
    }
}
