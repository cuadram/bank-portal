package com.experis.sofia.bankportal.dashboard.application;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import com.experis.sofia.bankportal.dashboard.application.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;

/**
 * RV-013 (Sprint 14): catch específico DocumentException | IOException.
 */
@Slf4j
@Component
public class PdfReportGenerator {

    private static final Color MERIDIAN_BLUE = new Color(27, 58, 107);
    private static final Color LIGHT_GRAY    = new Color(245, 245, 245);

    public byte[] generate(String period, DashboardSummaryDto summary,
                           List<SpendingCategoryDto> categories,
                           List<TopMerchantDto> merchants) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4, 36, 36, 60, 36);
            PdfWriter.getInstance(doc, out);
            doc.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Font.BOLD, MERIDIAN_BLUE);
            Font subFont   = FontFactory.getFont(FontFactory.HELVETICA, 9, Font.NORMAL, Color.GRAY);

            Paragraph title = new Paragraph("Dashboard Analítico — " + formatPeriod(period), titleFont);
            title.setAlignment(Element.ALIGN_LEFT);
            doc.add(title);
            doc.add(new Paragraph("Banco Meridian · " + LocalDate.now(), subFont));
            doc.add(Chunk.NEWLINE);

            addSection(doc, "Resumen financiero");
            PdfPTable t1 = new PdfPTable(2);
            t1.setWidthPercentage(60);
            addRow2(t1, "Ingresos", fmt(summary.totalIncome()),  false);
            addRow2(t1, "Gastos",   fmt(summary.totalExpenses()), false);
            addRow2(t1, "Saldo neto", fmt(summary.netBalance()),  true);
            doc.add(t1); doc.add(Chunk.NEWLINE);

            addSection(doc, "Gastos por categoría");
            PdfPTable t2 = new PdfPTable(4);
            t2.setWidthPercentage(100);
            addHeader(t2, "Categoría","Importe","%","Txs");
            for (SpendingCategoryDto c : categories)
                addRow(t2, c.category(), fmt(c.amount()), String.format("%.1f%%",c.percentage()), String.valueOf(c.count()));
            doc.add(t2); doc.add(Chunk.NEWLINE);

            addSection(doc, "Top comercios");
            PdfPTable t3 = new PdfPTable(3);
            t3.setWidthPercentage(80);
            addHeader(t3, "Comercio","Total","Txs");
            for (TopMerchantDto m : merchants)
                addRow(t3, m.issuer(), fmt(m.totalAmount()), String.valueOf(m.count()));
            doc.add(t3);
            doc.add(Chunk.NEWLINE);
            doc.add(new Paragraph("SOFIA Software Factory — Experis — " + LocalDate.now(), subFont));
            doc.close();
            log.info("[US-1107] PDF periodo={} categorias={}", period, categories.size());
            return out.toByteArray();

        } catch (DocumentException | IOException e) {   // RV-013
            log.error("[US-1107] Error PDF periodo={}", period, e);
            throw new PdfGenerationException("Error generando PDF", e);
        }
    }

    private void addSection(Document doc, String text) throws DocumentException {
        Font f = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Font.BOLD, MERIDIAN_BLUE);
        Paragraph p = new Paragraph(text, f); p.setSpacingBefore(8); p.setSpacingAfter(4);
        doc.add(p);
    }
    private void addHeader(PdfPTable t, String... vals) {
        Font f = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Font.BOLD, Color.WHITE);
        for (String v : vals) { PdfPCell c = new PdfPCell(new Phrase(v,f)); c.setBackgroundColor(MERIDIAN_BLUE); c.setPadding(5); t.addCell(c); }
    }
    private void addRow(PdfPTable t, String... vals) {
        Font f = FontFactory.getFont(FontFactory.HELVETICA, 9);
        for (String v : vals) { PdfPCell c = new PdfPCell(new Phrase(v,f)); c.setPadding(4); t.addCell(c); }
    }
    private void addRow2(PdfPTable t, String label, String value, boolean bold) {
        Font lf = FontFactory.getFont(FontFactory.HELVETICA, 10);
        Font vf = bold ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD, MERIDIAN_BLUE) : lf;
        PdfPCell lc = new PdfPCell(new Phrase(label, lf)); lc.setPadding(5);
        PdfPCell vc = new PdfPCell(new Phrase(value, vf)); vc.setPadding(5);
        if (bold) { lc.setBackgroundColor(LIGHT_GRAY); vc.setBackgroundColor(LIGHT_GRAY); }
        t.addCell(lc); t.addCell(vc);
    }
    private String formatPeriod(String p) {
        YearMonth ym = YearMonth.parse(p);
        return ym.getMonth().getDisplayName(TextStyle.FULL, new Locale("es","ES")) + " " + ym.getYear();
    }
    private String fmt(BigDecimal v) { return String.format("%,.2f €", v != null ? v : BigDecimal.ZERO); }

    public static class PdfGenerationException extends RuntimeException {
        public PdfGenerationException(String m, Throwable c) { super(m, c); }
    }
}
