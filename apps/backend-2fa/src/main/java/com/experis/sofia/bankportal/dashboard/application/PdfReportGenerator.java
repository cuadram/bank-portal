package com.experis.sofia.bankportal.dashboard.application;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import com.experis.sofia.bankportal.dashboard.application.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;

/**
 * Generador de informes PDF del dashboard.
 * Usa OpenPDF (LGPL) con estilos corporativos Banco Meridian.
 * US-1107 FEAT-011 Sprint 13.
 *
 * @author SOFIA Developer Agent
 */
@Slf4j
@Component
public class PdfReportGenerator {

    private static final Color MERIDIAN_BLUE = new Color(27, 58, 107);   // #1B3A6B
    private static final Color LIGHT_GRAY    = new Color(245, 245, 245);

    public byte[] generate(String period, DashboardSummaryDto summary,
                           List<SpendingCategoryDto> categories,
                           List<TopMerchantDto> merchants) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4, 36, 36, 60, 36);
            PdfWriter.getInstance(doc, out);
            doc.open();

            // ── Cabecera ──────────────────────────────────────────────────
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18,
                    Font.BOLD, MERIDIAN_BLUE);
            Font subFont   = FontFactory.getFont(FontFactory.HELVETICA, 9,
                    Font.NORMAL, Color.GRAY);

            Paragraph title = new Paragraph(
                    "Dashboard Analítico — " + formatPeriod(period), titleFont);
            title.setAlignment(Element.ALIGN_LEFT);
            doc.add(title);
            doc.add(new Paragraph("Banco Meridian · Generado el " + LocalDate.now(), subFont));
            doc.add(Chunk.NEWLINE);

            // ── Sección 1: Resumen financiero ─────────────────────────────
            addSectionTitle(doc, "Resumen financiero");
            PdfPTable t1 = new PdfPTable(2);
            t1.setWidthPercentage(60);
            t1.setHorizontalAlignment(Element.ALIGN_LEFT);
            addTableRow(t1, "Ingresos del mes",   formatEuros(summary.totalIncome()),   false);
            addTableRow(t1, "Gastos del mes",     formatEuros(summary.totalExpenses()), false);
            addTableRow(t1, "Saldo neto",         formatEuros(summary.netBalance()),    true);
            doc.add(t1);
            doc.add(Chunk.NEWLINE);

            // ── Sección 2: Gastos por categoría ──────────────────────────
            addSectionTitle(doc, "Gastos por categoría");
            PdfPTable t2 = new PdfPTable(4);
            t2.setWidthPercentage(100);
            addTableHeader(t2, "Categoría", "Importe", "%", "Transacciones");
            for (SpendingCategoryDto c : categories) {
                addTableRow(t2,
                        c.category(),
                        formatEuros(c.amount()),
                        String.format("%.1f%%", c.percentage()),
                        String.valueOf(c.count()));
            }
            doc.add(t2);
            doc.add(Chunk.NEWLINE);

            // ── Sección 3: Top comercios ──────────────────────────────────
            addSectionTitle(doc, "Top 5 comercios");
            PdfPTable t3 = new PdfPTable(3);
            t3.setWidthPercentage(80);
            addTableHeader(t3, "Emisor / Comercio", "Total", "Transacciones");
            for (TopMerchantDto m : merchants) {
                addTableRow(t3, m.issuer(), formatEuros(m.totalAmount()),
                        String.valueOf(m.count()));
            }
            doc.add(t3);

            // Pie de página
            doc.add(Chunk.NEWLINE);
            doc.add(new Paragraph("SOFIA Software Factory — Experis — " + LocalDate.now(), subFont));

            doc.close();
            log.info("[US-1107] PDF generado: periodo={} categorias={} merchants={}",
                    period, categories.size(), merchants.size());
            return out.toByteArray();

        } catch (Exception e) {
            log.error("[US-1107] Error generando PDF para periodo={}", period, e);
            throw new RuntimeException("Error generando PDF del dashboard", e);
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private void addSectionTitle(Document doc, String text) throws DocumentException {
        Font f = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Font.BOLD, MERIDIAN_BLUE);
        Paragraph p = new Paragraph(text, f);
        p.setSpacingBefore(8);
        p.setSpacingAfter(4);
        doc.add(p);
    }

    private void addTableHeader(PdfPTable table, String... headers) {
        Font f = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Font.BOLD, Color.WHITE);
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, f));
            cell.setBackgroundColor(MERIDIAN_BLUE);
            cell.setPadding(5);
            table.addCell(cell);
        }
    }

    private void addTableRow(PdfPTable table, String... values) {
        Font f = FontFactory.getFont(FontFactory.HELVETICA, 9);
        for (String v : values) {
            PdfPCell cell = new PdfPCell(new Phrase(v, f));
            cell.setPadding(4);
            table.addCell(cell);
        }
    }

    private void addTableRow(PdfPTable table, String label, String value, boolean bold) {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
        Font valueFont = bold
                ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD, MERIDIAN_BLUE)
                : FontFactory.getFont(FontFactory.HELVETICA, 10);
        PdfPCell lc = new PdfPCell(new Phrase(label, labelFont)); lc.setPadding(5);
        PdfPCell vc = new PdfPCell(new Phrase(value, valueFont)); vc.setPadding(5);
        if (bold) {
            lc.setBackgroundColor(LIGHT_GRAY);
            vc.setBackgroundColor(LIGHT_GRAY);
        }
        table.addCell(lc);
        table.addCell(vc);
    }

    private String formatPeriod(String period) {
        YearMonth ym = YearMonth.parse(period);
        return ym.getMonth().getDisplayName(TextStyle.FULL, new Locale("es", "ES"))
               + " " + ym.getYear();
    }

    private String formatEuros(BigDecimal value) {
        return String.format("%,.2f €", value != null ? value : BigDecimal.ZERO);
    }
}
