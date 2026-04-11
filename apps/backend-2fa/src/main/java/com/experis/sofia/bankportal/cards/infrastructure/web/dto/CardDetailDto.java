package com.experis.sofia.bankportal.cards.infrastructure.web.dto;

import com.experis.sofia.bankportal.cards.domain.Card;
import com.experis.sofia.bankportal.cards.domain.CardStatus;
import com.experis.sofia.bankportal.cards.domain.CardType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * RV-F016-01: DTO de detalle de tarjeta — incluye rangos de límite visibles al usuario.
 * No expone campos internos de auditoría ni datos JPA.
 */
public record CardDetailDto(
    UUID id,
    String panMasked,
    CardType cardType,
    CardStatus status,
    LocalDate expirationDate,
    UUID accountId,
    BigDecimal dailyLimit,
    BigDecimal monthlyLimit,
    BigDecimal dailyLimitMin,
    BigDecimal dailyLimitMax,
    BigDecimal monthlyLimitMin,
    BigDecimal monthlyLimitMax
) {
    public static CardDetailDto from(Card card) {
        return new CardDetailDto(
            card.getId(),
            card.getPanMasked(),
            card.getCardType(),
            card.getStatus(),
            card.getExpirationDate(),
            card.getAccountId(),
            card.getDailyLimit(),
            card.getMonthlyLimit(),
            card.getDailyLimitMin(),
            card.getDailyLimitMax(),
            card.getMonthlyLimitMin(),
            card.getMonthlyLimitMax()
        );
    }
}
