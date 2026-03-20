package com.experis.sofia.bankportal.transfer.domain;

import java.util.List;
import java.util.UUID;

public interface TransferRepositoryPort {
    Transfer save(Transfer transfer);
    List<Transfer> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
