package com.experis.sofia.bankportal.loan.application.usecase;

import com.experis.sofia.bankportal.loan.application.dto.SimulateRequest;
import com.experis.sofia.bankportal.loan.application.dto.SimulationResponse;
import com.experis.sofia.bankportal.loan.domain.model.AmortizationRow;
import com.experis.sofia.bankportal.loan.domain.service.AmortizationCalculator;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class SimulateLoanUseCase {

    // TAE fija en STG — sin coreBanking real (ADR-035)
    private static final BigDecimal TAE_STG = new BigDecimal("6.50");

    private final AmortizationCalculator calculator;

    public SimulateLoanUseCase(AmortizationCalculator calculator) {
        this.calculator = calculator;
    }

    /** Stateless — no persiste, no audit log (RN-F020-04) */
    public SimulationResponse execute(SimulateRequest req) {
        BigDecimal cuota = calculator.calcularCuota(req.importe(), req.plazo(), TAE_STG);
        List<AmortizationRow> schedule = calculator.generarCuadro(req.importe(), req.plazo(), TAE_STG);
        BigDecimal costeTotal = calculator.calcularCosteTotal(cuota, req.plazo());
        BigDecimal intereses = costeTotal.subtract(req.importe());
        return new SimulationResponse(cuota, TAE_STG, costeTotal, intereses, schedule);
    }
}
