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
 * HOTFIX-S20: paquete corregido + API Transaction real:
 *   getTransactionDate() (Instant), getConcept(), getAmount(), getBalanceAfter().
 */
@Slf4j
@Component
public class PdfDocumentGenerator implements DocumentGenerator {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.of("Europe/Madrid"));

    private static final float MARGIN      = 50f;
    private static final float PAGE_WIDTH  = PDRectangle.A4.getWidth();
    private static final float PAGE_HEIGHT = PDRectangle.A4.getHeight();

    @Override
    public byte[] generate(List<Transaction> transactions, ExportMetadata metadata) {
        try (PDDocument doc = new PDDocument();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                float y = PAGE_HEIGHT - MARGIN;

                // ── Cabecera ────────────────────────────────────────────────
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
                cs.showText("Periodo: " + metadata.getFechaDesde().format(
                        DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                        + " — " + metadata.getFechaHasta().format(
                        DateTimeFormatter.ofPattern("dd/MM/yyyy")));
                cs.endText();
                y -= 20;

                // Línea separadora
                cs.moveTo(MARGIN, y);
                cs.lineTo(PAGE_WIDTH - MARGIN, y);
                cs.stroke();
                y -= 16;

                // ── Cabecera tabla ───────────────────────────────────────────
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
                drawTableRow(cs, y, "Fecha", "Concepto", "Importe", "Saldo");
                y -= 14;
                cs.moveTo(MARGIN, y + 2);
                cs.lineTo(PAGE_WIDTH - MARGIN, y + 2);
                cs.stroke();
                y -= 4;

                // ── Filas ────────────────────────────────────────────────────
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 8);
                for (Transaction tx : transactions) {
                    if (y < MARGIN + 40) {
                        // Nueva página
                        PDPage newPage = new PDPage(PDRectangle.A4);
                        doc.addPage(newPage);
                        try (PDPageContentStream cs2 = new PDPageContentStream(doc, newPage)) {
                            cs2.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 8);
                        }
                        y = PAGE_HEIGHT - MARGIN;
                    }

                    // API real: getTransactionDate() (Instant), getConcept(), getBalanceAfter()
                    String fecha   = DATE_FMT.format(tx.getTransactionDate());
                    String concept = maskPan(tx.getConcept());
                    String importe = String.format("%.2f EUR", tx.getAmount());
                    String saldo   = String.format("%.2f EUR", tx.getBalanceAfter());

                    drawTableRow(cs, y, fecha, concept, importe, saldo);
                    y -= 12;
                }

                // ── Pie ──────────────────────────────────────────────────────
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE), 7);
                cs.beginText();
                cs.newLineAtOffset(MARGIN, MARGIN + 20);
                cs.showText("Generado: " + java.time.LocalDateTime.now(ZoneId.of("Europe/Madrid"))
                        .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) + " (Europe/Madrid)");
                cs.endText();
            }

            doc.save(baos);
            byte[] pdfBytes = baos.toByteArray();
            log.debug("PDF generado: {} bytes, {} registros", pdfBytes.length, transactions.size());
            return pdfBytes;

        } catch (IOException e) {
            log.error("Error generando PDF", e);
            throw new ExportGenerationException("Error generando PDF: " + e.getMessage(), e);
        }
    }

    @Override public String getContentType()  { return "application/pdf"; }
    @Override public String getFileExtension() { return "pdf"; }

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
}
