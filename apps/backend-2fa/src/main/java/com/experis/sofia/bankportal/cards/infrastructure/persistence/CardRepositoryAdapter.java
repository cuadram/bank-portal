package com.experis.sofia.bankportal.cards.infrastructure.persistence;

import com.experis.sofia.bankportal.cards.domain.Card;
import com.experis.sofia.bankportal.cards.domain.CardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class CardRepositoryAdapter implements CardRepository {

    private final CardJpaRepository jpa;

    @Override
    public List<Card> findByUserId(UUID userId) {
        return jpa.findByUserId(userId);
    }

    @Override
    public Optional<Card> findById(UUID cardId) {
        return jpa.findById(cardId);
    }

    @Override
    public Card save(Card card) {
        return jpa.save(card);
    }
}
