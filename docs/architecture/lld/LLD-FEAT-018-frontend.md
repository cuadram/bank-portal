# LLD Frontend — Low Level Design
## FEAT-018: Exportación de Movimientos — Angular 17
**Sprint:** 20 | **SOFIA Step:** 3 | **Fecha:** 2026-03-30  

---

## 1. Estructura de módulo (Standalone Components)

```
apps/frontend-portal/src/app/features/export/
├── export.module.ts                         (LazyLoaded)
├── components/
│   ├── export-panel/
│   │   ├── export-panel.component.ts        (host del panel/modal)
│   │   ├── export-panel.component.html
│   │   └── export-panel.component.scss
│   ├── export-filter-form/
│   │   ├── export-filter-form.component.ts  (filtros + preview)
│   │   ├── export-filter-form.component.html
│   │   └── export-filter-form.component.scss
│   └── export-format-selector/
│       ├── export-format-selector.component.ts
│       └── export-format-selector.component.html
├── services/
│   └── export.service.ts                    (HTTP client)
├── models/
│   ├── export-request.model.ts
│   └── export-preview.model.ts
└── index.ts
```

---

## 2. ExportService (Angular)

```typescript
@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly base = '/api/v1/accounts';

  constructor(private http: HttpClient) {}

  preview(accountId: string, filters: ExportFilters): Observable<ExportPreviewResponse> {
    const params = new HttpParams()
      .set('fechaDesde', filters.fechaDesde)
      .set('fechaHasta', filters.fechaHasta)
      .set('tipoMovimiento', filters.tipoMovimiento);
    return this.http.get<ExportPreviewResponse>(
      `${this.base}/${accountId}/exports/preview`, { params }
    );
  }

  exportDocument(accountId: string, request: ExportRequest): Observable<Blob> {
    const format = request.formato.toLowerCase(); // 'pdf' | 'csv'
    return this.http.post(
      `${this.base}/${accountId}/exports/${format}`,
      request,
      { responseType: 'blob' }
    );
  }

  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

---

## 3. ExportPanelComponent

```typescript
@Component({
  selector: 'app-export-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,  // NO OnPush — LA-019-14
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule,
            ExportFilterFormComponent, ExportFormatSelectorComponent]
})
export class ExportPanelComponent {
  @Input() accountId!: string;

  state: 'filters' | 'loading' | 'error' = 'filters';
  selectedFormat: 'PDF' | 'CSV' = 'PDF';
  previewCount = 0;
  tooManyRecords = false;

  constructor(
    private exportService: ExportService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<ExportPanelComponent>
  ) {}

  onFiltersChange(filters: ExportFilters): void {
    // debounceTime(300) aplicado en child component
    this.exportService.preview(this.accountId, filters).subscribe({
      next: (res) => {
        this.previewCount = res.count;
        this.tooManyRecords = res.exceedsLimit;
      }
    });
  }

  onExport(filters: ExportFilters): void {
    if (this.tooManyRecords) return;
    this.state = 'loading';
    const request: ExportRequest = { ...filters, formato: this.selectedFormat };
    this.exportService.exportDocument(this.accountId, request).subscribe({
      next: (blob) => {
        const ext = this.selectedFormat.toLowerCase();
        const filename = `movimientos_${this.accountId.slice(-8)}_${new Date().toISOString().slice(0,10)}.${ext}`;
        this.exportService.downloadBlob(blob, filename);
        this.dialogRef.close();
        this.snackBar.open(`Extracto ${this.selectedFormat} descargado`, '✓', { duration: 3500 });
      },
      error: () => {
        this.state = 'error';
        this.snackBar.open('Error al generar el extracto. Inténtalo de nuevo.', '✕',
          { duration: 4000, panelClass: 'snack-error' });
      }
    });
  }
}
```

---

## 4. Integración en MovementsComponent

```typescript
// movements.component.ts — añadir botón export
onExportClick(): void {
  this.dialog.open(ExportPanelComponent, {
    width: '480px',
    data: { accountId: this.accountId },
    autoFocus: true,
    restoreFocus: true  // WCAG: foco vuelve al botón que abrió el modal
  });
}
```

---

## 5. Registro en app-routing.module.ts (LA-019-10 aplicada)

```typescript
// app-routing.module.ts
{
  path: 'movements',
  loadChildren: () => import('./features/movements/movements.module')
    .then(m => m.MovementsModule)
  // ExportPanelComponent se carga como Dialog desde MovementsModule
  // NO requiere ruta separada — es un MatDialog
}
```

**Nota LA-019-10:** ExportPanelComponent se carga vía MatDialog desde MovementsModule — no requiere entrada en router. Sin riesgo de módulo no registrado en routing.

---

## 6. Checklist pre-desarrollo (lecciones aprendidas aplicadas)

| Lección | Check | Acción |
|---|---|---|
| LA-019-10 | ✅ | ExportModule declarado en MovementsModule imports |
| LA-019-11 | ✅ | Sin @Input params de ruta — accountId vía @Input directo |
| LA-019-14 | ✅ | ChangeDetectionStrategy.Default en ExportPanelComponent |
| LA-019-05 | ✅ | ng build --configuration=production en CI |
| LA-019-09 | ✅ | ExportService URL en environment.ts Y environment.prod.ts |

---

*Generado por SOFIA v2.3 · Architect · LLD Frontend · Sprint 20 · 2026-03-30*
