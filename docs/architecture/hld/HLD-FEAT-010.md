# HLD-FEAT-010 — Dashboard Analítico de Gastos y Movimientos
# BankPortal / Banco Meridian

## Metadata

| Campo | Valor |
|---|---|
| Feature | FEAT-010 |
| Sprint | 12 |
| Stack | Java 21 / Spring Boot 3.3.4 (backend) + Angular 17 + Chart.js 4 (frontend) |
| Versión | 1.0 |
| Estado | PENDING APPROVAL — Gate 3 Tech Lead |
| Fecha | 2026-03-22 |

---

## Análisis de impacto en monorepo

| Módulo | Impacto | Acción |
|---|---|---|
| `apps/backend-2fa` | Nuevo módulo `dashboard/` | 5 endpoints + 4 use cases + categorización |
| `apps/frontend-portal` | Nuevo módulo `dashboard/` | 4 componentes Angular + Chart.js |
| `transfer/` · `bill/` | Sin cambios en lógica — solo lectura | Queries de agregación sobre sus tablas |
| `BankCoreRestAdapter` | Null check (DEBT-017) | 1 línea con `Objects.requireNonNullElse` |
| `BillPaymentPort` | Extracción `BillLookupResult` (DEBT-018) | Nueva clase top-level en domain |
| `BillLookupAndPayUseCase` | Eliminar `validateReference()` (DEBT-019) | Simplificación |
| Flyway | V13 — 2 tablas nuevas | `spending_categories` + `budget_alerts` |

**ADR requerido:** ADR-019 — Estrategia de cálculo del dashboard (on-demand vs caché materializada).

---

## Contexto del sistema — C4 Nivel 1

```mermaid
C4Context
  title BankPortal — FEAT-010 Dashboard Analítico

  Person(user, "Usuario autenticado", "Cliente Banco Meridian")

  System(backend, "BankPortal Backend", "Spring Boot 3.3 / Java 21")
  System(frontend, "BankPortal Frontend", "Angular 17 + Chart.js 4")

  System_Ext(postgres, "PostgreSQL 16", "transfers · bill_payments · spending_categories · budget_alerts")
  System_Ext(redis, "Redis 7", "Cache de resúmenes calculados (TTL 1h)")
  System_Ext(smtp, "SMTP / MailHog STG", "Email alertas de presupuesto")

  Rel(user, frontend, "Accede al dashboard", "HTTPS")
  Rel(frontend, backend, "Consume API dashboard", "HTTPS / JWT RS256")
  Rel(backend, postgres, "Agrega datos financieros", "JDBC")
  Rel(backend, redis, "Cache de resúmenes", "Redis Protocol")
  Rel(backend, smtp, "Notificación alerta presupuesto", "SMTP")
```

---

## Componentes nuevos — C4 Nivel 2

```mermaid
C4Container
  title Módulo dashboard — nuevos componentes Sprint 12

  Container(ctrl, "DashboardController", "@RestController", "5 endpoints GET /api/v1/dashboard/*")
  Container(sum_uc, "DashboardSummaryUseCase", "@Service", "US-1001: resumen financiero por período")
  Container(cat_uc, "SpendingCategoryService", "@Service", "US-1002: categorización + top comercios")
  Container(evo_uc, "MonthlyEvolutionUseCase", "@Service", "US-1003: serie temporal N meses")
  Container(cmp_uc, "MonthComparisonUseCase", "@Service", "US-1004: comparativa mes vs mes")
  Container(alt_uc, "BudgetAlertService", "@Service", "US-1005: alertas 80% presupuesto")
  Container(cat_engine, "SpendingCategorizationEngine", "@Component", "Categorización por keywords — ADR-019")
  Container(dash_repo, "DashboardRepositoryPort", "Interface", "Puerto salida — queries de agregación")

  Rel(ctrl, sum_uc, "delega")
  Rel(ctrl, cat_uc, "delega")
  Rel(ctrl, evo_uc, "delega")
  Rel(ctrl, cmp_uc, "delega")
  Rel(ctrl, alt_uc, "delega")
  Rel(cat_uc, cat_engine, "usa")
  Rel(sum_uc, dash_repo, "consulta")
  Rel(cat_uc, dash_repo, "consulta")
  Rel(evo_uc, dash_repo, "consulta")
  Rel(cmp_uc, sum_uc, "reutiliza")
```

---

## Flujo de carga del Dashboard

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuario
  participant FE as Angular DashboardComponent
  participant BE as DashboardController
  participant SU as DashboardSummaryUseCase
  participant SC as SpendingCategoryService
  participant DB as PostgreSQL

  U->>FE: Navega a /dashboard
  FE->>FE: Muestra skeleton loaders
  par Carga en paralelo
    FE->>BE: GET /api/v1/dashboard/summary?period=current_month
    BE->>SU: getSummary(userId, period)
    SU->>DB: SELECT SUM(amount) FROM transfers + bill_payments WHERE user_id AND period
    DB-->>SU: agregados
    SU-->>BE: DashboardSummaryDto
    BE-->>FE: 200 { totalIncome, totalExpenses, netBalance, count }
  and
    FE->>BE: GET /api/v1/dashboard/categories?period=current_month
    BE->>SC: getCategories(userId, period)
    SC->>DB: SELECT * FROM spending_categories WHERE user_id AND period
    alt Caché válida en spending_categories
      DB-->>SC: datos categorizados
    else Sin caché
      SC->>DB: SELECT concept, issuer, SUM(amount) FROM transfers + bill_payments
      SC->>SC: categorizar por keywords (SpendingCategorizationEngine)
      SC->>DB: INSERT INTO spending_categories (upsert)
    end
    SC-->>FE: [{ category, amount, percentage, count }]
  and
    FE->>BE: GET /api/v1/dashboard/evolution?months=6
  and
    FE->>BE: GET /api/v1/dashboard/comparison
  end
  FE->>FE: Renderiza gráficos Chart.js
  FE-->>U: Dashboard completo visible
```

---

## Estructura de paquetes — nuevo módulo dashboard

```
apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/
└── dashboard/
    ├── domain/
    │   ├── DashboardRepositoryPort.java   # Puerto salida — queries agregación
    │   ├── SpendingCategory.java           # Enum: ALIMENTACION, TRANSPORTE...
    │   └── BudgetAlertRepositoryPort.java  # Puerto salida — alertas
    ├── application/
    │   ├── DashboardSummaryUseCase.java    # US-1001
    │   ├── SpendingCategoryService.java    # US-1002 + categorización
    │   ├── MonthlyEvolutionUseCase.java    # US-1003
    │   ├── MonthComparisonUseCase.java     # US-1004 (reutiliza Summary)
    │   ├── BudgetAlertService.java         # US-1005
    │   ├── SpendingCategorizationEngine.java # Categorización por keywords
    │   └── dto/
    │       ├── DashboardSummaryDto.java
    │       ├── SpendingCategoryDto.java
    │       ├── TopMerchantDto.java
    │       ├── MonthlyEvolutionDto.java
    │       ├── MonthComparisonDto.java
    │       └── BudgetAlertDto.java
    ├── infrastructure/
    │   └── DashboardJpaAdapter.java        # Implementa DashboardRepositoryPort
    └── api/
        └── DashboardController.java        # 5 endpoints GET

apps/frontend-portal/src/app/features/
└── dashboard/
    ├── dashboard.module.ts                 # Lazy-loaded module
    ├── dashboard.component.ts              # Página principal
    ├── components/
    │   ├── summary-cards/                  # Ingresos/Gastos/Saldo
    │   ├── categories-chart/               # Donut Chart.js
    │   ├── evolution-chart/                # Bar Chart.js
    │   ├── month-comparison/               # Comparativa visual
    │   └── budget-alerts/                  # Banner de alerta
    └── services/
        └── dashboard.service.ts            # HTTP calls a API
```

---

## ADR generado

| ADR | Título | Estado |
|---|---|---|
| ADR-019 | Estrategia cálculo dashboard: on-demand con caché materializada en BD | Propuesto |

---

## Contrato OpenAPI v1.9.0 (nuevos endpoints)

| Método | Endpoint | Descripción |
|---|---|---|
| GET | /api/v1/dashboard/summary | Resumen financiero por período |
| GET | /api/v1/dashboard/categories | Gastos por categoría |
| GET | /api/v1/dashboard/top-merchants | Top comercios/emisores |
| GET | /api/v1/dashboard/evolution | Serie temporal N meses |
| GET | /api/v1/dashboard/comparison | Comparativa mes vs anterior |
| GET | /api/v1/dashboard/alerts | Alertas de presupuesto activas |

---

*SOFIA Architect Agent — Step 3 — BankPortal Sprint 12 — FEAT-010 — 2026-03-22 — v1.0 PENDING APPROVAL*
