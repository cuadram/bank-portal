# LLD-014 — Frontend Angular Dashboard + Exportación PDF/Excel
# BankPortal / Banco Meridian — FEAT-011

## Metadata

| Campo | Valor |
|---|---|
| Documento | LLD-014 |
| Feature | FEAT-011 |
| Sprint | 13 |
| Versión | 1.0 |
| Estado | PENDING APPROVAL — Gate 3 Tech Lead |
| Fecha | 2026-03-22 |

---

## DEBT-020 — DashboardSummaryUseCase.resolvePeriod() validación

```java
public static String resolvePeriod(String param) {
    return switch (param) {
        case "current_month"  -> YearMonth.now().toString();
        case "previous_month" -> YearMonth.now().minusMonths(1).toString();
        default -> {
            if (!param.matches("\\d{4}-\\d{2}"))
                throw new IllegalArgumentException(
                    "Periodo invalido: '" + param + "' — usar YYYY-MM, current_month o previous_month");
            yield param;
        }
    };
}
// GlobalExceptionHandler existente mapea IllegalArgumentException → HTTP 400
```

---

## DEBT-021 — DashboardController imports explícitos

```java
// Sustituir:
import com.experis.sofia.bankportal.dashboard.application.*;
import com.experis.sofia.bankportal.dashboard.application.dto.*;

// Por imports explícitos:
import com.experis.sofia.bankportal.dashboard.application.BudgetAlertService;
import com.experis.sofia.bankportal.dashboard.application.DashboardSummaryUseCase;
import com.experis.sofia.bankportal.dashboard.application.MonthComparisonUseCase;
import com.experis.sofia.bankportal.dashboard.application.MonthlyEvolutionUseCase;
import com.experis.sofia.bankportal.dashboard.application.SpendingCategoryService;
import com.experis.sofia.bankportal.dashboard.application.dto.BudgetAlertDto;
import com.experis.sofia.bankportal.dashboard.application.dto.DashboardSummaryDto;
import com.experis.sofia.bankportal.dashboard.application.dto.MonthComparisonDto;
import com.experis.sofia.bankportal.dashboard.application.dto.MonthlyEvolutionDto;
import com.experis.sofia.bankportal.dashboard.application.dto.SpendingCategoryDto;
import com.experis.sofia.bankportal.dashboard.application.dto.TopMerchantDto;
```

---

## Backend — DashboardExportController

```java
@RestController
@RequestMapping("/api/v1/dashboard/export")
@RequiredArgsConstructor
public class DashboardExportController {

    private final DashboardExportUseCase exportUseCase;

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(defaultValue = "current_month") String period,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        String resolvedPeriod = DashboardSummaryUseCase.resolvePeriod(period);
        byte[] pdf = exportUseCase.generatePdf(userId, resolvedPeriod);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"dashboard-" + resolvedPeriod + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/excel")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(defaultValue = "current_month") String period,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        String resolvedPeriod = DashboardSummaryUseCase.resolvePeriod(period);
        byte[] xlsx = exportUseCase.generateExcel(userId, resolvedPeriod);

        String contentType =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"dashboard-" + resolvedPeriod + ".xlsx\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(xlsx);
    }
}
```

---

## Backend — DashboardExportUseCase

```java
@Service
@RequiredArgsConstructor
public class DashboardExportUseCase {

    private final DashboardSummaryUseCase   summaryUseCase;
    private final SpendingCategoryService   categoryService;
    private final DashboardRepositoryPort   repo;
    private final PdfReportGenerator        pdfGenerator;
    private final ExcelReportGenerator      excelGenerator;

    public byte[] generatePdf(UUID userId, String period) {
        DashboardSummaryDto    summary    = summaryUseCase.getSummary(userId, period);
        List<SpendingCategoryDto> cats    = categoryService.getCategories(userId, period);
        List<TopMerchantDto>   merchants  = repo.findTopMerchants(userId, period, 5);
        return pdfGenerator.generate(period, summary, cats, merchants);
    }

    public byte[] generateExcel(UUID userId, String period) {
        DashboardSummaryDto    summary    = summaryUseCase.getSummary(userId, period);
        List<SpendingCategoryDto> cats    = categoryService.getCategories(userId, period);
        List<MonthlyEvolutionDto> evolution = evolutionFrom(userId);
        return excelGenerator.generate(period, summary, cats, evolution);
    }

    private List<MonthlyEvolutionDto> evolutionFrom(UUID userId) {
        // Reutiliza MonthlyEvolutionUseCase — 6 meses por defecto
        return new MonthlyEvolutionUseCase(summaryUseCase).getEvolution(userId, 6);
    }
}
```

---

## Backend — PdfReportGenerator (OpenPDF)

```java
@Component
public class PdfReportGenerator {

    private static final BaseColor MERIDIAN_BLUE = new BaseColor(27, 58, 107); // #1B3A6B

    public byte[] generate(String period, DashboardSummaryDto summary,
                           List<SpendingCategoryDto> categories,
                           List<TopMerchantDto> merchants) throws IOException {

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 36, 36, 54, 36);
        PdfWriter.getInstance(doc, out);
        doc.open();

        // Cabecera
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, MERIDIAN_BLUE);
        doc.add(new Paragraph("Dashboard Analítico — " + formatPeriod(period), titleFont));
        doc.add(new Paragraph("Banco Meridian · Generado " + LocalDate.now(), 
                 FontFactory.getFont(FontFactory.HELVETICA, 9, BaseColor.GRAY)));
        doc.add(Chunk.NEWLINE);

        // Sección 1 — Resumen
        addSectionTitle(doc, "Resumen financiero");
        PdfPTable summaryTable = new PdfPTable(2);
        addRow(summaryTable, "Ingresos",  formatEuros(summary.totalIncome()));
        addRow(summaryTable, "Gastos",    formatEuros(summary.totalExpenses()));
        addRow(summaryTable, "Saldo neto",formatEuros(summary.netBalance()));
        doc.add(summaryTable);
        doc.add(Chunk.NEWLINE);

        // Sección 2 — Categorías
        addSectionTitle(doc, "Gastos por categoría");
        PdfPTable catTable = new PdfPTable(3);
        catTable.addCell("Categoría"); catTable.addCell("Importe"); catTable.addCell("%");
        for (SpendingCategoryDto c : categories) {
            addRow(catTable, c.category(), formatEuros(c.amount()),
                   String.format("%.1f%%", c.percentage()));
        }
        doc.add(catTable);
        doc.add(Chunk.NEWLINE);

        // Sección 3 — Top comercios
        addSectionTitle(doc, "Top 5 comercios");
        PdfPTable mTable = new PdfPTable(3);
        mTable.addCell("Emisor"); mTable.addCell("Total"); mTable.addCell("Transacciones");
        for (TopMerchantDto m : merchants) {
            addRow(mTable, m.issuer(), formatEuros(m.totalAmount()), String.valueOf(m.count()));
        }
        doc.add(mTable);

        doc.close();
        return out.toByteArray();
    }

    private String formatPeriod(String p) {
        YearMonth ym = YearMonth.parse(p);
        return ym.getMonth().getDisplayName(TextStyle.FULL, new Locale("es", "ES"))
               + " " + ym.getYear();
    }

    private String formatEuros(BigDecimal v) {
        return String.format("%,.2f €", v);
    }
    // addSectionTitle y addRow omitidos por brevedad
}
```

---

## Backend — ExcelReportGenerator (Apache POI)

```java
@Component
public class ExcelReportGenerator {

    public byte[] generate(String period, DashboardSummaryDto summary,
                           List<SpendingCategoryDto> categories,
                           List<MonthlyEvolutionDto> evolution) throws IOException {

        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle euroStyle = wb.createCellStyle();
            DataFormat fmt = wb.createDataFormat();
            euroStyle.setDataFormat(fmt.getFormat("#,##0.00 €"));

            // Hoja 1 — Resumen
            Sheet s1 = wb.createSheet("Resumen");
            writeRow(s1, 0, "Período", period);
            writeEuroRow(s1, 1, "Ingresos",   summary.totalIncome(),   euroStyle);
            writeEuroRow(s1, 2, "Gastos",     summary.totalExpenses(), euroStyle);
            writeEuroRow(s1, 3, "Saldo neto", summary.netBalance(),    euroStyle);

            // Hoja 2 — Categorías
            Sheet s2 = wb.createSheet("Categorías");
            writeHeader(s2, "Categoría", "Importe", "%", "Transacciones");
            int r = 1;
            for (SpendingCategoryDto c : categories) {
                Row row = s2.createRow(r++);
                row.createCell(0).setCellValue(c.category());
                Cell amtCell = row.createCell(1);
                amtCell.setCellValue(c.amount().doubleValue());
                amtCell.setCellStyle(euroStyle);
                row.createCell(2).setCellValue(c.percentage());
                row.createCell(3).setCellValue(c.count());
            }

            // Hoja 3 — Evolución
            Sheet s3 = wb.createSheet("Evolución");
            writeHeader(s3, "Año", "Mes", "Ingresos", "Gastos", "Saldo neto");
            int re = 1;
            for (MonthlyEvolutionDto e : evolution) {
                Row row = s3.createRow(re++);
                row.createCell(0).setCellValue(e.year());
                row.createCell(1).setCellValue(e.month());
                Cell ic = row.createCell(2); ic.setCellValue(e.totalIncome().doubleValue());   ic.setCellStyle(euroStyle);
                Cell ec = row.createCell(3); ec.setCellValue(e.totalExpenses().doubleValue()); ec.setCellStyle(euroStyle);
                Cell nc = row.createCell(4); nc.setCellValue(e.netBalance().doubleValue());    nc.setCellStyle(euroStyle);
            }

            wb.write(out);
            return out.toByteArray();
        }
    }
    // writeRow, writeEuroRow, writeHeader helpers omitidos por brevedad
}
```

---

## Frontend Angular — archivos clave

### angular.json (resumen)
```json
{
  "projects": {
    "bankportal": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist/bankportal",
            "index": "src/index.html",
            "main": "src/main.ts",
            "tsConfig": "tsconfig.app.json"
          }
        }
      }
    }
  }
}
```

### jwt.interceptor.ts
```typescript
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('access_token');
    if (token) {
      req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
    return next.handle(req);
  }
}
```

### auth.guard.ts
```typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}
  canActivate(): boolean {
    if (localStorage.getItem('access_token')) return true;
    this.router.navigate(['/login']);
    return false;
  }
}
```

### dashboard.service.ts (fragmento)
```typescript
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private base = '/api/v1/dashboard';

  getSummary(period = 'current_month'): Observable<DashboardSummary | null> {
    return this.http.get<DashboardSummary>(`${this.base}/summary`, { params: { period } })
      .pipe(catchError(() => of(null)));
  }

  downloadPdf(period = 'current_month'): void {
    this.http.get(`${this.base}/export/pdf`, {
      params: { period }, responseType: 'blob'
    }).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `dashboard-${period}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
  // getCategories, getEvolution, getComparison, getAlerts, downloadExcel similares
}
```

---

## pom.xml — nueva dependencia Apache POI

```xml
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.3.0</version>
</dependency>
```

---

*SOFIA Architect Agent — Step 3 — BankPortal Sprint 13 — FEAT-011 — 2026-03-22 — v1.0*
