package com.experis.sofia.bankportal.bizum.domain.repository;
import com.experis.sofia.bankportal.bizum.domain.model.BizumPayment;
import java.util.List;
import java.util.UUID;
public interface BizumPaymentRepositoryPort {
    BizumPayment save(BizumPayment payment);
    List<BizumPayment> findBySenderUserId(UUID userId, int page, int size);
}
