package com.experis.sofia.bankportal.deposit.application.usecase;

import com.experis.sofia.bankportal.deposit.application.dto.DepositDetailDTO;
import com.experis.sofia.bankportal.deposit.domain.exception.DepositAccessDeniedException;
import com.experis.sofia.bankportal.deposit.domain.exception.DepositNotFoundException;
import com.experis.sofia.bankportal.deposit.domain.model.Deposit;
import com.experis.sofia.bankportal.deposit.domain.repository.DepositRepositoryPort;
import com.experis.sofia.bankportal.deposit.domain.service.DepositSimulatorService;
import com.experis.sofia.bankportal.deposit.domain.service.IrpfRetentionCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetDepositDetailUseCase {

    private static final BigDecimal FGD_LIMIT = new BigDecimal("100000");
    private final DepositRepositoryPort depositRepo;
    private final IrpfRetentionCalculator irpfCalculator;

    public DepositDetailDTO execute(UUID depositId, UUID userId) {
        Deposit d = depositRepo.findById(depositId)
            .orElseThrow(() -> new DepositNotFoundException(depositId.toString()));
        if (!d.getUserId().equals(userId))
            throw new DepositAccessDeniedException();

        // Calcular cuadro fiscal — ADR-036 BigDecimal HALF_EVEN
        BigDecimal meses = BigDecimal.valueOf(d.getPlazoMeses());
        BigDecimal interesesBrutos = d.getImporte()
            .multiply(d.getTin())
            .multiply(meses.divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_EVEN))
            .setScale(2, RoundingMode.HALF_EVEN);
        BigDecimal retencion = irpfCalculator.calcular(interesesBrutos);
        BigDecimal interesesNetos = interesesBrutos.subtract(retencion).setScale(2, RoundingMode.HALF_EVEN);
        BigDecimal total = d.getImporte().add(interesesNetos).setScale(2, RoundingMode.HALF_EVEN);

        return new DepositDetailDTO(
            d.getId(), d.getCuentaOrigenId(), d.getImporte(), d.getPlazoMeses(),
            d.getTin(), d.getTae(), interesesBrutos, retencion, interesesNetos, total,
            d.getEstado(), d.getRenovacion(), d.getFechaApertura(), d.getFechaVencimiento(),
            d.getPenalizacion(), d.getImporte().compareTo(FGD_LIMIT) <= 0
        );
    }
}
