package com.experis.sofia.bankportal.cards.application;

import com.experis.sofia.bankportal.cards.domain.*;
import com.experis.sofia.bankportal.audit.AuditLogService;
import com.experis.sofia.bankportal.twofa.application.OtpValidationUseCase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChangePinUseCaseTest {

    @Mock CardRepository cardRepository;
    @Mock OtpValidationUseCase otpValidation;
    @Mock CoreBankingPort coreBankingPort;
    @Mock AuditLogService auditLog;
    @Mock BCryptPasswordEncoder passwordEncoder;

    @InjectMocks ChangePinUseCase useCase;

    private UUID userId;
    private UUID cardId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        cardId = UUID.randomUUID();
    }

    @Test
    void cambia_pin_valido_con_otp_correcto() {
        when(cardRepository.findById(cardId)).thenReturn(Optional.of(buildCard()));
        when(passwordEncoder.encode("7291")).thenReturn("$2a$hash");

        useCase.execute(cardId, userId, "7291", "123456");

        verify(coreBankingPort).changePin(eq(cardId), eq("$2a$hash"));
        verify(auditLog).log(eq("CARD_PIN_CHANGED"), anyString(), anyString());
    }

    @Test
    void lanza_excepcion_si_pin_es_secuencia_trivial_1234() {
        assertThatThrownBy(() -> useCase.execute(cardId, userId, "1234", "123456"))
            .isInstanceOf(InvalidPinException.class)
            .hasMessageContaining("PIN_TRIVIAL");
    }

    @Test
    void lanza_excepcion_si_pin_es_todos_iguales_1111() {
        assertThatThrownBy(() -> useCase.execute(cardId, userId, "1111", "123456"))
            .isInstanceOf(InvalidPinException.class)
            .hasMessageContaining("PIN_TRIVIAL");
    }

    @Test
    void lanza_excepcion_si_pin_no_es_numerico() {
        assertThatThrownBy(() -> useCase.execute(cardId, userId, "12ab", "123456"))
            .isInstanceOf(InvalidPinException.class);
    }

    @Test
    void lanza_excepcion_si_otp_invalido() {
        doThrow(new RuntimeException("INVALID_OTP")).when(otpValidation).validate(any(), any());

        assertThatThrownBy(() -> useCase.execute(cardId, userId, "7291", "000000"))
            .isInstanceOf(RuntimeException.class);

        verify(coreBankingPort, never()).changePin(any(), any());
    }

    @Test
    void lanza_excepcion_idor_si_tarjeta_no_pertenece_al_usuario() {
        Card otherCard = buildCard();
        otherCard.setUserId(UUID.randomUUID());
        when(cardRepository.findById(cardId)).thenReturn(Optional.of(otherCard));

        assertThatThrownBy(() -> useCase.execute(cardId, userId, "7291", "123456"))
            .isInstanceOf(CardAccessDeniedException.class);
    }

    @Test
    void pin_no_aparece_en_el_log_de_auditoria() {
        when(cardRepository.findById(cardId)).thenReturn(Optional.of(buildCard()));
        when(passwordEncoder.encode(any())).thenReturn("$2a$hash");

        useCase.execute(cardId, userId, "7291", "123456");

        verify(auditLog).log(eq("CARD_PIN_CHANGED"), anyString(),
            argThat(msg -> !msg.contains("7291")));
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
