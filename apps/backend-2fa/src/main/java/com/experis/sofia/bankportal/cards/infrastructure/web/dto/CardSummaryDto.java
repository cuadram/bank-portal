package com.experis.sofia.bankportal.cards.infrastructure.web.dto;

import com.experis.sofia.bankportal.cards.domain.Card;
import com.experis.sofia.bankportal.cards.domain.CardStatus;
import com.experis.sofia.bankportal.cards.domain.CardType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * RV-F016-01: DTO para la lista de tarjetas — expone solo campos necesarios.
 * Nunca expone dailyLimitMin/Max, createdAt ni campos internos JPA.
 */
public record CardSummaryDto(
    UUID id,
    String panMasked,
    CardType cardType,
    CardStatus status,
    LocalDate expirationDate,
    UUID accountId,
    BigDecimal dailyLimit,
    BigDecimal monthlyLimit
) {
    public static CardSummaryDto from(Card card) {
        return new CardSummaryDto(
            card.getId(),
            card.getPanMasked(),
            card.getCardType(),
            card.getStatus(),
            card.getExpirationDate(),
            card.getAccountId(),
            card.getDailyLimit(),
            card.getMonthlyLimit()
        );
    }
}
