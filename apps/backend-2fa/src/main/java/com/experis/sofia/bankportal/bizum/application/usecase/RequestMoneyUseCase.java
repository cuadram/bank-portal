package com.experis.sofia.bankportal.bizum.application.usecase;
import com.experis.sofia.bankportal.bizum.application.dto.*;
import com.experis.sofia.bankportal.bizum.domain.exception.BizumNotActiveException;
import com.experis.sofia.bankportal.bizum.domain.model.*;
import com.experis.sofia.bankportal.bizum.domain.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

/** US-F022-03: Solicitud de cobro Bizum — TTL 24h RN-F022-07 */
@Service
public class RequestMoneyUseCase {
    private final BizumActivationRepositoryPort activationRepo;
    private final BizumRequestRepositoryPort requestRepo;
    @Value("${bank.bizum.request.ttl-hours:24}")
    private int ttlHours;

    public RequestMoneyUseCase(BizumActivationRepositoryPort a, BizumRequestRepositoryPort r) {
        this.activationRepo = a; this.requestRepo = r;
    }

    public RequestMoneyResponse execute(UUID userId, RequestMoneyRequest req) {
        activationRepo.findByUserId(userId).orElseThrow(BizumNotActiveException::new);
        BizumRequest request = new BizumRequest();
        request.setId(UUID.randomUUID());
        request.setRequesterUserId(userId);
        request.setRecipientPhone(req.recipientPhone());
        request.setAmount(req.amount().setScale(2, RoundingMode.HALF_EVEN));
        request.setConcept(req.concept());
        request.setStatus(BizumStatus.PENDING);
        request.setCreatedAt(Instant.now());
        request.setExpiresAt(Instant.now().plusSeconds(ttlHours * 3600L)); // RN-F022-07
        requestRepo.save(request);
        return new RequestMoneyResponse(request.getId(), "PENDING", request.getExpiresAt());
    }
}
