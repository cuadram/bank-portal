package com.experis.sofia.bankportal.cards.application;

import com.experis.sofia.bankportal.cards.domain.*;
import com.experis.sofia.bankportal.audit.AuditLogService;
import com.experis.sofia.bankportal.notification.application.WebPushService;
import com.experis.sofia.bankportal.twofa.application.OtpValidationUseCase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UpdateCardLimitsUseCaseTest {

    @Mock CardRepository cardRepository;
    @Mock OtpValidationUseCase otpValidation;
    @Mock AuditLogService auditLog;
    @Mock WebPushService pushService;

    @InjectMocks UpdateCardLimitsUseCase useCase;

    private UUID userId;
    private UUID cardId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        cardId = UUID.randomUUID();
    }

    @Test
    void actualiza_limites_dentro_del_rango_correctamente() {
        Card card = buildCard();
        when(cardRepository.findById(cardId)).thenReturn(Optional.of(card));
        when(cardRepository.save(any())).thenReturn(card);

        useCase.execute(cardId, userId, new BigDecimal("800"), new BigDecimal("3000"), "123456");

        assertThat(card.getDailyLimit()).isEqualByComparingTo("800");
        assertThat(card.getMonthlyLimit()).isEqualByComparingTo("3000");
        verify(auditLog).log(eq("CARD_LIMITS_UPDATED"), anyString(), anyString());
        verify(pushService).sendAsync(eq(userId), any());
    }

    @Test
    void lanza_excepcion_si_daily_limit_supera_el_maximo() {
        Card card = buildCard();
        when(cardRepository.findById(cardId)).thenReturn(Optional.of(card));

        assertThatThrownBy(() ->
            useCase.execute(cardId, userId, new BigDecimal("9999"), new BigDecimal("10000"), "123456"))
            .isInstanceOf(InvalidCardLimitException.class)
            .hasMessageContaining("daily_limit");
    }

    @Test
    void lanza_excepcion_si_monthly_es_menor_que_daily() {
        Card card = buildCard();
        when(cardRepository.findById(cardId)).thenReturn(Optional.of(card));

        assertThatThrownBy(() ->
            useCase.execute(cardId, userId, new BigDecimal("2000"), new BigDecimal("500"), "123456"))
            .isInstanceOf(InvalidCardLimitException.class)
            .hasMessageContaining("MONTHLY_LIMIT_BELOW_DAILY");
    }

    @Test
    void lanza_excepcion_idor() {
        Card card = buildCard();
        card.setUserId(UUID.randomUUID());
        when(cardRepository.findById(cardId)).thenReturn(Optional.of(card));

        assertThatThrownBy(() ->
            useCase.execute(cardId, userId, new BigDecimal("800"), new BigDecimal("3000"), "123456"))
            .isInstanceOf(CardAccessDeniedException.class);
    }

    @Test
    void lanza_excepcion_si_daily_limit_por_debajo_del_minimo() {
        Card card = buildCard();
        when(cardRepository.findById(cardId)).thenReturn(Optional.of(card));

        assertThatThrownBy(() ->
            useCase.execute(cardId, userId, new BigDecimal("10"), new BigDecimal("500"), "123456"))
            .isInstanceOf(InvalidCardLimitException.class);
    }

    private Card buildCard() {
        return Card.builder()
            .id(cardId).userId(userId).accountId(UUID.randomUUID())
            .panMasked("XXXX XXXX XXXX 1234")
            .cardType(CardType.DEBIT).status(CardStatus.ACTIVE)
            .expirationDate(LocalDate.of(2028, 12, 31))
            .dailyLimit(new BigDecimal("1000")).monthlyLimit(new BigDecimal("5000"))
            .dailyLimitMin(new BigDecimal("100")).dailyLimitMax(new BigDecimal("3000"))
            .monthlyLimitMin(new BigDecimal("500")).monthlyLimitMax(new BigDecimal("15000"))
            .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
            .build();
    }
}
