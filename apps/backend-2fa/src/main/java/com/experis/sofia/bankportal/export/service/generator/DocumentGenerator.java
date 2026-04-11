package com.experis.sofia.bankportal.export.service.generator;

import com.experis.sofia.bankportal.account.domain.Transaction;

import java.util.List;

/**
 * Contrato para generadores de documentos de exportación.
 * ADR-031: extensible sin modificar ExportService (OCP).
 * HOTFIX-S20: paquete corregido.
 */
public interface DocumentGenerator {
    byte[] generate(List<Transaction> transactions, ExportMetadata metadata);
    String getContentType();
    String getFileExtension();
}
