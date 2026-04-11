package com.experis.sofia.bankportal.deposit.application.usecase;

import com.experis.sofia.bankportal.deposit.application.dto.SimulateDepositRequest;
import com.experis.sofia.bankportal.deposit.application.dto.SimulationResponse;
import com.experis.sofia.bankportal.deposit.domain.service.DepositSimulatorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Simulación sin autenticación — RN-F021-03. Stateless.
 */
@Service
@RequiredArgsConstructor
public class SimulateDepositUseCase {

    private final DepositSimulatorService simulatorService;

    public SimulationResponse execute(SimulateDepositRequest request) {
        return simulatorService.calcular(request.importe(), request.plazoMeses());
    }
}
