package com.experis.sofia.bankportal.cards.domain;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CardRepository {
    List<Card> findByUserId(UUID userId);
    Optional<Card> findById(UUID cardId);
    Card save(Card card);
}
