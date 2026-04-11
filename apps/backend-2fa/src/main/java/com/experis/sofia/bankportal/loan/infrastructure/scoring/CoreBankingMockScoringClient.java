package com.experis.sofia.bankportal.loan.infrastructure.scoring;

import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * ADR-035: Scoring mock determinista para STG.
 * score = abs(userId.hashCode()) % 1000
 * score > 600 → PENDING | score <= 600 → REJECTED
 * Sin llamada a CoreBanking real — reproducible en tests.
 */
@Component
public class CoreBankingMockScoringClient {

    public int score(UUID userId) {
        return Math.abs(userId.hashCode()) % 1000;
    }
}
