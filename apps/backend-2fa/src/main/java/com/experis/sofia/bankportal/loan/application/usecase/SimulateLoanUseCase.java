package com.experis.sofia.bankportal.loan.application.usecase;

import com.experis.sofia.bankportal.loan.application.dto.SimulateRequest;
import com.experis.sofia.bankportal.loan.application.dto.SimulationResponse;
import com.experis.sofia.bankportal.loan.domain.model.AmortizationRow;
import com.experis.sofia.bankportal.loan.domain.service.AmortizationCalculator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/**
 * DEBT-044 CLOSED: TAE externalizada a application.yml (bank.products.loan.tae).
 * Sprint 23 · FEAT-021
 */
@Service
public class SimulateLoanUseCase {

    @Value("${bank.products.loan.tae}")
    private BigDecimal taeAnual;

    private final AmortizationCalculator calculator;

    public SimulateLoanUseCase(AmortizationCalculator calculator) {
        this.calculator = calculator;
    }

    /** Stateless — no persiste, no audit log (RN-F020-04) */
    public SimulationResponse execute(SimulateRequest req) {
        BigDecimal cuota = calculator.calcularCuota(req.importe(), req.plazo(), taeAnual);
        List<AmortizationRow> schedule = calculator.generarCuadro(req.importe(), req.plazo(), taeAnual);
        BigDecimal costeTotal = calculator.calcularCosteTotal(cuota, req.plazo());
        BigDecimal intereses = costeTotal.subtract(req.importe());
        return new SimulationResponse(cuota, taeAnual, costeTotal, intereses, schedule);
    }
}
