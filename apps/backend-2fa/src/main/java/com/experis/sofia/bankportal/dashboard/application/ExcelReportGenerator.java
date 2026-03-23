package com.experis.sofia.bankportal.dashboard.application;

import com.experis.sofia.bankportal.dashboard.application.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.stereotype.Component;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

/**
 * RV-014 (Sprint 14): catch específico IOException.
 */
@Slf4j
@Component
public class ExcelReportGenerator {

    public byte[] generate(String period, DashboardSummaryDto summary,
                           List<SpendingCategoryDto> categories,
                           List<MonthlyEvolutionDto> evolution) {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle euro   = euroStyle(wb);
            CellStyle header = headerStyle(wb);
            CellStyle title  = titleStyle(wb);

            XSSFSheet s1 = wb.createSheet("Resumen");
            s1.setColumnWidth(0, 6000); s1.setColumnWidth(1, 5000);
            Cell tc = s1.createRow(0).createCell(0);
            tc.setCellValue("Dashboard Analítico — " + fmtPeriod(period)); tc.setCellStyle(title);
            s1.addMergedRegion(new CellRangeAddress(0,0,0,1));
            hRow(s1, 2, header, "Campo","Valor");
            sRow(s1, 3, "Período", period);
            eRow(s1, 4, euro, "Ingresos del mes",  summary.totalIncome());
            eRow(s1, 5, euro, "Gastos del mes",    summary.totalExpenses());
            eRow(s1, 6, euro, "Saldo neto",        summary.netBalance());
            sRow(s1, 7, "Nº transacciones", String.valueOf(summary.transactionCount()));

            XSSFSheet s2 = wb.createSheet("Categorías");
            s2.setColumnWidth(0,5000); s2.setColumnWidth(1,4000); s2.setColumnWidth(2,3000); s2.setColumnWidth(3,4000);
            hRow(s2, 0, header, "Categoría","Importe (€)","% del total","Transacciones");
            int r2 = 1;
            for (SpendingCategoryDto c : categories) {
                Row row = s2.createRow(r2++);
                row.createCell(0).setCellValue(c.category());
                Cell a = row.createCell(1); a.setCellValue(safe(c.amount())); a.setCellStyle(euro);
                row.createCell(2).setCellValue(Math.round(c.percentage()*10.0)/10.0);
                row.createCell(3).setCellValue(c.count());
            }

            XSSFSheet s3 = wb.createSheet("Evolución");
            s3.setColumnWidth(0,2000); s3.setColumnWidth(1,2000); s3.setColumnWidth(2,4500); s3.setColumnWidth(3,4500); s3.setColumnWidth(4,4500);
            hRow(s3, 0, header, "Año","Mes","Ingresos (€)","Gastos (€)","Saldo neto (€)");
            int r3 = 1;
            for (MonthlyEvolutionDto e : evolution) {
                Row row = s3.createRow(r3++);
                row.createCell(0).setCellValue(e.year()); row.createCell(1).setCellValue(e.month());
                Cell ic = row.createCell(2); ic.setCellValue(safe(e.totalIncome()));   ic.setCellStyle(euro);
                Cell gc = row.createCell(3); gc.setCellValue(safe(e.totalExpenses())); gc.setCellStyle(euro);
                Cell nc = row.createCell(4); nc.setCellValue(safe(e.netBalance()));    nc.setCellStyle(euro);
            }

            wb.write(out);
            log.info("[US-1108] Excel periodo={} categorias={}", period, categories.size());
            return out.toByteArray();

        } catch (IOException e) {   // RV-014
            log.error("[US-1108] Error Excel periodo={}", period, e);
            throw new ExcelGenerationException("Error generando Excel", e);
        }
    }

    private void hRow(Sheet s, int n, CellStyle st, String... vals) {
        Row row = s.createRow(n);
        for (int i = 0; i < vals.length; i++) { Cell c = row.createCell(i); c.setCellValue(vals[i]); if (st!=null) c.setCellStyle(st); }
    }
    private void sRow(Sheet s, int n, String label, String value) {
        Row row = s.createRow(n); row.createCell(0).setCellValue(label); row.createCell(1).setCellValue(value);
    }
    private void eRow(Sheet s, int n, CellStyle st, String label, BigDecimal value) {
        Row row = s.createRow(n); row.createCell(0).setCellValue(label);
        Cell vc = row.createCell(1); vc.setCellValue(safe(value)); vc.setCellStyle(st);
    }
    private CellStyle euroStyle(XSSFWorkbook wb) { CellStyle s = wb.createCellStyle(); s.setDataFormat(wb.createDataFormat().getFormat("#,##0.00 €")); return s; }
    private CellStyle headerStyle(XSSFWorkbook wb) {
        XSSFCellStyle s = wb.createCellStyle();
        s.setFillForegroundColor(new XSSFColor(new byte[]{27,58,107}, new DefaultIndexedColorMap()));
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        XSSFFont f = wb.createFont(); f.setBold(true); f.setColor(IndexedColors.WHITE.getIndex()); s.setFont(f); return s;
    }
    private CellStyle titleStyle(XSSFWorkbook wb) {
        XSSFCellStyle s = wb.createCellStyle();
        XSSFFont f = wb.createFont(); f.setBold(true); f.setFontHeightInPoints((short)14);
        f.setColor(new XSSFColor(new byte[]{27,58,107}, new DefaultIndexedColorMap())); s.setFont(f); return s;
    }
    private double safe(BigDecimal v) { return v != null ? v.doubleValue() : 0.0; }
    private String fmtPeriod(String p) {
        YearMonth ym = YearMonth.parse(p);
        return ym.getMonth().getDisplayName(java.time.format.TextStyle.FULL, new java.util.Locale("es","ES")) + " " + ym.getYear();
    }

    public static class ExcelGenerationException extends RuntimeException {
        public ExcelGenerationException(String m, Throwable c) { super(m, c); }
    }
}
