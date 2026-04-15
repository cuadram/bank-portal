package com.experis.sofia.bankportal.bizum.application.usecase;
import com.experis.sofia.bankportal.bizum.domain.exception.*;
import com.experis.sofia.bankportal.bizum.domain.model.*;
import com.experis.sofia.bankportal.bizum.domain.repository.BizumRequestRepositoryPort;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.UUID;

/** US-F022-04: Rechazar solicitud — sin OTP, sin cargo */
@Service
public class RejectRequestUseCase {
    private final BizumRequestRepositoryPort requestRepo;
    public RejectRequestUseCase(BizumRequestRepositoryPort r) { this.requestRepo = r; }

    public void execute(UUID userId, UUID requestId) {
        var req = requestRepo.findById(requestId).orElseThrow(BizumRequestNotFoundException::new);
        if (req.getStatus() != BizumStatus.PENDING) throw new BizumRequestExpiredException();
        req.setStatus(BizumStatus.REJECTED);
        req.setResolvedAt(Instant.now());
        requestRepo.save(req);
    }
}
