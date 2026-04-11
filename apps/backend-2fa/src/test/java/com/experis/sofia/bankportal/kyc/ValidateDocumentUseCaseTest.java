package com.experis.sofia.bankportal.kyc;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.kyc.application.ValidateDocumentUseCase;
import com.experis.sofia.bankportal.kyc.domain.*;
import com.experis.sofia.bankportal.kyc.domain.DocumentStoragePort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — ValidateDocumentUseCase.
 * FEAT-013 US-1303 · SOFIA QA · CMMI VER SP 2.1
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ValidateDocumentUseCase — US-1303")
class ValidateDocumentUseCaseTest {

    @Mock KycVerificationRepository kycRepo;
    @Mock KycDocumentRepository     docRepo;
    @Mock DocumentStoragePort       storageService;
    @Mock AuditLogService           auditLog;

    @InjectMocks ValidateDocumentUseCase useCase;

    private UUID kycId;
    private UUID userId;
    private KycVerification kyc;

    @BeforeEach
    void setUp() {
        kycId  = UUID.randomUUID();
        userId = UUID.randomUUID();
        kyc = new KycVerification();
        kyc.setId(kycId);
        kyc.setUserId(userId);
        kyc.setStatus(KycStatus.SUBMITTED);
    }

    @Test
    @DisplayName("DNI válido con ambas caras → KYC aprobado automáticamente")
    void validate_bothSidesDniValid_approvesKyc() {
        when(kycRepo.findById(kycId)).thenReturn(Optional.of(kyc));
        when(docRepo.findByKycId(kycId)).thenReturn(List.of(
                docFront(DocumentType.DNI, LocalDate.now().plusYears(3)),
                docBack(DocumentType.DNI,  LocalDate.now().plusYears(3))
        ));
        when(storageService.verifyIntegrity(any(), any())).thenReturn(true);
        when(kycRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(docRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        useCase.execute(kycId, userId);

        assertThat(kyc.getStatus()).isEqualTo(KycStatus.APPROVED);
        verify(auditLog).log(eq("KYC_AUTO_APPROVED"), eq(userId), any());
    }

    @Test
    @DisplayName("Pasaporte → solo requiere cara frontal para aprobar")
    void validate_passportFrontOnly_approvesKyc() {
        when(kycRepo.findById(kycId)).thenReturn(Optional.of(kyc));
        when(docRepo.findByKycId(kycId)).thenReturn(List.of(
                docFront(DocumentType.PASSPORT, LocalDate.now().plusYears(5))
        ));
        when(storageService.verifyIntegrity(any(), any())).thenReturn(true);
        when(kycRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(docRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        useCase.execute(kycId, userId);

        assertThat(kyc.getStatus()).isEqualTo(KycStatus.APPROVED);
    }

    @Test
    @DisplayName("documento caducado → KYC permanece SUBMITTED para revisión manual")
    void validate_expiredDocument_remainsSubmitted() {
        KycDocument expired = docFront(DocumentType.DNI, LocalDate.now().minusDays(1));
        when(kycRepo.findById(kycId)).thenReturn(Optional.of(kyc));
        when(docRepo.findByKycId(kycId)).thenReturn(List.of(
                expired,
                docBack(DocumentType.DNI, LocalDate.now().plusYears(1))
        ));
        when(docRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(kycRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        useCase.execute(kycId, userId);

        assertThat(kyc.getStatus()).isEqualTo(KycStatus.SUBMITTED);
        assertThat(expired.getValidationStatus()).isEqualTo("INVALID");
        verify(auditLog).log(eq("KYC_SUBMITTED_FOR_REVIEW"), eq(userId), any());
    }

    @Test
    @DisplayName("hash SHA-256 inválido → KYC derivado a revisión manual")
    void validate_invalidHash_remainsSubmitted() {
        when(kycRepo.findById(kycId)).thenReturn(Optional.of(kyc));
        when(docRepo.findByKycId(kycId)).thenReturn(List.of(
                docFront(DocumentType.DNI, null),
                docBack(DocumentType.DNI,  null)
        ));
        when(storageService.verifyIntegrity(any(), any())).thenReturn(false);
        when(docRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        when(kycRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        useCase.execute(kycId, userId);

        assertThat(kyc.getStatus()).isEqualTo(KycStatus.SUBMITTED);
    }

    @Test
    @DisplayName("lista de documentos vacía → no se valida, estado permanece PENDING")
    void validate_noDocs_skipsValidation() {
        kyc.setStatus(KycStatus.PENDING);
        when(kycRepo.findById(kycId)).thenReturn(Optional.of(kyc));
        when(docRepo.findByKycId(kycId)).thenReturn(List.of());

        useCase.execute(kycId, userId);

        assertThat(kyc.getStatus()).isEqualTo(KycStatus.PENDING);
        verify(kycRepo, never()).save(any());
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private static KycDocument docFront(DocumentType type, LocalDate expires) {
        KycDocument d = new KycDocument();
        d.setId(UUID.randomUUID());
        d.setDocumentType(type);
        d.setSide("FRONT");
        d.setFilePath("f.enc");
        d.setFileHash("aabbcc");
        d.setExpiresAt(expires);
        d.setValidationStatus("PENDING");
        return d;
    }

    private static KycDocument docBack(DocumentType type, LocalDate expires) {
        KycDocument d = docFront(type, expires);
        d.setSide("BACK");
        return d;
    }
}
