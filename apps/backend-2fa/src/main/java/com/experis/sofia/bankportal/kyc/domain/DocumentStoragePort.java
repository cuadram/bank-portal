package com.experis.sofia.bankportal.kyc.domain;

import org.springframework.web.multipart.MultipartFile;

/**
 * Puerto de salida — almacenamiento seguro de documentos de identidad.
 * ADR-023: implementación en infraestructura (AES-256-GCM en filesystem).
 * La capa application solo depende de esta interfaz — nunca de DocumentStorageService.
 * FEAT-013 US-1302 · RV-021 fix.
 */
public interface DocumentStoragePort {
    StorageResult store(MultipartFile file);
    boolean verifyIntegrity(String filePath, String expectedHash);

    record StorageResult(String filePath, String sha256Hash) {}
}
