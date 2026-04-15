package com.experis.sofia.bankportal.bizum.infrastructure.persistence;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface JpaBizumPaymentRepository extends JpaRepository<BizumPaymentEntity, UUID> {
    List<BizumPaymentEntity> findBySenderUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}
