package com.experis.sofia.bankportal.kyc;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.kyc.application.ReviewKycUseCase;
import com.experis.sofia.bankportal.kyc.application.dto.KycReviewRequest;
import com.experis.sofia.bankportal.kyc.domain.KycStatus;
import com.experis.sofia.bankportal.kyc.domain.KycVerification;
import com.experis.sofia.bankportal.kyc.domain.KycVerificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — ReviewKycUseCase.
 * FEAT-013 US-1307 · SOFIA QA · CMMI VER SP 2.1
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ReviewKycUseCase — US-1307")
class ReviewKycUseCaseTest {

    @Mock KycVerificationRepository kycRepo;
    @Mock AuditLogService           auditLog;

    @InjectMocks ReviewKycUseCase useCase;

    private UUID kycId;
    private UUID reviewerId;
    private KycVerification submitted;

    @BeforeEach
    void setUp() {
        kycId      = UUID.randomUUID();
        reviewerId = UUID.randomUUID();
        submitted  = new KycVerification();
        submitted.setId(kycId);
        submitted.setUserId(UUID.randomUUID());
        submitted.setStatus(KycStatus.SUBMITTED);
    }

    @Test
    @DisplayName("operador aprueba KYC SUBMITTED → estado APPROVED + reviewer registrado")
    void review_approve_setsApprovedStatus() {
        when(kycRepo.findById(kycId)).thenReturn(Optional.of(submitted));
        when(kycRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        KycVerification result = useCase.execute(kycId, reviewerId, new KycReviewRequest("APPROVE", null));

        assertThat(result.getStatus()).isEqualTo(KycStatus.APPROVED);
        assertThat(result.getReviewerId()).isEqualTo(reviewerId);
        assertThat(result.getReviewedAt()).isNotNull();
        verify(auditLog).log(eq("KYC_MANUAL_APPROVED"), any(), any());
    }

    @Test
    @DisplayName("operador rechaza con motivo → estado REJECTED + reason persistido")
    void review_reject_withReason_setsRejectedStatus() {
        when(kycRepo.findById(kycId)).thenReturn(Optional.of(submitted));
        when(kycRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        KycVerification result = useCase.execute(kycId, reviewerId,
                new KycReviewRequest("REJECT", "Documento ilegible"));

        assertThat(result.getStatus()).isEqualTo(KycStatus.REJECTED);
        assertThat(result.getRejectionReason()).isEqualTo("Documento ilegible");
        verify(auditLog).log(eq("KYC_MANUAL_REJECTED"), any(), any());
    }

    @Test
    @DisplayName("rechazo sin motivo → excepción REASON_REQUIRED_FOR_REJECTION")
    void review_reject_withoutReason_throwsException() {
        when(kycRepo.findById(kycId)).thenReturn(Optional.of(submitted));

        assertThatThrownBy(() -> useCase.execute(kycId, reviewerId,
                new KycReviewRequest("REJECT", null)))
                .isInstanceOf(ReviewKycUseCase.ReviewKycException.class)
                .hasMessage("REASON_REQUIRED_FOR_REJECTION");

        verify(kycRepo, never()).save(any());
    }

    @Test
    @DisplayName("KYC no en estado SUBMITTED → excepción INVALID_KYC_TRANSITION")
    void review_kycNotSubmitted_throwsTransitionException() {
        submitted.setStatus(KycStatus.APPROVED);
        when(kycRepo.findById(kycId)).thenReturn(Optional.of(submitted));

        assertThatThrownBy(() -> useCase.execute(kycId, reviewerId,
                new KycReviewRequest("REJECT", "motivo")))
                .isInstanceOf(ReviewKycUseCase.ReviewKycException.class)
                .hasMessage("INVALID_KYC_TRANSITION");
    }

    @Test
    @DisplayName("kycId inexistente → excepción KYC_NOT_FOUND")
    void review_kycNotFound_throwsException() {
        when(kycRepo.findById(kycId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(kycId, reviewerId,
                new KycReviewRequest("APPROVE", null)))
                .isInstanceOf(ReviewKycUseCase.ReviewKycException.class)
                .hasMessage("KYC_NOT_FOUND");
    }
}
