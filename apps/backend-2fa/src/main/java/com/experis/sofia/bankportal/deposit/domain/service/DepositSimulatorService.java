package com.experis.sofia.bankportal.deposit.domain.service;

import com.experis.sofia.bankportal.deposit.application.dto.SimulationResponse;
import com.experis.sofia.bankportal.deposit.domain.exception.DepositSimulationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Cálculo de simulación de depósito a plazo fijo.
 * DEBT-044: TIN/TAE/penaltyRate desde application.yml — nunca hardcodeados.
 * ADR-036: BigDecimal HALF_EVEN
 */
@Service
public class DepositSimulatorService {

    private static final int SCALE = 10;
    private static final RoundingMode RM = RoundingMode.HALF_EVEN;

    @Value("${bank.products.deposit.tin}")
    private BigDecimal tin;

    @Value("${bank.products.deposit.tae}")
    private BigDecimal tae;

    @Value("${bank.products.deposit.min-amount:1000}")
    private BigDecimal minAmount;

    @Value("${bank.products.deposit.max-plazo-meses:60}")
    private int maxPlazo;

    private final IrpfRetentionCalculator irpfCalculator;

    public DepositSimulatorService(IrpfRetentionCalculator irpfCalculator) {
        this.irpfCalculator = irpfCalculator;
    }

    public SimulationResponse calcular(BigDecimal importe, int plazoMeses) {
        if (importe.compareTo(minAmount) < 0)
            throw new DepositSimulationException("Importe mínimo: " + minAmount + " EUR (RN-F021-01)");
        if (plazoMeses < 1 || plazoMeses > maxPlazo)
            throw new DepositSimulationException("Plazo debe ser 1-" + maxPlazo + " meses (RN-F021-02)");

        BigDecimal interesesBrutos = importe
                .multiply(tin)
                .multiply(BigDecimal.valueOf(plazoMeses).divide(BigDecimal.valueOf(12), SCALE, RM))
                .setScale(2, RM);

        BigDecimal retencionIrpf = irpfCalculator.calcular(interesesBrutos);
        BigDecimal interesesNetos = interesesBrutos.subtract(retencionIrpf).setScale(2, RM);
        BigDecimal totalVencimiento = importe.add(interesesNetos).setScale(2, RM);

        return new SimulationResponse(tin, tae, interesesBrutos, retencionIrpf, interesesNetos, totalVencimiento);
    }
}
