package com.experis.sofia.bankportal.deposit.application.usecase;

import com.experis.sofia.bankportal.deposit.application.dto.DepositSummaryDTO;
import com.experis.sofia.bankportal.deposit.domain.model.Deposit;
import com.experis.sofia.bankportal.deposit.domain.repository.DepositRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ListDepositsUseCase {

    private static final BigDecimal FGD_LIMIT = new BigDecimal("100000");
    private final DepositRepositoryPort depositRepo;

    public Page<DepositSummaryDTO> execute(UUID userId, Pageable pageable) {
        return depositRepo.findByUserId(userId, pageable).map(this::toSummary);
    }

    private DepositSummaryDTO toSummary(Deposit d) {
        return new DepositSummaryDTO(
            d.getId(), d.getImporte(), d.getPlazoMeses(),
            d.getTin(), d.getTae(), d.getEstado(), d.getRenovacion(),
            d.getFechaApertura(), d.getFechaVencimiento(),
            d.getImporte().compareTo(FGD_LIMIT) <= 0  // RN-F021-05
        );
    }
}
