package com.experis.sofia.bankportal.cards.infrastructure.persistence;

import com.experis.sofia.bankportal.cards.domain.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CardJpaRepository extends JpaRepository<Card, UUID> {
    List<Card> findByUserId(UUID userId);
}
