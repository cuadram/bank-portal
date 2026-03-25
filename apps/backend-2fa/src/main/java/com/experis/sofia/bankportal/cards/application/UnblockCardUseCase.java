package com.experis.sofia.bankportal.cards.application;

import com.experis.sofia.bankportal.cards.domain.*;
import com.experis.sofia.bankportal.audit.AuditLogService;
import com.experis.sofia.bankportal.notification.application.WebPushService;
import com.experis.sofia.bankportal.notification.domain.NotificationEventType;
import com.experis.sofia.bankportal.twofa.application.OtpValidationUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

/** RV-F016-03: usa CardMaskingUtil */
@Service
@RequiredArgsConstructor
public class UnblockCardUseCase {

    private final CardRepository cardRepository;
    private final OtpValidationUseCase otpValidation;
    private final AuditLogService auditLog;
    private final WebPushService pushService;

    @Transactional
    public void execute(UUID cardId, UUID userId, String otpCode) {
        otpValidation.validate(userId, otpCode);

        Card card = cardRepository.findById(cardId)
            .orElseThrow(() -> new CardNotFoundException("Card not found: " + cardId));

        if (!card.belongsTo(userId))
            throw new CardAccessDeniedException("IDOR: card " + cardId + " does not belong to user " + userId);

        card.unblock();
        cardRepository.save(card);

        auditLog.log("CARD_UNBLOCKED", userId.toString(), CardMaskingUtil.maskId(cardId));
        pushService.sendAsync(userId, NotificationEventType.CARD_UNBLOCKED);
    }
}
