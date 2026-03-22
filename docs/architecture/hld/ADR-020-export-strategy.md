# ADR-020 — Estrategia de exportación: generación server-side (backend)

## Metadata

| Campo | Valor |
|---|---|
| ADR | ADR-020 |
| Feature | FEAT-011 / US-1107/1108 |
| Fecha | 2026-03-22 |
| Estado | Propuesto |

---

## Contexto

La exportación del dashboard a PDF y Excel puede implementarse de dos formas:

1. **Client-side**: Angular genera el archivo en el navegador (jsPDF, SheetJS)
2. **Server-side**: El backend genera el archivo y lo devuelve como attachment

---

## Decisión

**Se adopta generación server-side en el backend Java.**

---

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Server-side Java** (elegido) | Librería madura (OpenPDF/POI) · formato profesional · sin límites de memoria del navegador · el servidor ya tiene los datos | Latencia de red para la descarga |
| Client-side Angular (jsPDF) | Sin round-trip de red | Renderizado inconsistente entre navegadores · bundle Angular crece · jsPDF produce PDFs básicos |
| Client-side Angular (SheetJS) | Rápido para Excel simple | Licencia dual (pago para uso comercial) |

---

## Implementación

```
GET /api/v1/dashboard/export/pdf?period=2026-03
→ DashboardExportController
  → DashboardExportUseCase (reutiliza DashboardSummaryUseCase + SpendingCategoryService)
    → PdfReportGenerator (OpenPDF — LGPL)
  → Response: application/pdf · Content-Disposition: attachment
```

## Consecuencias

**Positivas:**
- PDF con estilos corporativos Banco Meridian (#1B3A6B) consistentes
- Excel con formato moneda `#,##0.00 €` correcto desde el servidor
- Frontend solo necesita un `<a>` con href o blob download — sin lógica de generación
- Los datos ya están en el servidor — sin segunda llamada API desde el cliente

**Trade-offs:**
- 2 endpoints nuevos en el backend — mínimo overhead
- Apache POI añade ~8MB al JAR — aceptable

---

*ADR-020 — SOFIA Architect Agent — BankPortal Sprint 13 — 2026-03-22*
