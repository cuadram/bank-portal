package com.experis.sofia.bankportal.export.service;

import com.experis.sofia.bankportal.account.domain.Transaction;
import com.experis.sofia.bankportal.export.domain.ExportFormat;
import com.experis.sofia.bankportal.export.dto.ExportRequest;
import com.experis.sofia.bankportal.export.repository.TransactionExportRepository;
import com.experis.sofia.bankportal.export.service.generator.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

/**
 * Orquesta la exportación de movimientos: validación → fetch → generate → audit.
 * ADR-031: síncrono <= 500 registros (S20).
 * HOTFIX-S20: paquete corregido + usa TransactionExportRepository (JdbcClient).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExportService {

    private static final int MAX_RECORDS       = 500;
    private static final int MAX_HISTORY_MONTHS = 12; // PSD2 Art.47

    private final TransactionExportRepository transactionRepository;
    private final PdfDocumentGenerator        pdfGenerator;
    private final CsvDocumentGenerator        csvGenerator;
    private final ExportAuditService          auditService;

    public byte[] export(UUID accountId, ExportRequest request,
                         String userId, String ipOrigen, String userAgent) {

        // DEBT-038 fix (SEC-F018-02): validar que la cuenta pertenece al usuario del JWT
        if (!transactionRepository.existsByAccountIdAndUserId(accountId, UUID.fromString(userId))) {
            throw new AccessDeniedException("Cuenta no pertenece al usuario autenticado");
        }

        validateRange(request.getFechaDesde(), request.getFechaHasta());

        List<Transaction> transactions = transactionRepository.findByAccountIdAndFilters(
                accountId,
                request.getFechaDesde(),
                request.getFechaHasta(),
                request.getTipoMovimiento(),
                MAX_RECORDS + 1
        );

        if (transactions.size() > MAX_RECORDS) {
            throw new ExportLimitExceededException(
                    "Maximo " + MAX_RECORDS + " registros por exportacion");
        }

        DocumentGenerator generator = selectGenerator(request.getFormato());

        ExportMetadata metadata = ExportMetadata.builder()
                .holderName("Titular")            // DEBT-036: enriquecer con nombre real
                .iban("ACCOUNT-" + accountId.toString().substring(24))
                .fechaDesde(request.getFechaDesde())
                .fechaHasta(request.getFechaHasta())
                .tipoMovimiento(request.getTipoMovimiento())
                .build();

        byte[] content = generator.generate(transactions, metadata);
        String hash    = computeHash(content, request.getFormato());

        auditService.recordAsync(accountId, request, userId, ipOrigen, userAgent,
                transactions.size(), hash);

        log.info("Export {} generado: {} registros, cuenta={}", request.getFormato(),
                transactions.size(), accountId);
        return content;
    }

    public long countExportable(UUID accountId, LocalDate desde, LocalDate hasta, String tipo) {
        validateRange(desde, hasta);
        return transactionRepository.countByAccountIdAndFilters(accountId, desde, hasta, tipo);
    }

    private void validateRange(LocalDate desde, LocalDate hasta) {
        if (desde == null || hasta == null) {
            throw new ExportRangeException("fechaDesde y fechaHasta son obligatorias");
        }
        if (desde.isBefore(LocalDate.now().minusMonths(MAX_HISTORY_MONTHS))) {
            throw new ExportRangeException(
                    "Rango maximo de exportacion: " + MAX_HISTORY_MONTHS + " meses (PSD2 Art.47)");
        }
        if (hasta.isBefore(desde)) {
            throw new ExportRangeException("La fecha hasta debe ser posterior a la fecha desde");
        }
    }

    private DocumentGenerator selectGenerator(ExportFormat format) {
        return switch (format) {
            case PDF -> pdfGenerator;
            case CSV -> csvGenerator;
        };
    }

    private String computeHash(byte[] content, ExportFormat format) {
        if (format != ExportFormat.PDF) return null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(content));
        } catch (NoSuchAlgorithmException e) {
            log.warn("SHA-256 no disponible", e);
            return null;
        }
    }
}
