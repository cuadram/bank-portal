package com.experis.sofia.bankportal.kyc.application;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.kyc.application.dto.DocumentUploadResponse;
import com.experis.sofia.bankportal.kyc.domain.*;
import com.experis.sofia.bankportal.kyc.domain.DocumentStoragePort;
import lombok.RequiredArgsConstructor;
import lombok.extern.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.Set;
import java.util.UUID;

/**
 * Subida de documentos de identidad KYC.
 * FEAT-013 US-1302 — POST /api/v1/kyc/documents
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UploadDocumentUseCase {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024L; // 10 MB
    private static final Set<String> ACCEPTED_MIME = Set.of(
            "image/jpeg", "image/png", "application/pdf");

    private final KycVerificationRepository kycRepo;
    private final KycDocumentRepository     docRepo;
    private final DocumentStoragePort       storageService;
    private final ApplicationEventPublisher eventPublisher;
    private final AuditLogService           auditLog;

    @Transactional
    public DocumentUploadResponse execute(UUID userId,
                                          DocumentType documentType,
                                          String side,
                                          MultipartFile file) {
        // Validación de fichero
        validateFile(file);

        // Obtener o crear verificación KYC
        KycVerification kyc = kycRepo.findByUserId(userId).orElseGet(() -> {
            KycVerification v = new KycVerification();
            v.setUserId(userId);
            v.setStatus(KycStatus.PENDING);
            return kycRepo.save(v);
        });

        if (kyc.getStatus() == KycStatus.APPROVED)
            throw new KycException("KYC_ALREADY_APPROVED");

        // Verificar que no existe ya ese tipo+cara
        if (docRepo.existsByKycIdAndDocumentTypeAndSide(kyc.getId(), documentType, side))
            throw new KycException("DOCUMENT_ALREADY_UPLOADED");

        // Almacenar cifrado + calcular hash SHA-256
        DocumentStoragePort.StorageResult stored = storageService.store(file);

        // Persistir documento
        KycDocument doc = new KycDocument();
        doc.setKycId(kyc.getId());
        doc.setDocumentType(documentType);
        doc.setSide(side);
        doc.setFilePath(stored.filePath());
        doc.setFileHash(stored.sha256Hash());
        docRepo.save(doc);

        auditLog.log("KYC_DOCUMENT_UPLOADED", userId,
                "type=" + documentType + " side=" + side);
        log.info("[US-1302] Documento subido userId={} type={} side={}", userId, documentType, side);

        // Publicar evento — validación asíncrona post-commit (ADR-024 / RV-022)
        eventPublisher.publishEvent(new KycDocumentSubmittedEvent(this, kyc.getId(), userId));

        return new DocumentUploadResponse(doc.getId(), kyc.getStatus());
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) throw new KycException("FILE_EMPTY");
        if (file.getSize() > MAX_FILE_SIZE) throw new KycException("FILE_TOO_LARGE");
        String mime = file.getContentType();
        if (mime == null || !ACCEPTED_MIME.contains(mime))
            throw new KycException("UNSUPPORTED_FORMAT");
    }

    public static class KycException extends RuntimeException {
        public KycException(String code) { super(code); }
    }
}
