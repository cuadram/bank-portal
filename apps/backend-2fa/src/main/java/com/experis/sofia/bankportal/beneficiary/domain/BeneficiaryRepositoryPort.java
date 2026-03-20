package com.experis.sofia.bankportal.beneficiary.domain;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BeneficiaryRepositoryPort {
    Beneficiary              save(Beneficiary beneficiary);
    Optional<Beneficiary>    findByIdAndUserId(UUID id, UUID userId);
    List<Beneficiary>        findActiveByUserId(UUID userId);
    boolean                  existsActiveByUserIdAndIban(UUID userId, String iban);
}
