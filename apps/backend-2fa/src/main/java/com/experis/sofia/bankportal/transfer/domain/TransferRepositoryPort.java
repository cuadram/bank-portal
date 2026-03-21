package com.experis.sofia.bankportal.transfer.domain;

import java.util.List;
import java.util.UUID;

public interface TransferRepositoryPort {
    Transfer save(Transfer transfer);
    List<Transfer> findByUserIdOrderByCreatedAtDesc(UUID userId);
    /** RV-003: query específica para regla de primera transferencia — evita carga masiva. */
    boolean existsCompletedTransferToBeneficiary(UUID userId, UUID beneficiaryId);
}
