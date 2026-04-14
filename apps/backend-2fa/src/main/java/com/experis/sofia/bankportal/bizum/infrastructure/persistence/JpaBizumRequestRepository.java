package com.experis.sofia.bankportal.bizum.infrastructure.persistence;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
public interface JpaBizumRequestRepository extends JpaRepository<BizumRequestEntity, UUID> {
    List<BizumRequestEntity> findByRequesterUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    @Modifying @Query("UPDATE BizumRequestEntity r SET r.status = 'EXPIRED' WHERE r.status = 'PENDING' AND r.expiresAt < :now")
    void expirePendingRequests(Instant now);
}
