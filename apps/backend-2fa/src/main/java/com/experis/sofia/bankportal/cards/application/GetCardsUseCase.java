package com.experis.sofia.bankportal.cards.application;

import com.experis.sofia.bankportal.cards.domain.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GetCardsUseCase {

    private final CardRepository cardRepository;

    public List<Card> execute(UUID userId) {
        return cardRepository.findByUserId(userId);
    }
}
