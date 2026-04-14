package com.experis.sofia.bankportal.bizum.application.usecase;
import com.experis.sofia.bankportal.bizum.application.dto.*;
import com.experis.sofia.bankportal.bizum.domain.exception.*;
import com.experis.sofia.bankportal.bizum.domain.model.*;
import com.experis.sofia.bankportal.bizum.domain.repository.*;
import com.experis.sofia.bankportal.bizum.domain.service.*;
import com.experis.sofia.bankportal.bizum.infrastructure.corebanking.SepaInstantPort;
import com.experis.sofia.bankportal.bizum.infrastructure.redis.BizumRateLimitAdapter;
import com.experis.sofia.bankportal.twofa.application.OtpValidationUseCase;
import org.springframework.stereotype.Service;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

/** US-F022-04: Aceptar solicitud con SCA OTP — RN-F022-08 */
@Service
public class AcceptRequestUseCase {
    private final BizumRequestRepositoryPort requestRepo;
    private final BizumPaymentRepositoryPort paymentRepo;
    private final BizumActivationRepositoryPort activationRepo;
    private final BizumLimitService limitService;
    private final BizumRateLimitAdapter rateLimitAdapter;
    private final SepaInstantPort sepaInstant;
    private final OtpValidationUseCase otpValidation;

    public AcceptRequestUseCase(BizumRequestRepositoryPort rr, BizumPaymentRepositoryPort pr,
        BizumActivationRepositoryPort ar, BizumLimitService ls, BizumRateLimitAdapter rl,
        SepaInstantPort si, OtpValidationUseCase ov) {
        this.requestRepo=rr; this.paymentRepo=pr; this.activationRepo=ar;
        this.limitService=ls; this.rateLimitAdapter=rl; this.sepaInstant=si; this.otpValidation=ov;
    }

    public void execute(UUID userId, UUID requestId, String otp) {
        var req = requestRepo.findById(requestId).orElseThrow(BizumRequestNotFoundException::new);
        if (req.getStatus() != BizumStatus.PENDING || Instant.now().isAfter(req.getExpiresAt()))
            throw new BizumRequestExpiredException();
        otpValidation.validate(userId, otp);
        var amount = req.getAmount().setScale(2, RoundingMode.HALF_EVEN);
        limitService.checkPerOperation(amount);
        limitService.checkDaily(rateLimitAdapter.getDailyUsed(userId), amount);
        var result = sepaInstant.executeTransfer(userId, req.getRecipientPhone(), amount, req.getConcept());
        BizumPayment payment = new BizumPayment();
        payment.setId(UUID.randomUUID());
        payment.setSenderUserId(userId);
        payment.setRecipientPhone(req.getRecipientPhone());
        payment.setAmount(amount);
        payment.setConcept(req.getConcept());
        payment.setStatus(BizumStatus.COMPLETED);
        payment.setSepaRef(result.reference());
        payment.setCreatedAt(Instant.now());
        payment.setCompletedAt(Instant.now());
        paymentRepo.save(payment);
        rateLimitAdapter.increment(userId, amount);
        req.setStatus(BizumStatus.ACCEPTED); req.setResolvedAt(Instant.now()); req.setPaymentId(payment.getId());
        requestRepo.save(req);
    }
}
