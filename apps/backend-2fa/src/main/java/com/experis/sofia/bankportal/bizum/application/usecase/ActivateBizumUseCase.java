package com.experis.sofia.bankportal.bizum.application.usecase;
import com.experis.sofia.bankportal.bizum.application.dto.*;
import com.experis.sofia.bankportal.bizum.domain.exception.PhoneAlreadyRegisteredException;
import com.experis.sofia.bankportal.bizum.domain.model.*;
import com.experis.sofia.bankportal.bizum.domain.repository.BizumActivationRepositoryPort;
import com.experis.sofia.bankportal.bizum.domain.service.PhoneValidationService;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.UUID;

@Service
public class ActivateBizumUseCase {
    private final BizumActivationRepositoryPort repo;
    private final PhoneValidationService phoneService;

    public ActivateBizumUseCase(BizumActivationRepositoryPort repo, PhoneValidationService phoneService) {
        this.repo = repo; this.phoneService = phoneService;
    }

    public ActivateBizumResponse execute(UUID userId, ActivateBizumRequest req) {
        if (repo.findByPhone(req.phone()).isPresent())
            throw new PhoneAlreadyRegisteredException();
        BizumActivation activation = new BizumActivation();
        activation.setId(UUID.randomUUID());
        activation.setUserId(userId);
        activation.setAccountId(req.accountId());
        activation.setPhone(req.phone());
        activation.setStatus(BizumStatus.ACTIVE);
        activation.setGdprConsentAt(Instant.now()); // RN-F022-02
        activation.setActivatedAt(Instant.now());
        repo.save(activation);
        return new ActivateBizumResponse(PhoneValidationService.mask(req.phone()), activation.getActivatedAt(), "ACTIVE");
    }
}
