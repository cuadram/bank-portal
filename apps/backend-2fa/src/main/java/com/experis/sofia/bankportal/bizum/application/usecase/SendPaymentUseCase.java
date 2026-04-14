package com.experis.sofia.bankportal.bizum.application.usecase;
import com.experis.sofia.bankportal.bizum.application.dto.*;
import com.experis.sofia.bankportal.bizum.domain.exception.*;
import com.experis.sofia.bankportal.bizum.domain.model.*;
import com.experis.sofia.bankportal.bizum.domain.repository.*;
import com.experis.sofia.bankportal.bizum.domain.service.*;
import com.experis.sofia.bankportal.bizum.infrastructure.corebanking.SepaInstantPort;
import com.experis.sofia.bankportal.bizum.infrastructure.redis.BizumRateLimitAdapter;
import com.experis.sofia.bankportal.twofa.application.service.OtpValidationUseCase;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** US-F022-02: Envio de pago Bizum con SCA OTP — PSD2 Art.97 */
@Service
public class SendPaymentUseCase {
    private final BizumActivationRepositoryPort activationRepo;
    private final BizumPaymentRepositoryPort paymentRepo;
    private final BizumLimitService limitService;
    private final BizumRateLimitAdapter rateLimitAdapter;
    private final SepaInstantPort sepaInstant;
    private final OtpValidationUseCase otpValidation;

    public SendPaymentUseCase(
        BizumActivationRepositoryPort activationRepo,
        BizumPaymentRepositoryPort paymentRepo,
        BizumLimitService limitService,
        BizumRateLimitAdapter rateLimitAdapter,
        SepaInstantPort sepaInstant,
        OtpValidationUseCase otpValidation) {
        this.activationRepo = activationRepo; this.paymentRepo = paymentRepo;
        this.limitService = limitService; this.rateLimitAdapter = rateLimitAdapter;
        this.sepaInstant = sepaInstant; this.otpValidation = otpValidation;
    }

    public SendPaymentResponse execute(UUID userId, SendPaymentRequest req) {
        activationRepo.findByUserId(userId).orElseThrow(BizumNotActiveException::new);
        otpValidation.validate(userId, req.otp()); // RN-F022-03 SCA
        BigDecimal amount = req.amount().setScale(2, java.math.RoundingMode.HALF_EVEN);
        limitService.checkPerOperation(amount);
        limitService.checkDaily(rateLimitAdapter.getDailyUsed(userId), amount);
        var result = sepaInstant.executeTransfer(userId, req.recipientPhone(), amount, req.concept());
        BizumPayment payment = new BizumPayment();
        payment.setId(UUID.randomUUID());
        payment.setSenderUserId(userId);
        payment.setRecipientPhone(req.recipientPhone());
        payment.setAmount(amount);
        payment.setConcept(req.concept());
        payment.setStatus(BizumStatus.COMPLETED);
        payment.setSepaRef(result.reference());
        payment.setCreatedAt(Instant.now());
        payment.setCompletedAt(Instant.now());
        paymentRepo.save(payment);
        rateLimitAdapter.increment(userId, amount);
        return new SendPaymentResponse(result.reference(), "COMPLETED", payment.getCompletedAt(), amount);
    }
}
