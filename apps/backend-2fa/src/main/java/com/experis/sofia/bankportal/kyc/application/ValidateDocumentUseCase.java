package com.experis.sofia.bankportal.kyc.application;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.kyc.domain.*;
import com.experis.sofia.bankportal.kyc.domain.DocumentStoragePort;
import lombok.RequiredArgsConstructor;
import lombok.extern.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Motor de validación automática de documentos KYC.
 * FEAT-013 US-1303 — ejecutado tras cada subida de documento.
 *
 * Reglas: formato válido, no caducado, hash íntegro, todas las caras presentes.
 * Resultado: APPROVED (todas pasan) o SUBMITTED (revisión manual).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ValidateDocumentUseCase {

    private final KycVerificationRepository kycRepo;
    private final KycDocumentRepository     docRepo;
    private final DocumentStoragePort       storageService;
    private final AuditLogService           auditLog;

    @Async
    @EventListener
    public void onDocumentSubmitted(KycDocumentSubmittedEvent event) {
        execute(event.kycId(), event.userId());
    }

    @Transactional
    public void execute(UUID kycId, UUID userId) {
        KycVerification kyc = kycRepo.findById(kycId).orElseThrow();
        List<KycDocument> docs = docRepo.findByKycId(kycId);

        // Verificar que todos los documentos requeridos están presentes
        if (!allDocumentsPresent(kyc, docs)) {
            log.debug("[US-1303] Documentos incompletos para kycId={} — sin validación", kycId);
            return; // KYC permanece en PENDING
        }

        boolean valid = docs.stream().allMatch(doc -> validateDocument(doc, userId));

        if (valid) {
            kyc.setStatus(KycStatus.APPROVED);
            kycRepo.save(kyc);
            auditLog.log("KYC_AUTO_APPROVED", userId, "kycId=" + kycId);
            log.info("[US-1303] KYC auto-aprobado userId={}", userId);
        } else {
            kyc.setStatus(KycStatus.SUBMITTED);
            kyc.setSubmittedAt(java.time.LocalDateTime.now());
            kycRepo.save(kyc);
            auditLog.log("KYC_SUBMITTED_FOR_REVIEW", userId, "kycId=" + kycId);
            log.info("[US-1303] KYC derivado a revisión manual userId={}", userId);
        }
    }

    /** Verifica que están todas las caras requeridas según el tipo de documento. */
    private boolean allDocumentsPresent(KycVerification kyc, List<KycDocument> docs) {
        if (docs.isEmpty()) return false;

        // Determinar tipo de documento (primer doc como referencia)
        DocumentType docType = docs.get(0).getDocumentType();

        if (docType == DocumentType.PASSPORT) {
            return docs.stream().anyMatch(d -> "FRONT".equals(d.getSide()));
        } else {
            // DNI y NIE requieren ambas caras
            boolean hasFront = docs.stream().anyMatch(d -> "FRONT".equals(d.getSide()));
            boolean hasBack  = docs.stream().anyMatch(d -> "BACK".equals(d.getSide()));
            return hasFront && hasBack;
        }
    }

    /** Valida un documento individual: formato, caducidad e integridad. */
    private boolean validateDocument(KycDocument doc, UUID userId) {
        // Regla 1: documento no caducado
        if (doc.getExpiresAt() != null && doc.getExpiresAt().isBefore(LocalDate.now())) {
            log.warn("[US-1303] Documento caducado userId={} docId={}", userId, doc.getId());
            doc.setValidationStatus("INVALID");
            docRepo.save(doc);
            return false;
        }
        // Regla 2: integridad del fichero (hash recalculado)
        if (!storageService.verifyIntegrity(doc.getFilePath(), doc.getFileHash())) {
            log.warn("[US-1303] Hash inválido userId={} docId={}", userId, doc.getId());
            doc.setValidationStatus("INVALID");
            docRepo.save(doc);
            return false;
        }
        doc.setValidationStatus("VALID");
        docRepo.save(doc);
        return true;
    }
}
