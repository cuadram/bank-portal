# Release Notes — BankPortal v1.13.0
## Sprint 13 — FEAT-011 Frontend Angular Dashboard + Exportación PDF/Excel

**Versión:** v1.13.0 | **Fecha:** 2026-03-22 | **Sprint:** 13 | **Jira:** SCRUM-34

---

## Resumen

BankPortal v1.13.0 completa la capa frontend del Dashboard Analítico con Angular 17 y Chart.js, y añade exportación del dashboard a PDF y Excel directamente desde el portal. El usuario puede ahora visualizar sus gastos por categoría con gráficos interactivos, ver la evolución de 6 meses en un gráfico de barras, comparar el mes actual con el anterior y descargar un informe en PDF o Excel con un solo clic. Se salda también la deuda técnica menor de Sprint 12.

---

## Nuevas funcionalidades

### US-1101 — Angular app base
- `angular.json` + routing + `AuthGuard` que protege `/dashboard` redirigiendo a `/login` sin JWT
- `JwtInterceptor` inyecta `Authorization: Bearer` en todas las requests HTTP

### US-1102 — SummaryCards
- Tarjetas Ingresos / Gastos / Saldo neto con formato moneda `es-ES`
- Skeleton loaders durante carga · mensaje de error si falla la API

### US-1103 — CategoriesChart + TopMerchants
- Gráfico donut Chart.js con 5 categorías y paleta de colores corporativa
- Leyenda interactiva con importe y porcentaje

### US-1104 — EvolutionChart + MonthComparison
- Gráfico de barras con 6 meses — doble serie Ingresos/Gastos
- Variación porcentual con iconos ↑↓ y colores semánticos

### US-1105 — BudgetAlerts
- Banner naranja cuando el gasto supera el 80% del presupuesto mensual

### US-1106 — DashboardService
- `forkJoin` de 5 APIs en paralelo · `catchError → null` en todos los métodos
- `downloadPdf()` / `downloadExcel()` con blob download automático

### US-1107 — Exportación PDF
- `GET /api/v1/dashboard/export/pdf?period=current_month`
- PDF con estilos corporativos Banco Meridian (#1B3A6B): resumen + categorías + top comercios
- Generado con OpenPDF (LGPL)

### US-1108 — Exportación Excel
- `GET /api/v1/dashboard/export/excel?period=current_month`
- Excel con 3 hojas: Resumen · Categorías · Evolución · formato `#,##0.00 €`
- Generado con Apache POI 5.3.0

---

## Deuda técnica resuelta

### DEBT-020 — resolvePeriod() validación YYYY-MM
- `IllegalArgumentException` si el formato no es `YYYY-MM` → HTTP 400 via `GlobalExceptionHandler`

### DEBT-021 — Wildcard imports DashboardController
- 11 imports explícitos — visibilidad completa de dependencias

---

## Notas de despliegue

```bash
# Sin nuevas migraciones Flyway en v1.13.0
# Nuevas dependencias backend (se descargan automáticamente con Maven)
# Nuevas dependencias frontend (requieren npm install)

cd apps/frontend-portal && npm install
ng build --configuration production

# Backend: rebuild Docker
docker compose up -d --build backend
```

---

## Métricas del sprint

| Métrica | Valor |
|---|---|
| Story Points entregados | 24/24 (100%) |
| Tests unitarios nuevos | 6 (DEBT-020) |
| Tests totales acumulados | ~143 |
| Defectos en QA | 0 |
| CVEs críticos | 0 |
| Cobertura Gherkin | 100% (10/10) |
| Velocidad acumulada | ~23.6 SP/sprint (13 sprints · 307 SP) |

---

*BankPortal v1.13.0 — SOFIA DevOps Agent — Sprint 13 — 2026-03-22*
