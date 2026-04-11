package com.experis.sofia.bankportal.cards.domain;

import java.util.UUID;

/** RV-F016-03: utilidad centralizada para enmascarar IDs de tarjeta en logs y auditoría. */
public final class CardMaskingUtil {
    private CardMaskingUtil() {}

    public static String maskId(UUID cardId) {
        String s = cardId.toString();
        return "****-****-****-" + s.substring(s.length() - 4);
    }
}
