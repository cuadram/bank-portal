# LLD Backend — Low Level Design
## FEAT-018: Exportación de Movimientos — Backend Java 21 / Spring Boot 3.3.4
**Sprint:** 20 | **SOFIA Step:** 3 | **Fecha:** 2026-03-30  

---

## 1. Estructura de paquetes

```
apps/backend-2fa/src/main/java/.../
└── export/
    ├── controller/
    │   └── ExportController.java
    ├── service/
    │   ├── ExportService.java
    │   ├── ExportAuditService.java
    │   └── generator/
    │       ├── DocumentGenerator.java          (interface)
    │       ├── PdfDocumentGenerator.java
    │       └── CsvDocumentGenerator.java
    ├── repository/
    │   └── ExportAuditLogRepository.java
    ├── domain/
    │   ├── ExportAuditLog.java                 (entity)
    │   └── ExportFormat.java                   (enum: PDF, CSV)
    └── dto/
        ├── ExportRequest.java
        └── ExportPreviewResponse.java
```

---

## 2. Interface DocumentGenerator

```java
public interface DocumentGenerator<T> {
    byte[] generate(List<Transaction> transactions, T metadata) throws ExportGenerationException;
    String getContentType();
    String getFileExtension();
}
```

---

## 3. ExportController

```java
@RestController
@RequestMapping("/api/v1/accounts/{accountId}/exports")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    @PostMapping("/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @PathVariable UUID accountId,
            @Valid @RequestBody ExportRequest request,
            @AuthenticationPrincipal JwtAuthUser principal,
            HttpServletRequest httpRequest) {

        request.setFormato(ExportFormat.PDF);
        byte[] content = exportService.export(accountId, request, principal, httpRequest);
        String filename = "movimientos_" + accountId.toString().substring(24) + "_"
                + LocalDate.now() + ".pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "application/pdf")
                .body(content);
    }

    @PostMapping("/csv")
    public ResponseEntity<byte[]> exportCsv(
            @PathVariable UUID accountId,
            @Valid @RequestBody ExportRequest request,
            @AuthenticationPrincipal JwtAuthUser principal,
            HttpServletRequest httpRequest) {

        request.setFormato(ExportFormat.CSV);
        byte[] content = exportService.export(accountId, request, principal, httpRequest);
        String filename = "movimientos_" + accountId.toString().substring(24) + "_"
                + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .body(content);
    }

    @GetMapping("/preview")
    public ResponseEntity<ExportPreviewResponse> preview(
            @PathVariable UUID accountId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(defaultValue = "TODOS") String tipoMovimiento,
            @AuthenticationPrincipal JwtAuthUser principal) {

        long count = exportService.countExportable(accountId, fechaDesde, fechaHasta, tipoMovimiento);
        return ResponseEntity.ok(new ExportPreviewResponse(count, count > 500));
    }
}
```

---

## 4. ExportRequest DTO

```java
@Data
public class ExportRequest {
    @NotNull
    @PastOrPresent
    private LocalDate fechaDesde;

    @NotNull
    @PastOrPresent
    private LocalDate fechaHasta;

    @Pattern(regexp = "TODOS|TRANSFERENCIA_EMITIDA|TRANSFERENCIA_RECIBIDA|DOMICILIACION|PAGO_TARJETA|INGRESO|COMISION")
    private String tipoMovimiento = "TODOS";

    private ExportFormat formato; // set by controller
}
```

---

## 5. ExportService

```java
@Service
@RequiredArgsConstructor
public class ExportService {

    private final TransactionJpaRepository transactionRepository;
    private final PdfDocumentGenerator pdfGenerator;
    private final CsvDocumentGenerator csvGenerator;
    private final ExportAuditService auditService;

    private static final int MAX_RECORDS = 500;

    public byte[] export(UUID accountId, ExportRequest request,
                         JwtAuthUser principal, HttpServletRequest httpRequest) {
        // 1. Validar rango (12 meses máximo — PSD2 Art.47)
        if (request.getFechaDesde().isBefore(LocalDate.now().minusMonths(12))) {
            throw new ExportRangeException("Rango máximo de exportación: 12 meses");
        }

        // 2. Fetch movimientos
        List<Transaction> transactions = transactionRepository
                .findByAccountIdAndFilters(accountId, request.getFechaDesde(),
                        request.getFechaHasta(), request.getTipoMovimiento(), MAX_RECORDS + 1);

        if (transactions.size() > MAX_RECORDS) {
            throw new ExportLimitExceededException("Máximo " + MAX_RECORDS + " registros por exportación");
        }

        // 3. Generar documento
        DocumentGenerator<?> generator = switch (request.getFormato()) {
            case PDF -> pdfGenerator;
            case CSV -> csvGenerator;
        };

        byte[] content = generator.generate(transactions, buildMetadata(accountId, request));

        // 4. Audit asíncrono (fire-and-forget)
        auditService.recordAsync(accountId, request, principal, httpRequest,
                transactions.size(), extractHash(content, request.getFormato()));

        return content;
    }

    public long countExportable(UUID accountId, LocalDate desde, LocalDate hasta, String tipo) {
        return transactionRepository.countByAccountIdAndFilters(accountId, desde, hasta, tipo);
    }

    private String extractHash(byte[] content, ExportFormat format) {
        if (format != ExportFormat.PDF) return null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            return null;
        }
    }
}
```

---

## 6. Flyway V21 — export_audit_log

```sql
-- V21__export_audit_log.sql
CREATE TABLE export_audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    timestamp_utc   TIMESTAMPTZ NOT NULL DEFAULT now(),
    iban            VARCHAR(34) NOT NULL,
    fecha_desde     DATE NOT NULL,
    fecha_hasta     DATE NOT NULL,
    tipo_movimiento VARCHAR(50) NOT NULL DEFAULT 'TODOS',
    formato         VARCHAR(10) NOT NULL CHECK (formato IN ('PDF','CSV')),
    num_registros   INT NOT NULL,
    ip_origen       INET,
    user_agent      VARCHAR(500),
    hash_sha256     VARCHAR(64),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_export_audit_user_date
    ON export_audit_log(user_id, timestamp_utc DESC);

COMMENT ON TABLE export_audit_log IS
    'Audit log de exportaciones de movimientos — Retención 7 años (GDPR Art.17§3b + PCI-DSS Req.10)';
```

---

## 7. Mapa de tipos BD → Java (LA-019-13 aplicada)

| Columna BD | Tipo PostgreSQL | Tipo Java |
|---|---|---|
| `timestamp_utc` | `TIMESTAMPTZ` | `OffsetDateTime` |
| `fecha_desde` | `DATE` | `LocalDate` |
| `id` | `UUID` | `UUID` |
| `ip_origen` | `INET` | `String` (InetAddress.toString()) |

---

## 8. Dependencia Maven — Apache PDFBox

```xml
<!-- pom.xml — módulo backend-2fa -->
<dependency>
    <groupId>org.apache.pdfbox</groupId>
    <artifactId>pdfbox</artifactId>
    <version>3.0.2</version>
</dependency>
```

---

*Generado por SOFIA v2.3 · Architect · LLD Backend · Sprint 20 · 2026-03-30*
