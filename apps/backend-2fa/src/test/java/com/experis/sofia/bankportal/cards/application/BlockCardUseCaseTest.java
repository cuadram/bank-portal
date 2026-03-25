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
class BlockCardUseCaseTest {

    @Mock CardRepository cardRepository;
    @Mock OtpValidationUseCase otpValidation;
    @Mock AuditLogService auditLog;
    @Mock WebPushService pushService;

    @InjectMocks BlockCardUseCase useCase;

    private UUID userId;
    private UUID cardId;
    private Card activeCard;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        cardId = UUID.randomUUID();
        activeCard = buildCard(CardStatus.ACTIVE);
    }

    @Test
    void bloquea_tarjeta_activa_con_otp_valido() {
        when(cardRepository.findById(cardId)).thenReturn(Optional.of(activeCard));
        when(cardRepository.save(any())).thenReturn(activeCard);

        useCase.execute(cardId, userId, "123456");

        assertThat(activeCard.getStatus()).isEqualTo(CardStatus.BLOCKED);
        verify(auditLog).log(eq("CARD_BLOCKED"), eq(userId.toString()), anyString());
        verify(pushService).sendAsync(eq(userId), any());
    }

    @Test
    void lanza_excepcion_si_otp_invalido() {
        doThrow(new RuntimeException("INVALID_OTP")).when(otpValidation).validate(any(), any());

        assertThatThrownBy(() -> useCase.execute(cardId, userId, "000000"))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("INVALID_OTP");

        verify(cardRepository, never()).save(any());
    }

    @Test
    void lanza_excepcion_si_tarjeta_no_existe() {
        when(cardRepository.findById(cardId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(cardId, userId, "123456"))
            .isInstanceOf(CardNotFoundException.class);
    }

    @Test
    void lanza_excepcion_idor_si_tarjeta_no_pertenece_al_usuario() {
        Card otherCard = buildCard(CardStatus.ACTIVE);
        otherCard.setUserId(UUID.randomUUID()); // otro usuario
        when(cardRepository.findById(cardId)).thenReturn(Optional.of(otherCard));

        assertThatThrownBy(() -> useCase.execute(cardId, userId, "123456"))
            .isInstanceOf(CardAccessDeniedException.class);
    }

    @Test
    void lanza_excepcion_si_tarjeta_ya_esta_bloqueada() {
        Card blocked = buildCard(CardStatus.BLOCKED);
        when(cardRepository.findById(cardId)).thenReturn(Optional.of(blocked));

        assertThatThrownBy(() -> useCase.execute(cardId, userId, "123456"))
            .isInstanceOf(CardNotBlockableException.class);
    }

    private Card buildCard(CardStatus status) {
        return Card.builder()
            .id(cardId).userId(userId).accountId(UUID.randomUUID())
            .panMasked("XXXX XXXX XXXX 1234")
            .cardType(CardType.DEBIT).status(status)
            .expirationDate(LocalDate.of(2028, 12, 31))
            .dailyLimit(new BigDecimal("1000")).monthlyLimit(new BigDecimal("5000"))
            .dailyLimitMin(new BigDecimal("100")).dailyLimitMax(new BigDecimal("3000"))
            .monthlyLimitMin(new BigDecimal("500")).monthlyLimitMax(new BigDecimal("15000"))
            .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
            .build();
    }
}
