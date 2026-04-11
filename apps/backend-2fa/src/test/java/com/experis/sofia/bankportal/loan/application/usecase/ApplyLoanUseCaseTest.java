package com.experis.sofia.bankportal.loan.application.usecase;

import com.experis.sofia.bankportal.loan.application.dto.ApplyLoanRequest;
import com.experis.sofia.bankportal.loan.application.dto.LoanApplicationResponse;
import com.experis.sofia.bankportal.loan.domain.exception.DuplicateLoanApplicationException;
import com.experis.sofia.bankportal.loan.domain.model.LoanApplication;
import com.experis.sofia.bankportal.loan.domain.model.LoanPurpose;
import com.experis.sofia.bankportal.loan.domain.model.LoanStatus;
import com.experis.sofia.bankportal.loan.domain.repository.LoanApplicationRepositoryPort;
import com.experis.sofia.bankportal.loan.infrastructure.scoring.CoreBankingMockScoringClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * TC-LOAN-007 a TC-LOAN-011 — ApplyLoanUseCase
 */
class ApplyLoanUseCaseTest {

    @Mock LoanApplicationRepositoryPort applicationRepository;
    @Mock CoreBankingMockScoringClient   scoringClient;

    private ApplyLoanUseCase useCase;

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID APP_ID  = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        useCase = new ApplyLoanUseCase(applicationRepository, scoringClient);
    }

    private ApplyLoanRequest validRequest() {
        return new ApplyLoanRequest(
                new BigDecimal("15000"), 36, "CONSUMO", "123456");
    }

    private LoanApplication savedApp(LoanStatus estado) {
        return new LoanApplication(APP_ID, USER_ID,
                new BigDecimal("15000"), 36, LoanPurpose.CONSUMO,
                estado, 700, true, Instant.now(), Instant.now());
    }

    @Test
    @DisplayName("TC-LOAN-007: scoring > 600 → estado PENDING")
    void apply_scoringAlto_devuelvePending() {
        when(applicationRepository.findPendingByUserId(USER_ID)).thenReturn(Optional.empty());
        when(scoringClient.score(USER_ID)).thenReturn(750);
        when(applicationRepository.save(any())).thenReturn(savedApp(LoanStatus.PENDING));

        LoanApplicationResponse response = useCase.execute(USER_ID, validRequest());

        assertThat(response.estado()).isEqualTo("PENDING");
        verify(applicationRepository).save(any());
    }

    @Test
    @DisplayName("TC-LOAN-008: scoring ≤ 600 → estado REJECTED")
    void apply_scoringBajo_devuelveRejected() {
        when(applicationRepository.findPendingByUserId(USER_ID)).thenReturn(Optional.empty());
        when(scoringClient.score(USER_ID)).thenReturn(400);
        when(applicationRepository.save(any())).thenReturn(savedApp(LoanStatus.REJECTED));

        LoanApplicationResponse response = useCase.execute(USER_ID, validRequest());

        assertThat(response.estado()).isEqualTo("REJECTED");
    }

    @Test
    @DisplayName("TC-LOAN-009: duplicado PENDING → DuplicateLoanApplicationException")
    void apply_duplicadoPending_lanzaExcepcion() {
        LoanApplication existing = savedApp(LoanStatus.PENDING);
        when(applicationRepository.findPendingByUserId(USER_ID)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> useCase.execute(USER_ID, validRequest()))
                .isInstanceOf(DuplicateLoanApplicationException.class);

        verify(applicationRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-LOAN-010: scoring mock es determinista para el mismo userId")
    void scoringClient_esDeterminista() {
        CoreBankingMockScoringClient realClient = new CoreBankingMockScoringClient();
        int score1 = realClient.score(USER_ID);
        int score2 = realClient.score(USER_ID);
        assertThat(score1).isEqualTo(score2);
    }

    @Test
    @DisplayName("TC-LOAN-011: score está entre 0 y 999 (ADR-035)")
    void scoringClient_rangoValido() {
        CoreBankingMockScoringClient realClient = new CoreBankingMockScoringClient();
        for (int i = 0; i < 50; i++) {
            int score = realClient.score(UUID.randomUUID());
            assertThat(score).isBetween(0, 999);
        }
    }
}
