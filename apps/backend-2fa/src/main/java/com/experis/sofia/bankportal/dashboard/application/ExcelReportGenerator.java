package com.experis.sofia.bankportal.dashboard.application;

import com.experis.sofia.bankportal.dashboard.application.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

/**
 * Generador de informes Excel del dashboard.
 * Usa Apache POI 5.x con 3 hojas y formato moneda €.
 * US-1108 FEAT-011 Sprint 13.
 *
 * @author SOFIA Developer Agent
 */
@Slf4j
@Component
public class ExcelReportGenerator {

    private static final short MERIDIAN_BLUE_R = 27;
    private static final short MERIDIAN_BLUE_G = 58;
    private static final short MERIDIAN_BLUE_B = 107;

    public byte[] generate(String period, DashboardSummaryDto summary,
                           List<SpendingCategoryDto> categories,
                           List<MonthlyEvolutionDto> evolution) {
        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle euroStyle   = createEuroStyle(wb);
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle titleStyle  = createTitleStyle(wb);

            // ── Hoja 1: Resumen ───────────────────────────────────────────
            XSSFSheet s1 = wb.createSheet("Resumen");
            s1.setColumnWidth(0, 6000); s1.setColumnWidth(1, 5000);

            Row titleRow = s1.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Dashboard Analítico — " + formatPeriod(period));
            titleCell.setCellStyle(titleStyle);
            s1.addMergedRegion(new CellRangeAddress(0, 0, 0, 1));

            writeRow(s1, 2, headerStyle, "Campo", "Valor");
            writeEuroRow(s1, 3, euroStyle, "Período", period, false);
            writeEuroRow(s1, 4, euroStyle, "Ingresos del mes", summary.totalIncome(), true);
            writeEuroRow(s1, 5, euroStyle, "Gastos del mes",   summary.totalExpenses(), true);
            writeEuroRow(s1, 6, euroStyle, "Saldo neto",       summary.netBalance(), true);
            writeRow(s1, 7, null, "Nº transacciones", String.valueOf(summary.transactionCount()));

            // ── Hoja 2: Categorías ────────────────────────────────────────
            XSSFSheet s2 = wb.createSheet("Categorías");
            s2.setColumnWidth(0, 5000); s2.setColumnWidth(1, 4000);
            s2.setColumnWidth(2, 3000); s2.setColumnWidth(3, 4000);
            writeRow(s2, 0, headerStyle, "Categoría", "Importe (€)", "% del total", "Transacciones");
            int r2 = 1;
            for (SpendingCategoryDto c : categories) {
                Row row = s2.createRow(r2++);
                row.createCell(0).setCellValue(c.category());
                Cell amt = row.createCell(1);
                amt.setCellValue(c.amount() != null ? c.amount().doubleValue() : 0);
                amt.setCellStyle(euroStyle);
                row.createCell(2).setCellValue(Math.round(c.percentage() * 10.0) / 10.0);
                row.createCell(3).setCellValue(c.count());
            }

            // ── Hoja 3: Evolución ─────────────────────────────────────────
            XSSFSheet s3 = wb.createSheet("Evolución");
            s3.setColumnWidth(0, 2000); s3.setColumnWidth(1, 2000);
            s3.setColumnWidth(2, 4500); s3.setColumnWidth(3, 4500); s3.setColumnWidth(4, 4500);
            writeRow(s3, 0, headerStyle, "Año", "Mes", "Ingresos (€)", "Gastos (€)", "Saldo neto (€)");
            int r3 = 1;
            for (MonthlyEvolutionDto e : evolution) {
                Row row = s3.createRow(r3++);
                row.createCell(0).setCellValue(e.year());
                row.createCell(1).setCellValue(e.month());
                Cell ic = row.createCell(2); ic.setCellValue(safeDouble(e.totalIncome()));   ic.setCellStyle(euroStyle);
                Cell gc = row.createCell(3); gc.setCellValue(safeDouble(e.totalExpenses())); gc.setCellStyle(euroStyle);
                Cell nc = row.createCell(4); nc.setCellValue(safeDouble(e.netBalance()));    nc.setCellStyle(euroStyle);
            }

            wb.write(out);
            log.info("[US-1108] Excel generado: periodo={} categorias={} meses={}",
                    period, categories.size(), evolution.size());
            return out.toByteArray();

        } catch (Exception e) {
            log.error("[US-1108] Error generando Excel para periodo={}", period, e);
            throw new RuntimeException("Error generando Excel del dashboard", e);
        }
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private CellStyle createEuroStyle(XSSFWorkbook wb) {
        CellStyle style = wb.createCellStyle();
        DataFormat fmt = wb.createDataFormat();
        style.setDataFormat(fmt.getFormat("#,##0.00 €"));
        return style;
    }

    private CellStyle createHeaderStyle(XSSFWorkbook wb) {
        XSSFCellStyle style = wb.createCellStyle();
        style.setFillForegroundColor(new XSSFColor(
                new byte[]{(byte) MERIDIAN_BLUE_R, (byte) MERIDIAN_BLUE_G, (byte) MERIDIAN_BLUE_B},
                new DefaultIndexedColorMap()));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        XSSFFont font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        return style;
    }

    private CellStyle createTitleStyle(XSSFWorkbook wb) {
        XSSFCellStyle style = wb.createCellStyle();
        XSSFFont font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        font.setColor(new XSSFColor(
                new byte[]{(byte) MERIDIAN_BLUE_R, (byte) MERIDIAN_BLUE_G, (byte) MERIDIAN_BLUE_B},
                new DefaultIndexedColorMap()));
        style.setFont(font);
        return style;
    }

    private void writeRow(Sheet sheet, int rowNum, CellStyle style, String... values) {
        Row row = sheet.createRow(rowNum);
        for (int i = 0; i < values.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(values[i]);
            if (style != null) cell.setCellStyle(style);
        }
    }

    private void writeEuroRow(Sheet sheet, int rowNum, CellStyle euroStyle,
                               String label, Object value, boolean isNumeric) {
        Row row = sheet.createRow(rowNum);
        row.createCell(0).setCellValue(label);
        Cell vc = row.createCell(1);
        if (isNumeric && value instanceof BigDecimal bd) {
            vc.setCellValue(bd.doubleValue());
            vc.setCellStyle(euroStyle);
        } else {
            vc.setCellValue(value != null ? value.toString() : "");
        }
    }

    private double safeDouble(BigDecimal v) {
        return v != null ? v.doubleValue() : 0.0;
    }

    private String formatPeriod(String period) {
        YearMonth ym = YearMonth.parse(period);
        return ym.getMonth().getDisplayName(java.time.format.TextStyle.FULL,
                new java.util.Locale("es", "ES")) + " " + ym.getYear();
    }
}
