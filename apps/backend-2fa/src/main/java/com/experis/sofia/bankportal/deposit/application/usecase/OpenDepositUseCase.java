package com.experis.sofia.bankportal.deposit.application.usecase;

import com.experis.sofia.bankportal.deposit.application.dto.DepositResponse;
import com.experis.sofia.bankportal.deposit.application.dto.OpenDepositRequest;
import com.experis.sofia.bankportal.deposit.domain.model.Deposit;
import com.experis.sofia.bankportal.deposit.domain.model.DepositStatus;
import com.experis.sofia.bankportal.deposit.domain.repository.DepositRepositoryPort;
import com.experis.sofia.bankportal.deposit.domain.service.DepositSimulatorService;
import com.experis.sofia.bankportal.deposit.infrastructure.corebanking.CoreBankingMockDepositClient;
import com.experis.sofia.bankportal.twofa.application.OtpValidationUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Apertura de depósito con SCA/PSD2 (RN-F021-08).
 * OTP validado ANTES de persistir — LA-TEST-003.
 */
@Service
@RequiredArgsConstructor
public class OpenDepositUseCase {

    private final OtpValidationUseCase otpValidation;
    private final DepositSimulatorService simulatorService;
    private final DepositRepositoryPort depositRepo;
    private final CoreBankingMockDepositClient coreBanking;

    public DepositResponse execute(OpenDepositRequest req, UUID userId) {
        // SCA PSD2 — OTP primero (RN-F021-08)
        otpValidation.validate(userId, req.otp());

        var sim = simulatorService.calcular(req.importe(), req.plazoMeses());

        Deposit deposit = new Deposit();
        deposit.setUserId(userId);
        deposit.setImporte(req.importe());
        deposit.setPlazoMeses(req.plazoMeses());
        deposit.setTin(sim.tin());
        deposit.setTae(sim.tae());
        deposit.setEstado(DepositStatus.ACTIVE);
        deposit.setRenovacion(req.renovacion());
        deposit.setCuentaOrigenId(req.cuentaOrigenId());
        deposit.setFechaApertura(LocalDate.now());
        deposit.setFechaVencimiento(LocalDate.now().plusMonths(req.plazoMeses()));

        Deposit saved = depositRepo.save(deposit);
        coreBanking.registrarApertura(saved.getId(), userId, req.importe());

        return new DepositResponse(
            saved.getId(), saved.getEstado(), saved.getImporte(), saved.getPlazoMeses(),
            saved.getTin(), saved.getTae(), saved.getRenovacion(),
            saved.getFechaApertura(), saved.getFechaVencimiento()
        );
    }
}
