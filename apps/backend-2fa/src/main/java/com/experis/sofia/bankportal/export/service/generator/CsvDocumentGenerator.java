package com.experis.sofia.bankportal.export.service.generator;

import com.experis.sofia.bankportal.account.domain.Transaction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Generador CSV UTF-8 BOM, separador ';', coma decimal — estándar europeo ES.
 * RN-F018-05..08: compatible con Excel en español.
 * PCI-DSS Req.3.4: sin PAN completo.
 * HOTFIX-S20: paquete corregido + API Transaction real:
 *   getTransactionDate() (Instant), getConcept(), getAmount(), getBalanceAfter(), getType().
 *   Transaction.Type enum: CARGO | ABONO — no existe getCurrency() ni getAccountingDate().
 */
@Slf4j
@Component
public class CsvDocumentGenerator implements DocumentGenerator {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.of("Europe/Madrid"));

    private static final String HEADER =
            "fecha_valor;concepto;importe;divisa;saldo;tipo_movimiento;iban_cuenta";

    @Override
    public byte[] generate(List<Transaction> transactions, ExportMetadata metadata) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        // UTF-8 BOM (EF BB BF) — RN-F018-05
        baos.write(0xEF);
        baos.write(0xBB);
        baos.write(0xBF);

        try (Writer writer = new OutputStreamWriter(baos, StandardCharsets.UTF_8)) {
            writer.write(HEADER);
            writer.write("\r\n");

            for (Transaction tx : transactions) {
                writer.write(buildRow(tx, metadata.getIban()));
                writer.write("\r\n");
            }
        } catch (IOException e) {
            log.error("Error generando CSV", e);
            throw new ExportGenerationException("Error generando CSV: " + e.getMessage(), e);
        }

        log.debug("CSV generado: {} bytes, {} registros", baos.size(), transactions.size());
        return baos.toByteArray();
    }

    @Override public String getContentType()   { return "text/csv; charset=UTF-8"; }
    @Override public String getFileExtension() { return "csv"; }

    private String buildRow(Transaction tx, String iban) {
        // RN-F018-06: coma decimal, sin separador de miles
        String importe = String.format("%.2f", tx.getAmount()).replace('.', ',');
        String saldo   = String.format("%.2f", tx.getBalanceAfter()).replace('.', ',');
        // Transaction.Type.CARGO → "CARGO", .ABONO → "ABONO"
        String tipo = tx.getType() != null ? tx.getType().name() : "";

        return String.join(";",
                safe(DATE_FMT.format(tx.getTransactionDate())),
                escapeCsv(maskPan(tx.getConcept())),
                safe(importe),
                "EUR",        // divisa siempre EUR — sin getCurrency() en entidad real
                safe(saldo),
                safe(tipo),
                safe(maskIban(iban))
        );
    }

    /** PCI-DSS Req.3.4: enmascara PAN. */
    private String maskPan(String text) {
        if (text == null) return "";
        return text.replaceAll("\\b\\d{12,15}(\\d{4})\\b", "****$1");
    }

    private String maskIban(String iban) {
        if (iban == null || iban.length() < 8) return iban != null ? iban : "";
        return iban.substring(0, 4) + "****" + iban.substring(iban.length() - 8);
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        if (val.contains(";") || val.contains("\"") || val.contains("\n")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }

    private String safe(String val) {
        return val == null ? "" : val.trim();
    }
}
