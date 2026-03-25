package com.experis.sofia.bankportal.cards.application;

import com.experis.sofia.bankportal.cards.domain.*;
import com.experis.sofia.bankportal.audit.AuditLogService;
import com.experis.sofia.bankportal.twofa.application.OtpValidationUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * RV-F016-03: usa CardMaskingUtil (DRY)
 * RV-F016-04: inyecta PasswordEncoder (interfaz, no BCrypt concreto)
 */
@Service
@RequiredArgsConstructor
public class ChangePinUseCase {

    private static final Pattern TRIVIAL_PIN =
        Pattern.compile("^(\\d)\\1{3}$|^1234$|^4321$|^0000$|^9999$|^1111$|^2222$|^3333$|^4444$|^5555$|^6666$|^7777$|^8888$");

    private final CardRepository cardRepository;
    private final OtpValidationUseCase otpValidation;
    private final CoreBankingPort coreBankingPort;
    private final AuditLogService auditLog;
    private final PasswordEncoder passwordEncoder; // RV-F016-04: interfaz

    @Transactional
    public void execute(UUID cardId, UUID userId, String newPin, String otpCode) {
        if (!newPin.matches("^\\d{4}$"))
            throw new InvalidPinException("PIN must be 4 numeric digits");

        if (TRIVIAL_PIN.matcher(newPin).matches())
            throw new InvalidPinException("PIN_TRIVIAL: sequence not allowed");

        otpValidation.validate(userId, otpCode);

        Card card = cardRepository.findById(cardId)
            .orElseThrow(() -> new CardNotFoundException("Card not found: " + cardId));

        if (!card.belongsTo(userId))
            throw new CardAccessDeniedException("IDOR: card " + cardId + " does not belong to user " + userId);

        String pinHash = passwordEncoder.encode(newPin);
        coreBankingPort.changePin(cardId, pinHash);

        // RV-F016-03: maskId centralizado
        auditLog.log("CARD_PIN_CHANGED", userId.toString(), CardMaskingUtil.maskId(cardId));
    }
}
