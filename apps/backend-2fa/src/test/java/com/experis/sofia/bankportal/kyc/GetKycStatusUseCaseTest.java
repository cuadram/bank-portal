package com.experis.sofia.bankportal.kyc;

import com.experis.sofia.bankportal.kyc.application.GetKycStatusUseCase;
import com.experis.sofia.bankportal.kyc.application.dto.KycStatusResponse;
import com.experis.sofia.bankportal.kyc.domain.KycStatus;
import com.experis.sofia.bankportal.kyc.domain.KycVerification;
import com.experis.sofia.bankportal.kyc.domain.KycVerificationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Tests unitarios — GetKycStatusUseCase.
 * FEAT-013 US-1304 · SOFIA QA · CMMI VER SP 2.1
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("GetKycStatusUseCase — US-1304")
class GetKycStatusUseCaseTest {

    @Mock KycVerificationRepository kycRepo;

    @InjectMocks GetKycStatusUseCase useCase;

    @Test
    @DisplayName("usuario con KYC APPROVED → devuelve estado APPROVED sin rejectionReason")
    void status_approvedKyc_returnsApprovedResponse() {
        UUID userId = UUID.randomUUID();
        KycVerification kyc = new KycVerification();
        kyc.setUserId(userId);
        kyc.setStatus(KycStatus.APPROVED);
        kyc.setSubmittedAt(LocalDateTime.now().minusHours(2));
        when(kycRepo.findByUserId(userId)).thenReturn(Optional.of(kyc));

        KycStatusResponse resp = useCase.execute(userId);

        assertThat(resp.status()).isEqualTo(KycStatus.APPROVED);
        assertThat(resp.rejectionReason()).isNull();
        assertThat(resp.submittedAt()).isNotNull();
    }

    @Test
    @DisplayName("usuario con KYC REJECTED → devuelve motivo de rechazo")
    void status_rejectedKyc_returnsRejectionReason() {
        UUID userId = UUID.randomUUID();
        KycVerification kyc = new KycVerification();
        kyc.setUserId(userId);
        kyc.setStatus(KycStatus.REJECTED);
        kyc.setRejectionReason("Documento ilegible");
        when(kycRepo.findByUserId(userId)).thenReturn(Optional.of(kyc));

        KycStatusResponse resp = useCase.execute(userId);

        assertThat(resp.status()).isEqualTo(KycStatus.REJECTED);
        assertThat(resp.rejectionReason()).isEqualTo("Documento ilegible");
    }

    @Test
    @DisplayName("usuario con KYC SUBMITTED → devuelve estado con estimatedReviewHours")
    void status_submittedKyc_returnsEstimatedReviewHours() {
        UUID userId = UUID.randomUUID();
        KycVerification kyc = new KycVerification();
        kyc.setUserId(userId);
        kyc.setStatus(KycStatus.SUBMITTED);
        kyc.setSubmittedAt(LocalDateTime.now());
        when(kycRepo.findByUserId(userId)).thenReturn(Optional.of(kyc));

        KycStatusResponse resp = useCase.execute(userId);

        assertThat(resp.status()).isEqualTo(KycStatus.SUBMITTED);
        assertThat(resp.estimatedReviewHours()).isPositive();
        assertThat(resp.kycWizardUrl()).isNotBlank();
    }

    @Test
    @DisplayName("usuario sin KYC → devuelve estado NONE con kycWizardUrl")
    void status_noKyc_returnsNoneWithWizardUrl() {
        UUID userId = UUID.randomUUID();
        when(kycRepo.findByUserId(userId)).thenReturn(Optional.empty());

        KycStatusResponse resp = useCase.execute(userId);

        assertThat(resp.status()).isEqualTo(KycStatus.NONE);
        assertThat(resp.kycWizardUrl()).isNotBlank();
        assertThat(resp.userId()).isEqualTo(userId);
    }
}
