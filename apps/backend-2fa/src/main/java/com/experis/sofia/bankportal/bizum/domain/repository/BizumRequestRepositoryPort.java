package com.experis.sofia.bankportal.bizum.domain.repository;
import com.experis.sofia.bankportal.bizum.domain.model.BizumRequest;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
public interface BizumRequestRepositoryPort {
    BizumRequest save(BizumRequest request);
    Optional<BizumRequest> findById(UUID id);
    List<BizumRequest> findByRequesterUserId(UUID userId, int page, int size);
    void expireOldRequests();
}
