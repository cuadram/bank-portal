package com.experis.sofia.bankportal.kyc;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.kyc.application.UploadDocumentUseCase;
import com.experis.sofia.bankportal.kyc.application.ValidateDocumentUseCase;
import com.experis.sofia.bankportal.kyc.application.dto.DocumentUploadResponse;
import com.experis.sofia.bankportal.kyc.domain.*;
import com.experis.sofia.bankportal.kyc.infrastructure.DocumentStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — UploadDocumentUseCase.
 * FEAT-013 US-1302 · SOFIA QA · CMMI VER SP 2.1
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UploadDocumentUseCase — US-1302")
class UploadDocumentUseCaseTest {

    @Mock KycVerificationRepository kycRepo;
    @Mock KycDocumentRepository     docRepo;
    @Mock DocumentStorageService    storageService;
    @Mock ValidateDocumentUseCase   validateUseCase;
    @Mock AuditLogService           auditLog;

    @InjectMocks UploadDocumentUseCase useCase;

    private UUID userId;
    private KycVerification pendingKyc;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        pendingKyc = new KycVerification();
        pendingKyc.setId(UUID.randomUUID());
        pendingKyc.setUserId(userId);
        pendingKyc.setStatus(KycStatus.PENDING);
    }

    @Test
    @DisplayName("subida exitosa DNI frontal → documento persistido, validación disparada")
    void upload_dniJpeg_createsDocumentAndTriggersValidation() {
        MockMultipartFile file = jpeg800kb();
        when(kycRepo.findByUserId(userId)).thenReturn(Optional.of(pendingKyc));
        when(docRepo.existsByKycIdAndDocumentTypeAndSide(any(), any(), any())).thenReturn(false);
        when(storageService.store(file))
                .thenReturn(new DocumentStorageService.StorageResult("f.enc", "abc123"));
        when(docRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        KycVerification submitted = new KycVerification();
        submitted.setStatus(KycStatus.SUBMITTED);
        when(kycRepo.findById(pendingKyc.getId())).thenReturn(Optional.of(submitted));

        DocumentUploadResponse resp = useCase.execute(userId, DocumentType.DNI, "FRONT", file);

        assertThat(resp.kycStatus()).isEqualTo(KycStatus.SUBMITTED);
        verify(storageService).store(file);
        verify(validateUseCase).execute(any(), eq(userId));
        verify(auditLog).log(eq("KYC_DOCUMENT_UPLOADED"), eq(userId), any());
    }

    @Test
    @DisplayName("fichero > 10MB → excepción FILE_TOO_LARGE")
    void upload_fileTooLarge_throwsException() {
        byte[] big = new byte[11 * 1024 * 1024];
        MockMultipartFile file = new MockMultipartFile("file", "big.jpg", "image/jpeg", big);

        assertThatThrownBy(() -> useCase.execute(userId, DocumentType.DNI, "FRONT", file))
                .isInstanceOf(UploadDocumentUseCase.KycException.class)
                .hasMessage("FILE_TOO_LARGE");

        verifyNoInteractions(storageService, validateUseCase);
    }

    @Test
    @DisplayName("MIME no permitido → excepción UNSUPPORTED_FORMAT")
    void upload_unsupportedMime_throwsException() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "virus.exe", "application/octet-stream", new byte[1024]);

        assertThatThrownBy(() -> useCase.execute(userId, DocumentType.DNI, "FRONT", file))
                .isInstanceOf(UploadDocumentUseCase.KycException.class)
                .hasMessage("UNSUPPORTED_FORMAT");
    }

    @Test
    @DisplayName("KYC ya aprobado → excepción KYC_ALREADY_APPROVED")
    void upload_kycAlreadyApproved_throwsException() {
        pendingKyc.setStatus(KycStatus.APPROVED);
        when(kycRepo.findByUserId(userId)).thenReturn(Optional.of(pendingKyc));

        assertThatThrownBy(() -> useCase.execute(userId, DocumentType.DNI, "FRONT", jpeg800kb()))
                .isInstanceOf(UploadDocumentUseCase.KycException.class)
                .hasMessage("KYC_ALREADY_APPROVED");

        verifyNoInteractions(storageService);
    }

    @Test
    @DisplayName("documento duplicado (mismo tipo+cara) → excepción DOCUMENT_ALREADY_UPLOADED")
    void upload_duplicateDocument_throwsException() {
        when(kycRepo.findByUserId(userId)).thenReturn(Optional.of(pendingKyc));
        when(docRepo.existsByKycIdAndDocumentTypeAndSide(
                pendingKyc.getId(), DocumentType.DNI, "FRONT")).thenReturn(true);

        assertThatThrownBy(() -> useCase.execute(userId, DocumentType.DNI, "FRONT", jpeg800kb()))
                .isInstanceOf(UploadDocumentUseCase.KycException.class)
                .hasMessage("DOCUMENT_ALREADY_UPLOADED");
    }

    @Test
    @DisplayName("usuario sin KYC previo → crea KycVerification automáticamente")
    void upload_noExistingKyc_createsVerificationOnTheFly() {
        when(kycRepo.findByUserId(userId)).thenReturn(Optional.empty());
        when(kycRepo.save(any())).thenReturn(pendingKyc);
        when(docRepo.existsByKycIdAndDocumentTypeAndSide(any(), any(), any())).thenReturn(false);
        when(storageService.store(any()))
                .thenReturn(new DocumentStorageService.StorageResult("f.enc", "hash"));
        when(docRepo.save(any())).thenAnswer(i -> i.getArgument(0));
        KycVerification after = new KycVerification();
        after.setStatus(KycStatus.SUBMITTED);
        when(kycRepo.findById(any())).thenReturn(Optional.of(after));

        DocumentUploadResponse resp = useCase.execute(userId, DocumentType.DNI, "FRONT", jpeg800kb());

        assertThat(resp).isNotNull();
    }

    private static MockMultipartFile jpeg800kb() {
        return new MockMultipartFile("file", "dni.jpg", "image/jpeg", new byte[800 * 1024]);
    }
}
