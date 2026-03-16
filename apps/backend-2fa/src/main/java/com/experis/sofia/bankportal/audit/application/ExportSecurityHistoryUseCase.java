package com.experis.sofia.bankportal.audit.application;

import com.experis.sofia.bankportal.audit.infrastructure.AuditLogQueryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Caso de uso US-402 — Exportar historial de seguridad en PDF o CSV.
 *
 * <p>R-F5-001: generación síncrona con límite MAX_EVENTS=1000.
 * El controller devuelve el resultado como byte[] — no bloquea el hilo de Servlet
 * porque el contenido se genera completamente en memoria antes de enviar.
 *
 * <p>RV-S6-002 fix: eliminado import no usado {@code @Async} (la generación es síncrona
 * por diseño — ver Javadoc de R-F5-001 en LLD-backend-security-audit.md).
 *
 * @author SOFIA Developer Agent — FEAT-005 Sprint 6
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExportSecurityHistoryUseCase {

    private final AuditLogQueryRepository auditRepo;

    private static final int            MAX_EVENTS = 1000;
    private static final String         DATE_FORMAT = "dd/MM/yyyy HH:mm:ss";
    private static final DateTimeFormatter FMT      = DateTimeFormatter.ofPattern(DATE_FORMAT);

    /**
     * Exporta el historial en el formato indicado.
     *
     * @param userId ID del usuario autenticado
     * @param format "pdf" o "csv"
     * @param days   período: 30, 60 o 90
     * @return Optional vacío si no hay eventos → controller devuelve HTTP 204
     */
    @Transactional(readOnly = true)
    public Optional<ExportResult> execute(UUID userId, String format, int days) {
        var events = auditRepo.findByUserIdAndPeriod(userId, Math.min(days, 90));

        if (events.isEmpty()) {
            log.info("No events found for export userId={} days={}", userId, days);
            return Optional.empty();
        }

        if (events.size() > MAX_EVENTS) {
            events = events.subList(0, MAX_EVENTS);
        }

        try {
            byte[] content = "csv".equalsIgnoreCase(format)
                    ? generateCsv(events)
                    : generatePdf(events, days);

            String hash      = sha256Hex(content);
            String filename  = buildFilename(format, days);
            String mediaType = "csv".equalsIgnoreCase(format) ? "text/csv" : "application/pdf";

            return Optional.of(new ExportResult(content, hash, filename, mediaType));

        } catch (Exception e) {
            log.error("Export failed userId={} format={}: {}", userId, format, e.getMessage());
            throw new RuntimeException("Export generation failed", e);
        }
    }

    // ── CSV ───────────────────────────────────────────────────────────────────

    private byte[] generateCsv(List<AuditLogQueryRepository.AuditEvent> events)
            throws Exception {
        var out    = new ByteArrayOutputStream();
        var writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
        var fmt    = CSVFormat.DEFAULT.builder()
                .setHeader("Fecha/Hora", "Tipo de evento", "Descripción", "Dispositivo", "IP")
                .build();

        try (var printer = new CSVPrinter(writer, fmt)) {
            for (var e : events) {
                printer.printRecord(
                        e.occurredAt() != null ? e.occurredAt().format(FMT) : "",
                        e.eventType(), e.description(), e.device(), e.ipMasked());
            }
        }

        // Hash de integridad sobre los datos (SUG-S6-002: scope=data-rows-only)
        String hash = sha256Hex(out.toByteArray());
        writer.write("\n#sha256-scope=data-rows-only\n#sha256=" + hash +
                "\n#generated=" + java.time.LocalDateTime.now().format(FMT) + "\n");
        writer.flush();

        return out.toByteArray();
    }

    // ── PDF (OpenPDF) ─────────────────────────────────────────────────────────

    private byte[] generatePdf(List<AuditLogQueryRepository.AuditEvent> events,
                                int days) throws Exception {
        var out      = new ByteArrayOutputStream();
        var document = new com.lowagie.text.Document(com.lowagie.text.PageSize.A4.rotate());
        com.lowagie.text.pdf.PdfWriter.getInstance(document, out);
        document.open();

        var boldFont  = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 14,
                com.lowagie.text.Font.BOLD);
        var bodyFont  = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 9);
        var smallFont = new com.lowagie.text.Font(com.lowagie.text.Font.HELVETICA, 7,
                com.lowagie.text.Font.NORMAL, java.awt.Color.GRAY);

        // Cabecera
        document.add(new com.lowagie.text.Paragraph(
                "Banco Meridian — Historial de Seguridad", boldFont));
        document.add(new com.lowagie.text.Paragraph(
                "Período: últimos " + days + " días  |  Generado: " +
                java.time.LocalDateTime.now().format(FMT), bodyFont));
        document.add(com.lowagie.text.Chunk.NEWLINE);

        // Tabla
        var table = new com.lowagie.text.pdf.PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{2.5f, 2f, 3.5f, 2f, 1.5f});

        for (String h : new String[]{"Fecha/Hora", "Tipo de evento",
                "Descripción", "Dispositivo", "IP"}) {
            var cell = new com.lowagie.text.pdf.PdfPCell(
                    new com.lowagie.text.Phrase(h, new com.lowagie.text.Font(
                            com.lowagie.text.Font.HELVETICA, 9,
                            com.lowagie.text.Font.BOLD, java.awt.Color.WHITE)));
            cell.setBackgroundColor(new java.awt.Color(27, 58, 107));
            cell.setPadding(5);
            table.addCell(cell);
        }

        boolean alt = false;
        for (var e : events) {
            java.awt.Color bg = alt
                    ? new java.awt.Color(240, 240, 240) : java.awt.Color.WHITE;
            for (String val : new String[]{
                    e.occurredAt() != null ? e.occurredAt().format(FMT) : "",
                    e.eventType(), e.description(), e.device(), e.ipMasked()}) {
                var cell = new com.lowagie.text.pdf.PdfPCell(
                        new com.lowagie.text.Phrase(val != null ? val : "", bodyFont));
                cell.setBackgroundColor(bg);
                cell.setPadding(4);
                table.addCell(cell);
            }
            alt = !alt;
        }
        document.add(table);

        // Pie de página
        document.add(com.lowagie.text.Chunk.NEWLINE);
        String hash = sha256Hex(out.toByteArray());
        document.add(new com.lowagie.text.Paragraph(
                "SHA-256 (data-rows-only): " + hash +
                "\nPara verificar: sha256sum <archivo.pdf>", smallFont));
        document.add(new com.lowagie.text.Paragraph(
                "Banco Meridian · Confidencial · PCI-DSS req. 10.7", smallFont));

        document.close();
        return out.toByteArray();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String sha256Hex(byte[] data) throws Exception {
        return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(data));
    }

    private String buildFilename(String format, int days) {
        return String.format("seguridad-%s-%dd-%s.%s",
                format, days, java.time.LocalDate.now(), format.toLowerCase());
    }

    public record ExportResult(
            byte[] content, String sha256Hash, String filename, String mediaType) {}
}
