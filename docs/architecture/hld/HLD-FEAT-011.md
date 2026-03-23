# HLD-FEAT-011 — Frontend Angular Dashboard + Exportación PDF/Excel
# BankPortal / Banco Meridian

## Metadata

| Campo | Valor |
|---|---|
| Feature | FEAT-011 |
| Sprint | 13 |
| Stack | Angular 17 + Chart.js 4 (frontend) · Java 21 + OpenPDF + Apache POI (backend) |
| Versión | 1.0 |
| Estado | PENDING APPROVAL — Gate 3 Tech Lead |
| Fecha | 2026-03-22 |

---

## Análisis de impacto en monorepo

| Módulo | Impacto | Acción |
|---|---|---|
| `apps/frontend-portal/` | Angular app completa desde cero | US-1101→1106 |
| `apps/backend-2fa/dashboard/` | 2 endpoints nuevos + exportación | US-1107/1108 |
| `DashboardSummaryUseCase` | DEBT-020 validación período | 1 guard |
| `DashboardController` | DEBT-021 imports explícitos | refactor |
| `pom.xml` | Apache POI 5.3.0 | nueva dependencia |
| `package.json` frontend | ng2-charts@5 + chart.js@4 | nuevas dependencias |

**ADR requerido:** ADR-020 — Estrategia de exportación: generación on-demand en backend vs cliente.

---

## Contexto C4 Nivel 1 — FEAT-011

```mermaid
C4Context
  title BankPortal — FEAT-011 Frontend + Exportación

  Person(user, "Usuario autenticado", "Cliente Banco Meridian")
  System(frontend, "BankPortal Angular 17", "Dashboard visual + exportación")
  System(backend, "BankPortal Backend", "Spring Boot — API + generación PDF/Excel")
  System_Ext(postgres, "PostgreSQL 16", "Datos financieros + spending_categories")

  Rel(user, frontend, "Navega al dashboard", "HTTPS :4201")
  Rel(frontend, backend, "Consume API dashboard + exportación", "HTTPS :8081 / JWT RS256")
  Rel(backend, postgres, "Lee datos para PDF/Excel", "JDBC")
  Rel(frontend, user, "Descarga PDF/Excel", "HTTP attachment")
```

---

## Componentes nuevos — C4 Nivel 2

```mermaid
C4Container
  title FEAT-011 — componentes nuevos

  Container(app, "AppModule", "Angular 17", "Routing principal + interceptor JWT")
  Container(authguard, "AuthGuard", "Angular Guard", "Protege /dashboard — redirige a /login sin JWT")
  Container(dashmod, "DashboardModule", "Angular lazy-loaded", "Todos los componentes del dashboard")
  Container(summary, "SummaryCardsComponent", "Angular", "Tarjetas ingresos/gastos/saldo")
  Container(catcmp, "CategoriesChartComponent", "Angular + Chart.js", "Donut categorías")
  Container(evocmp, "EvolutionChartComponent", "Angular + Chart.js", "Barras 6 meses")
  Container(cmpcmp, "MonthComparisonComponent", "Angular", "Variación % mes vs mes")
  Container(alrtcmp, "BudgetAlertsComponent", "Angular", "Banner 80% presupuesto")
  Container(svc, "DashboardService", "Angular", "HTTP calls + catchError + JWT")
  Container(expctrl, "DashboardExportController", "@RestController", "GET /export/pdf y /export/excel")
  Container(expuc, "DashboardExportUseCase", "@Service", "Orquesta generación PDF/Excel")
  Container(pdfgen, "PdfReportGenerator", "@Component", "OpenPDF — genera bytes PDF")
  Container(xlsxgen, "ExcelReportGenerator", "@Component", "Apache POI — genera bytes XLSX")

  Rel(app, authguard, "usa en rutas")
  Rel(app, dashmod, "lazy load en /dashboard")
  Rel(dashmod, summary, "incluye")
  Rel(dashmod, catcmp, "incluye")
  Rel(dashmod, evocmp, "incluye")
  Rel(dashmod, alrtcmp, "incluye")
  Rel(dashmod, svc, "inyecta")
  Rel(expctrl, expuc, "delega")
  Rel(expuc, pdfgen, "usa")
  Rel(expuc, xlsxgen, "usa")
  Rel(expuc, svc, "reutiliza DashboardSummaryUseCase")
```

---

## Flujo de carga del dashboard Angular

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario
  participant R as Angular Router
  participant G as AuthGuard
  participant D as DashboardComponent
  participant S as DashboardService
  participant BE as Backend

  U->>R: Navega a /dashboard
  R->>G: canActivate()
  G->>G: Lee JWT de localStorage
  alt Sin JWT
    G-->>R: redirect /login
  else Con JWT válido
    G-->>R: true
    R->>D: Carga DashboardComponent
    D->>D: Muestra skeleton loaders
    par 4 llamadas paralelas
      D->>S: getSummary()
      S->>BE: GET /api/v1/dashboard/summary
      BE-->>S: DashboardSummaryDto
      S-->>D: Observable<DashboardSummary>
    and
      D->>S: getCategories()
      S->>BE: GET /api/v1/dashboard/categories
      BE-->>D: SpendingCategoryDto[]
    and
      D->>S: getEvolution()
      S->>BE: GET /api/v1/dashboard/evolution
      BE-->>D: MonthlyEvolutionDto[]
    and
      D->>S: getAlerts()
      S->>BE: GET /api/v1/dashboard/alerts
      BE-->>D: BudgetAlertDto[]
    end
    D->>D: Renderiza Chart.js + tarjetas
    D-->>U: Dashboard visible
  end
```

---

## Flujo de exportación PDF/Excel

```mermaid
sequenceDiagram
  actor U as Usuario
  participant FE as Angular
  participant BE as DashboardExportController
  participant UC as DashboardExportUseCase
  participant GEN as PdfReportGenerator/ExcelReportGenerator
  participant DB as PostgreSQL

  U->>FE: Clic "Exportar PDF"
  FE->>BE: GET /api/v1/dashboard/export/pdf?period=2026-03 (JWT header)
  BE->>UC: exportPdf(userId, period)
  UC->>DB: DashboardSummaryUseCase.getSummary()
  UC->>DB: SpendingCategoryService.getCategories()
  UC->>DB: repo.findTopMerchants()
  UC->>GEN: generate(data) → byte[]
  GEN-->>BE: byte[]
  BE-->>FE: application/pdf attachment
  FE-->>U: Descarga dashboard-2026-03.pdf
```

---

## Estructura de paquetes nuevos

### Backend
```
dashboard/
├── api/
│   ├── DashboardController.java        (DEBT-021: imports explícitos)
│   └── DashboardExportController.java  (US-1107/1108: 2 endpoints export)
├── application/
│   ├── DashboardSummaryUseCase.java    (DEBT-020: validación período)
│   ├── DashboardExportUseCase.java     (US-1107/1108: orquestador)
│   ├── PdfReportGenerator.java         (US-1107: OpenPDF)
│   └── ExcelReportGenerator.java       (US-1108: Apache POI)
```

### Frontend
```
apps/frontend-portal/
├── angular.json
├── package.json                        (ng2-charts + chart.js)
├── src/
│   ├── app/
│   │   ├── app.module.ts
│   │   ├── app-routing.module.ts       (AuthGuard en /dashboard)
│   │   ├── core/
│   │   │   ├── guards/auth.guard.ts
│   │   │   └── interceptors/jwt.interceptor.ts
│   │   └── features/
│   │       └── dashboard/
│   │           ├── dashboard.module.ts
│   │           ├── dashboard.component.ts
│   │           ├── components/
│   │           │   ├── summary-cards/
│   │           │   ├── categories-chart/
│   │           │   ├── evolution-chart/
│   │           │   ├── month-comparison/
│   │           │   └── budget-alerts/
│   │           └── services/
│   │               └── dashboard.service.ts
│   └── environments/
│       ├── environment.ts
│       └── environment.prod.ts
```

---

## ADR generado

| ADR | Título |
|---|---|
| ADR-020 | Exportación on-demand en backend: PDF/Excel generados server-side |

---

## Contrato OpenAPI v1.10.0 — nuevos endpoints

| Método | Endpoint | Response |
|---|---|---|
| GET | /api/v1/dashboard/export/pdf | `application/pdf` attachment |
| GET | /api/v1/dashboard/export/excel | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |

Parámetro común: `?period=current_month` (mismos valores que /summary)

---

*SOFIA Architect Agent — Step 3 — BankPortal Sprint 13 — FEAT-011 — 2026-03-22 — v1.0 PENDING APPROVAL*
