package com.experis.sofia.bankportal.bizum.infrastructure.persistence;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
public interface JpaBizumActivationRepository extends JpaRepository<BizumActivationEntity, UUID> {
    Optional<BizumActivationEntity> findByUserId(UUID userId);
    Optional<BizumActivationEntity> findByPhone(String phone);
}
