package com.experis.sofia.bankportal.deposit.application.usecase;

import com.experis.sofia.bankportal.deposit.application.dto.CancellationResult;
import com.experis.sofia.bankportal.deposit.domain.exception.DepositAccessDeniedException;
import com.experis.sofia.bankportal.deposit.domain.exception.DepositNotFoundException;
import com.experis.sofia.bankportal.deposit.domain.exception.DepositNotCancellableException;
import com.experis.sofia.bankportal.deposit.domain.model.Deposit;
import com.experis.sofia.bankportal.deposit.domain.model.DepositStatus;
import com.experis.sofia.bankportal.deposit.domain.repository.DepositRepositoryPort;
import com.experis.sofia.bankportal.deposit.domain.service.IrpfRetentionCalculator;
import com.experis.sofia.bankportal.deposit.domain.service.PenaltyCalculator;
import com.experis.sofia.bankportal.deposit.infrastructure.corebanking.CoreBankingMockDepositClient;
import com.experis.sofia.bankportal.twofa.application.OtpValidationUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CancelDepositUseCase {

    private final OtpValidationUseCase otpValidation;
    private final DepositRepositoryPort depositRepo;
    private final IrpfRetentionCalculator irpfCalculator;
    private final PenaltyCalculator penaltyCalculator;
    private final CoreBankingMockDepositClient coreBanking;

    public CancellationResult execute(UUID depositId, UUID userId, String otp) {
        otpValidation.validate(userId, otp);

        Deposit d = depositRepo.findById(depositId)
            .orElseThrow(() -> new DepositNotFoundException(depositId.toString()));
        if (!d.getUserId().equals(userId)) throw new DepositAccessDeniedException();
        if (d.getEstado() != DepositStatus.ACTIVE)
            throw new DepositNotCancellableException("estado: " + d.getEstado());

        // Intereses devengados proporcionales al tiempo transcurrido
        long diasTranscurridos = ChronoUnit.DAYS.between(d.getFechaApertura(), LocalDate.now());
        long diasTotales = ChronoUnit.DAYS.between(d.getFechaApertura(), d.getFechaVencimiento());
        BigDecimal fraccion = diasTotales == 0 ? BigDecimal.ZERO
            : BigDecimal.valueOf(diasTranscurridos).divide(BigDecimal.valueOf(diasTotales), 10, RoundingMode.HALF_EVEN);

        BigDecimal interesesBrutosTotales = d.getImporte()
            .multiply(d.getTin())
            .multiply(BigDecimal.valueOf(d.getPlazoMeses()).divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_EVEN))
            .setScale(2, RoundingMode.HALF_EVEN);
        BigDecimal interesesDevengados = interesesBrutosTotales.multiply(fraccion).setScale(2, RoundingMode.HALF_EVEN);
        BigDecimal penalizacion = penaltyCalculator.calcular(interesesDevengados);
        BigDecimal importeAbonado = d.getImporte().add(interesesDevengados).subtract(penalizacion).setScale(2, RoundingMode.HALF_EVEN);

        d.setEstado(DepositStatus.CANCELLED);
        d.setPenalizacion(penalizacion);
        depositRepo.update(d);

        coreBanking.registrarCancelacion(depositId, importeAbonado);

        return new CancellationResult(importeAbonado, penalizacion, interesesDevengados);
    }
}
