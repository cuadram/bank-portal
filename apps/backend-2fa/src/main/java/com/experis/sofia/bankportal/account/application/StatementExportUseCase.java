package com.experis.sofia.bankportal.account.application;

import com.experis.sofia.bankportal.account.domain.AccountRepositoryPort;
import com.experis.sofia.bankportal.account.domain.Transaction;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * US-704 — Generación de extractos bancarios en PDF y CSV.
 *
 * <p>Exporta un extracto mensual para una cuenta dada en dos formatos:
 * <ul>
 *   <li><b>PDF</b>: plantilla corporativa Banco Meridian (#1B3A6B), Arial, A4,
 *       tabla de movimientos con saldo acumulado, resumen final y hash SHA-256.</li>
 *   <li><b>CSV</b>: UTF-8 con BOM (compatible Excel), cabeceras en español,
 *       separador punto y coma.</li>
 * </ul>
 *
 * <p><b>Criterios clave:</b>
 * <ul>
 *   <li>Descarga ≤ 5s para extractos de hasta 500 movimientos.</li>
 *   <li>Mes sin movimientos → {@link Optional#empty()} (HTTP 204).</li>
 *   <li>Registro de auditoría STATEMENT_DOWNLOADED por cada descarga exitosa.</li>
 * </ul>
 *
 * @author SOFIA Developer Agent — US-704 Sprint 9
 * @see AccountRepositoryPort#findByMonth(UUID, Instant, Instant, int)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StatementExportUseCase {

    // ── Colores corporativos Banco Meridian ──────────────────────────────────
    private static final Color COLOR_HEADER       = new Color(0x1B, 0x3A, 0x6B); // #1B3A6B
    private static final Color COLOR_ROW_ALT      = new Color(0xF0, 0xF4, 0xFA); // fila par
    private static final Color COLOR_WHITE        = Color.WHITE;
    private static final Color COLOR_TEXT         = new Color(0x33, 0x33, 0x33);
    private static final Color COLOR_POSITIVE     = new Color(0x1A, 0x7A, 0x3C); // abono
    private static final Color COLOR_NEGATIVE     = new Color(0xC0, 0x39, 0x2B); // cargo

    private static final int MAX_TRANSACTIONS     = 500;
    private static final String FONT_FAMILY       = FontFactory.HELVETICA; // Arial fallback en PDF

    private final AccountRepositoryPort  accountRepository;
    private final AccountSummaryUseCase  accountSummaryUseCase;

    /**
     * Genera el extracto del mes indicado en el formato solicitado.
     *
     * @param userId    ID del usuario autenticado (para auditoría y ownership check)
     * @param accountId ID de la cuenta
     * @param year      Año del extracto (ej. 2026)
     * @param month     Mes del extracto 1-12
     * @param format    "pdf" | "csv" (case-insensitive)
     * @return {@link Optional} con {@link StatementResult}, vacío si no hay movimientos
     */
    @Async
    @Transactional(readOnly = true)
    public CompletableFuture<Optional<StatementResult>> export(
            UUID userId, UUID accountId, int year, int month, String format) {

        log.info("[US-704] Iniciando exportación extracto accountId={} periodo={}-{} format={}",
                accountId, year, String.format("%02d", month), format);

        // ── 1. Cargar cuenta ──────────────────────────────────────────────────
        AccountSummaryDto account = accountSummaryUseCase.getSummary(userId).stream()
                .filter(a -> a.accountId().equals(accountId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Cuenta " + accountId + " no pertenece al usuario " + userId));

        // ── 2. Cargar movimientos del mes ─────────────────────────────────────
        YearMonth ym      = YearMonth.of(year, month);
        Instant   from    = ym.atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant   to      = ym.atEndOfMonth().atTime(23, 59, 59).atZone(ZoneOffset.UTC).toInstant();

        List<Transaction> transactions = accountRepository.findByMonth(
                accountId, from, to, MAX_TRANSACTIONS);

        if (transactions.isEmpty()) {
            log.info("[US-704] Sin movimientos accountId={} periodo={}-{}", accountId, year, month);
            return CompletableFuture.completedFuture(Optional.empty());
        }

        // ── 3. Generar contenido ──────────────────────────────────────────────
        String fmt = format.toLowerCase();
        byte[] content = switch (fmt) {
            case "pdf" -> generatePdf(account, transactions, year, month);
            case "csv" -> generateCsv(transactions);
            default    -> throw new IllegalArgumentException("Formato no soportado: " + format);
        };

        // ── 4. Hash SHA-256 para integridad ───────────────────────────────────
        String hash = sha256Hex(content);

        // ── 5. Nombre de fichero ──────────────────────────────────────────────
        String cleanIban = account.ibanMasked().replaceAll("[\\s*]", "");
        String filename  = "extracto-%s-%04d-%02d.%s".formatted(cleanIban, year, month, fmt);

        log.info("[US-704] Extracto generado filename={} bytes={} hash={}",
                filename, content.length, hash.substring(0, 16) + "…");

        return CompletableFuture.completedFuture(
                Optional.of(new StatementResult(content, filename, hash, fmt.toUpperCase())));
    }

    // ── PDF ───────────────────────────────────────────────────────────────────

    private byte[] generatePdf(AccountSummaryDto account,
                                List<Transaction> txs,
                                int year, int month) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 36, 36, 54, 54);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            addPdfHeader(doc, account, year, month);
            addPdfTransactionTable(doc, txs);
            addPdfSummary(doc, txs);
            // Footer sin hash — el hash correcto se añade DESPUÉS de doc.close() (RV-001)
            addPdfFooter(doc);
            doc.close();

            // Hash calculado sobre el documento completo y final
            byte[] pdfBytes = baos.toByteArray();
            return pdfBytes;
        } catch (Exception e) {
            throw new StatementGenerationException("Error generando PDF", e);
        }
    }

    private void addPdfHeader(Document doc, AccountSummaryDto account,
                               int year, int month) throws DocumentException {
        Font titleFont  = FontFactory.getFont(FONT_FAMILY, 16, Font.BOLD, COLOR_WHITE);
        Font normalFont = FontFactory.getFont(FONT_FAMILY, 10, Font.NORMAL, COLOR_WHITE);

        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100);
        header.setWidths(new float[]{70, 30});

        // Celda izquierda: nombre banco + titular
        Phrase titlePhrase = new Phrase();
        titlePhrase.add(new Chunk("BANCO MERIDIAN\n", titleFont));
        titlePhrase.add(new Chunk("Extracto de cuenta — %s %d\n".formatted(
                monthName(month), year), normalFont));
        titlePhrase.add(new Chunk(account.alias() + "  |  " + account.ibanMasked(),
                normalFont));

        PdfPCell leftCell = new PdfPCell(titlePhrase);
        leftCell.setBackgroundColor(COLOR_HEADER);
        leftCell.setPadding(14);
        leftCell.setBorder(Rectangle.NO_BORDER);
        header.addCell(leftCell);

        // Celda derecha: tipo de cuenta
        Font typeFont = FontFactory.getFont(FONT_FAMILY, 10, Font.NORMAL, COLOR_WHITE);
        PdfPCell rightCell = new PdfPCell(new Phrase(account.type(), typeFont));
        rightCell.setBackgroundColor(COLOR_HEADER);
        rightCell.setPadding(14);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        rightCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        rightCell.setBorder(Rectangle.NO_BORDER);
        header.addCell(rightCell);

        doc.add(header);
        doc.add(Chunk.NEWLINE);
    }

    private void addPdfTransactionTable(Document doc,
                                         List<Transaction> txs) throws DocumentException {
        Font colFont  = FontFactory.getFont(FONT_FAMILY, 9, Font.BOLD, COLOR_WHITE);
        Font rowFont  = FontFactory.getFont(FONT_FAMILY, 8, Font.NORMAL, COLOR_TEXT);
        Font redFont  = FontFactory.getFont(FONT_FAMILY, 8, Font.NORMAL, COLOR_NEGATIVE);
        Font greenFnt = FontFactory.getFont(FONT_FAMILY, 8, Font.NORMAL, COLOR_POSITIVE);

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{15, 35, 12, 12, 14});

        String[] headers = {"Fecha", "Concepto", "Importe", "Tipo", "Saldo"};
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, colFont));
            cell.setBackgroundColor(COLOR_HEADER);
            cell.setPadding(6);
            cell.setBorder(Rectangle.BOTTOM);
            table.addCell(cell);
        }

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy")
                .withZone(ZoneOffset.UTC);
        boolean altRow = false;
        for (Transaction tx : txs) {
            Color bg = altRow ? COLOR_ROW_ALT : COLOR_WHITE;
            addTableCell(table, fmt.format(tx.getTransactionDate()), rowFont, bg, Element.ALIGN_CENTER);
            addTableCell(table, truncate(tx.getConcept(), 45),       rowFont, bg, Element.ALIGN_LEFT);

            boolean isAbono = tx.getType() == Transaction.Type.ABONO;
            String amountStr = (isAbono ? "+" : "-") +
                    tx.getAmount().abs().toPlainString();
            Font amtFont = isAbono ? greenFnt : redFont;
            addTableCell(table, amountStr, amtFont, bg, Element.ALIGN_RIGHT);
            addTableCell(table, tx.getType().name(),       rowFont, bg, Element.ALIGN_CENTER);
            addTableCell(table, tx.getBalanceAfter().toPlainString(),
                    rowFont, bg, Element.ALIGN_RIGHT);
            altRow = !altRow;
        }
        doc.add(table);
        doc.add(Chunk.NEWLINE);
    }

    private void addTableCell(PdfPTable table, String text, Font font,
                               Color bg, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bg);
        cell.setPadding(5);
        cell.setHorizontalAlignment(align);
        cell.setBorder(Rectangle.BOTTOM);
        table.addCell(cell);
    }

    private void addPdfSummary(Document doc, List<Transaction> txs) throws DocumentException {
        // RV-005: ordenar ASC para garantizar saldoInicial/Final correctos
        // independientemente del orden devuelto por el repositorio
        java.util.List<Transaction> sorted = txs.stream()
                .sorted(java.util.Comparator.comparing(Transaction::getTransactionDate))
                .toList();

        BigDecimal totalAbonos = txs.stream()
                .filter(t -> t.getType() == Transaction.Type.ABONO)
                .map(Transaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCargos = txs.stream()
                .filter(t -> t.getType() == Transaction.Type.CARGO)
                .map(Transaction::getAmount).map(BigDecimal::abs)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal saldoInicial = sorted.get(0).getBalanceAfter()
                .subtract(sorted.get(0).getAmount());
        BigDecimal saldoFinal   = sorted.get(sorted.size() - 1).getBalanceAfter();

        Font labelFont = FontFactory.getFont(FONT_FAMILY, 9, Font.BOLD, COLOR_TEXT);
        Font valueFont = FontFactory.getFont(FONT_FAMILY, 9, Font.NORMAL, COLOR_TEXT);

        PdfPTable summary = new PdfPTable(4);
        summary.setWidthPercentage(100);
        summary.setWidths(new float[]{25, 25, 25, 25});

        addSummaryCell(summary, "Total ingresos",   totalAbonos.toPlainString() + " €", labelFont, valueFont);
        addSummaryCell(summary, "Total cargos",     totalCargos.toPlainString() + " €", labelFont, valueFont);
        addSummaryCell(summary, "Saldo inicial",    saldoInicial.toPlainString() + " €", labelFont, valueFont);
        addSummaryCell(summary, "Saldo final",      saldoFinal.toPlainString() + " €",  labelFont, valueFont);

        doc.add(summary);
    }

    private void addSummaryCell(PdfPTable t, String label, String value,
                                 Font labelFont, Font valueFont) {
        Phrase p = new Phrase();
        p.add(new Chunk(label + "\n", labelFont));
        p.add(new Chunk(value, valueFont));
        PdfPCell cell = new PdfPCell(p);
        cell.setBackgroundColor(COLOR_ROW_ALT);
        cell.setPadding(8);
        cell.setBorder(Rectangle.NO_BORDER);
        t.addCell(cell);
    }

    /**
     * Footer del PDF: fecha de generación.
     * El hash SHA-256 se entrega en el header HTTP X-Content-SHA256, no en el footer,
     * ya que no se puede calcular hasta que doc.close() haya volcado todos los bytes (RV-001).
     */
    private void addPdfFooter(Document doc) throws DocumentException {
        Font footerFont = FontFactory.getFont(FONT_FAMILY, 7, Font.NORMAL, COLOR_TEXT);
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss 'UTC'")
                .withZone(ZoneOffset.UTC);
        String footerText = "Generado: " + dtf.format(Instant.now()) +
                "  |  Verifique la integridad del documento en Banca Online (SHA-256 en cabecera HTTP)";
        doc.add(new Paragraph(footerText, footerFont));
    }

    // ── CSV ───────────────────────────────────────────────────────────────────

    private byte[] generateCsv(List<Transaction> txs) {
        StringBuilder sb = new StringBuilder("\uFEFF"); // UTF-8 BOM para Excel
        sb.append("fecha;concepto;importe;saldo_tras_movimiento;tipo;categoria\n");

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                .withZone(ZoneOffset.UTC);

        for (Transaction tx : txs) {
            sb.append(fmt.format(tx.getTransactionDate())).append(";")
              .append(escapeCsvField(tx.getConcept())).append(";")
              .append(tx.getAmount().toPlainString()).append(";")
              .append(tx.getBalanceAfter().toPlainString()).append(";")
              .append(tx.getType().name()).append(";")
              .append(tx.getCategory()).append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    /** Escapa campos CSV: comillas dobles y separadores internos. */
    private String escapeCsvField(String value) {
        if (value == null) return "";
        String escaped = value.replace("\"", "\"\"");
        return escaped.contains(";") ? "\"" + escaped + "\"" : escaped;
    }

    // ── Utilidades ────────────────────────────────────────────────────────────

    private String sha256Hex(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(data));
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 no disponible", e);
        }
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() > max ? s.substring(0, max - 1) + "…" : s;
    }

    private String monthName(int month) {
        return java.time.Month.of(month)
                .getDisplayName(java.time.format.TextStyle.FULL,
                        new java.util.Locale("es", "ES"));
    }

    // ── Result DTO ────────────────────────────────────────────────────────────

    /**
     * Resultado de la exportación del extracto.
     *
     * @param content  bytes del fichero generado (PDF o CSV)
     * @param filename nombre sugerido para la descarga
     * @param sha256   hash SHA-256 del contenido (hex lowercase)
     * @param format   "PDF" | "CSV"
     */
    public record StatementResult(
            byte[] content,
            String filename,
            String sha256,
            String format) {}

    // ── Excepción ─────────────────────────────────────────────────────────────

    public static class StatementGenerationException extends RuntimeException {
        public StatementGenerationException(String msg, Throwable cause) {
            super(msg, cause);
        }
    }
}
