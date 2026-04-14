package com.experis.sofia.bankportal.bizum.domain.repository;
import com.experis.sofia.bankportal.bizum.domain.model.BizumActivation;
import java.util.Optional;
import java.util.UUID;
public interface BizumActivationRepositoryPort {
    Optional<BizumActivation> findByUserId(UUID userId);
    Optional<BizumActivation> findByPhone(String phone);
    BizumActivation save(BizumActivation activation);
}
