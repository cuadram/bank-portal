package com.experis.sofia.bankportal.directdebit;

import com.experis.sofia.bankportal.directdebit.config.HolidayCalendarService;
import com.experis.sofia.bankportal.directdebit.domain.*;
import com.experis.sofia.bankportal.directdebit.exception.*;
import com.experis.sofia.bankportal.directdebit.repository.*;
import com.experis.sofia.bankportal.directdebit.service.MandateCancelService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for MandateCancelService.
 * FEAT-017 Sprint 19 · US-1704
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MandateCancelService — US-1704")
class MandateCancelServiceTest {

    @Mock DebitMandateRepository mandateRepo;
    @Mock DirectDebitRepository debitRepo;
    @Mock HolidayCalendarService calendar;

    @InjectMocks MandateCancelService service;

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID MANDATE_ID = UUID.randomUUID();

    private DebitMandate activeMandate() {
        return DebitMandate.builder()
            .id(MANDATE_ID).userId(USER_ID)
            .creditorName("Test SA").creditorIban("ES9121000418450200051332")
            .mandateRef("BNK-TEST-123").status(MandateStatus.ACTIVE)
            .build();
    }

    @Test
    @DisplayName("Cancel mandate successfully — no pending debits")
    void cancelMandate_happyPath() {
        // Given
        var mandate = activeMandate();
        when(mandateRepo.findByIdAndUserId(MANDATE_ID, USER_ID)).thenReturn(Optional.of(mandate));
        when(calendar.getBusinessDayCutoff(any(), eq(2))).thenReturn(LocalDate.now().plusDays(2));
        when(debitRepo.hasPendingDebitBeforeCutoff(eq(MANDATE_ID), any())).thenReturn(false);
        when(mandateRepo.save(any())).thenReturn(mandate);

        // When
        assertThatNoException().isThrownBy(() -> service.cancelMandate(MANDATE_ID, USER_ID));

        // Then
        assertThat(mandate.getStatus()).isEqualTo(MandateStatus.CANCELLED);
        verify(mandateRepo).save(mandate);
    }

    @Test
    @DisplayName("PSD2 D-2 rule blocks cancellation when pending debit imminent")
    void cancelMandate_psd2D2BlocksWhenPendingDebitExists() {
        // Given
        var mandate = activeMandate();
        var pendingDebit = DirectDebit.builder()
            .id(UUID.randomUUID()).mandateId(MANDATE_ID)
            .status(DebitStatus.PENDING).dueDate(LocalDate.now().plusDays(1))
            .build();

        when(mandateRepo.findByIdAndUserId(MANDATE_ID, USER_ID)).thenReturn(Optional.of(mandate));
        when(calendar.getBusinessDayCutoff(any(), eq(2))).thenReturn(LocalDate.now().plusDays(2));
        when(debitRepo.hasPendingDebitBeforeCutoff(eq(MANDATE_ID), any())).thenReturn(true);
        when(debitRepo.findByMandateId(eq(MANDATE_ID), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(pendingDebit)));

        // When / Then
        assertThatThrownBy(() -> service.cancelMandate(MANDATE_ID, USER_ID))
            .isInstanceOf(MandateCancellationBlockedPsd2Exception.class);

        verify(mandateRepo, never()).save(any());
    }

    @Test
    @DisplayName("Cancel mandate for non-existent ID throws MandateNotFoundException")
    void cancelMandate_notFound() {
        when(mandateRepo.findByIdAndUserId(MANDATE_ID, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.cancelMandate(MANDATE_ID, USER_ID))
            .isInstanceOf(MandateNotFoundException.class);
    }
}
