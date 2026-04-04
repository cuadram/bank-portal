package com.experis.sofia.bankportal.export.service.generator;

import com.experis.sofia.bankportal.account.domain.Transaction;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Generador de extractos PDF — Apache PDFBox 3.x.
 * ADR-030: PDFBox (Apache 2.0) sobre iText (AGPL).
 * PCI-DSS Req.3.4: PAN enmascarado — solo últimos 4 dígitos.
 * SCRUM-113 / MB-020-03 (Sprint 21): corrección paginación multi-página.
 *   Bug anterior: cs2 del bloque try-with-resources se cerraba inmediatamente;
 *   las filas siguientes se seguían escribiendo en cs (primera página).
 *   Corrección: mantener referencia a PDPageContentStream activo como variable
 *   mutable; cerrarlo explícitamente al saltar de página y abrir uno nuevo.
 *
 * @author SOFIA Developer Agent — FEAT-019 Sprint 21 (SCRUM-113)
 */
@Slf4j
@Component
public class PdfDocumentGenerator implements DocumentGenerator {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.of("Europe/Madrid"));
    private static final DateTimeFormatter DT_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private static final float MARGIN      = 50f;
    private static final float PAGE_WIDTH  = PDRectangle.A4.getWidth();
    private static final float PAGE_HEIGHT = PDRectangle.A4.getHeight();
    private static final float ROW_HEIGHT  = 12f;
    private static final float MIN_Y       = MARGIN + 40f;

    @Override
    public byte[] generate(List<Transaction> transactions, ExportMetadata metadata) {

        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            // SCRUM-113: cs es variable mutable — se cierra y reabre al cambiar de página
            PDPageContentStream cs = openNewPage(doc, metadata);
            float y = firstPageStartY();

            // ── Cabecera de tabla ────────────────────────────────────────────
            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
            drawTableRow(cs, y, "Fecha", "Concepto", "Importe", "Saldo");
            y -= ROW_HEIGHT;
            drawHRule(cs, y + 2);
            y -= 4;

            // ── Filas de transacciones ────────────────────────────────────────
            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 8);

            for (Transaction tx : transactions) {
                // SCRUM-113: salto de página correcto — cerrar cs actual, abrir nuevo
                if (y < MIN_Y) {
                    writePageFooter(cs, metadata);
                    cs.close();                          // ← cerrar página anterior
                    cs = openNewPage(doc, metadata);     // ← abrir nueva página
                    cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
                    y = PAGE_HEIGHT - MARGIN;
                    drawTableRow(cs, y, "Fecha", "Concepto", "Importe", "Saldo");
                    y -= ROW_HEIGHT;
                    drawHRule(cs, y + 2);
                    y -= 4;
                    cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 8);
                }

                String fecha   = DATE_FMT.format(tx.getTransactionDate());
                String concept = maskPan(tx.getConcept());
                String importe = String.format("%.2f EUR", tx.getAmount());
                String saldo   = String.format("%.2f EUR", tx.getBalanceAfter());

                drawTableRow(cs, y, fecha, concept, importe, saldo);
                y -= ROW_HEIGHT;
            }

            // Pie de la última página
            writePageFooter(cs, metadata);
            cs.close(); // ← cerrar siempre la última página

            doc.save(baos);
            byte[] pdfBytes = baos.toByteArray();
            log.debug("PDF generado: {} bytes, {} registros, {} páginas",
                    pdfBytes.length, transactions.size(), doc.getNumberOfPages());
            return pdfBytes;

        } catch (IOException e) {
            log.error("Error generando PDF", e);
            throw new ExportGenerationException("Error generando PDF: " + e.getMessage(), e);
        }
    }

    /** Abre una nueva página en el documento y escribe la cabecera corporativa. */
    private PDPageContentStream openNewPage(PDDocument doc, ExportMetadata metadata)
            throws IOException {
        PDPage page = new PDPage(PDRectangle.A4);
        doc.addPage(page);
        PDPageContentStream cs = new PDPageContentStream(doc, page);

        float y = PAGE_HEIGHT - MARGIN;

        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 18);
        cs.beginText();
        cs.newLineAtOffset(MARGIN, y);
        cs.showText("BANCO MERIDIAN");
        cs.endText();
        y -= 22;

        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
        cs.beginText();
        cs.newLineAtOffset(MARGIN, y);
        cs.showText("Extracto de Movimientos — " + metadata.getIban());
        cs.endText();
        y -= 14;

        cs.beginText();
        cs.newLineAtOffset(MARGIN, y);
        cs.showText("Titular: " + metadata.getHolderName());
        cs.endText();
        y -= 14;

        cs.beginText();
        cs.newLineAtOffset(MARGIN, y);
        cs.showText("Periodo: "
                + metadata.getFechaDesde().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                + " — "
                + metadata.getFechaHasta().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        cs.endText();
        y -= 20;

        drawHRule(cs, y);
        return cs;
    }

    private float firstPageStartY() {
        // Cabecera ocupa ~80pt
        return PAGE_HEIGHT - MARGIN - 80f;
    }

    private void writePageFooter(PDPageContentStream cs, ExportMetadata metadata)
            throws IOException {
        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE), 7);
        cs.beginText();
        cs.newLineAtOffset(MARGIN, MARGIN + 20);
        cs.showText("Generado: "
                + java.time.LocalDateTime.now(ZoneId.of("Europe/Madrid")).format(DT_FMT)
                + " (Europe/Madrid) | Documento oficial Banco Meridian");
        cs.endText();
        // Nota: el hash SHA-256 del PDF completo se calcula en ExportService
        // tras la generación y se registra en el audit log (RN-F018-03/15)
    }

    private void drawHRule(PDPageContentStream cs, float y) throws IOException {
        cs.moveTo(MARGIN, y);
        cs.lineTo(PAGE_WIDTH - MARGIN, y);
        cs.stroke();
    }

    private void drawTableRow(PDPageContentStream cs, float y,
                              String fecha, String concepto, String importe, String saldo)
            throws IOException {
        cs.beginText();
        cs.newLineAtOffset(MARGIN, y);
        cs.showText(truncate(fecha, 12));
        cs.newLineAtOffset(80, 0);
        cs.showText(truncate(concepto, 42));
        cs.newLineAtOffset(250, 0);
        cs.showText(truncate(importe, 15));
        cs.newLineAtOffset(85, 0);
        cs.showText(truncate(saldo, 15));
        cs.endText();
    }

    /** PCI-DSS Req.3.4: enmascara PAN dejando solo últimos 4 dígitos. */
    private String maskPan(String text) {
        if (text == null) return "";
        return text.replaceAll("\\b\\d{12,15}(\\d{4})\\b", "****$1");
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() > max ? s.substring(0, max - 1) + ">" : s;
    }

    @Override public String getContentType()   { return "application/pdf"; }
    @Override public String getFileExtension() { return "pdf"; }
}
