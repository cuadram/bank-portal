package com.experis.sofia.bankportal.directdebit;

import com.experis.sofia.bankportal.directdebit.domain.*;
import com.experis.sofia.bankportal.directdebit.dto.request.CreateMandateRequest;
import com.experis.sofia.bankportal.directdebit.exception.*;
import com.experis.sofia.bankportal.directdebit.repository.DebitMandateRepository;
import com.experis.sofia.bankportal.directdebit.service.MandateCreateService;
import com.experis.sofia.bankportal.directdebit.validator.IbanValidator;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for MandateCreateService.
 * FEAT-017 Sprint 19 · US-1703
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MandateCreateService — US-1703")
class MandateCreateServiceTest {

    @Mock DebitMandateRepository mandateRepo;
    @Mock IbanValidator ibanValidator;

    @InjectMocks MandateCreateService service;

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID ACCOUNT_ID = UUID.randomUUID();

    @Test
    @DisplayName("Create mandate successfully — happy path")
    void createMandate_happyPath() {
        // Given
        var req = new CreateMandateRequest();
        req.setCreditorName("Gym Club SA");
        req.setCreditorIban("ES9121000418450200051332");
        req.setAccountId(ACCOUNT_ID);
        req.setOtp("123456");

        doNothing().when(ibanValidator).validate(anyString());
        when(mandateRepo.hasDuplicateActive(any(), anyString())).thenReturn(false);

        var savedMandate = DebitMandate.builder()
            .id(UUID.randomUUID()).userId(USER_ID).accountId(ACCOUNT_ID)
            .creditorName("Gym Club SA").creditorIban("ES9121000418450200051332")
            .mandateRef("BNK-AABBCC-1714567890").status(MandateStatus.ACTIVE)
            .build();
        when(mandateRepo.save(any())).thenReturn(savedMandate);

        // When
        var result = service.createMandate(req, USER_ID);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(MandateStatus.ACTIVE);
        assertThat(result.getCreditorName()).isEqualTo("Gym Club SA");
        verify(ibanValidator).validate("ES9121000418450200051332");
        verify(mandateRepo).save(any(DebitMandate.class));
    }

    @Test
    @DisplayName("Duplicate active mandate throws MandateDuplicateException")
    void createMandate_duplicateThrows() {
        // Given
        var req = new CreateMandateRequest();
        req.setCreditorName("Gym Club SA");
        req.setCreditorIban("ES9121000418450200051332");
        req.setAccountId(ACCOUNT_ID);
        req.setOtp("123456");

        doNothing().when(ibanValidator).validate(anyString());
        when(mandateRepo.hasDuplicateActive(any(), anyString())).thenReturn(true);

        // When / Then
        assertThatThrownBy(() -> service.createMandate(req, USER_ID))
            .isInstanceOf(MandateDuplicateException.class)
            .hasMessageContaining("Active mandate already exists");

        verify(mandateRepo, never()).save(any());
    }

    @Test
    @DisplayName("Invalid IBAN propagates InvalidIbanException")
    void createMandate_invalidIbanThrows() {
        // Given
        var req = new CreateMandateRequest();
        req.setCreditorName("Test SA");
        req.setCreditorIban("ES00000000000000000001");
        req.setAccountId(ACCOUNT_ID);
        req.setOtp("123456");

        doThrow(new InvalidIbanException("IBAN checksum failed"))
            .when(ibanValidator).validate(anyString());

        // When / Then
        assertThatThrownBy(() -> service.createMandate(req, USER_ID))
            .isInstanceOf(InvalidIbanException.class);

        verify(mandateRepo, never()).save(any());
    }
}
