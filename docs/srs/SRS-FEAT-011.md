# SRS-FEAT-011 — Software Requirements Specification
# Frontend Angular Dashboard + Exportación PDF/Excel — BankPortal / Banco Meridian

## Metadata

| Campo | Valor |
|---|---|
| Documento | SRS-FEAT-011 |
| Versión | 1.0 |
| Feature | FEAT-011 |
| Sprint | 13 |
| Autor | SOFIA Requirements Analyst Agent |
| Fecha | 2026-03-22 |
| Estado | PENDING APPROVAL — Gate 2 |
| Jira Epic | SCRUM-34 |

---

## 1. Introducción

### 1.1 Propósito

Especifica los requerimientos de FEAT-011 — la capa frontend Angular del Dashboard
Analítico y la funcionalidad de exportación del dashboard a PDF y Excel. Complementa
el backend entregado en Sprint 12 (FEAT-010) y salda la deuda técnica RV-011/012.

### 1.2 Documentos relacionados

| Documento | Relación |
|---|---|
| SRS-FEAT-010 | Backend dashboard — endpoints consumidos |
| LLD-013 | Contratos API y DTOs del dashboard |
| ADR-019 | Estrategia caché categorías |
| CR-FEAT-010-sprint12 | RV-011/012 — origen de DEBT-020/021 |

---

## 2. Requerimientos funcionales

### RF-1101: Angular app base + routing + AuthGuard

**US:** US-1101 | **Prioridad:** Must Have

El proyecto Angular 17 debe tener `angular.json`, routing principal y un `AuthGuard`
que proteja `/dashboard` redirigiendo a `/login` si no hay JWT en localStorage.

**Endpoints frontend:**
```
/login        → LoginComponent (placeholder existente)
/dashboard    → DashboardComponent (lazy-loaded DashboardModule)
/             → redirect → /dashboard
```

**Aceptación:**
- `angular.json` válido · `ng build` produce dist sin errores
- Navegación a `/dashboard` sin token → redirige a `/login`
- Navegación a `/dashboard` con token → carga el dashboard

---

### RF-1102: SummaryCards + skeleton loaders

**US:** US-1102 | **Prioridad:** Must Have

`SummaryCardsComponent` consume `GET /api/v1/dashboard/summary` y muestra tres
tarjetas: Ingresos del mes, Gastos del mes, Saldo neto. Mientras carga muestra
skeleton loaders. Si falla muestra mensaje de error sin romper la app.

**UI:**
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Ingresos   │  │   Gastos    │  │ Saldo neto  │
│  3.500,00 € │  │  2.150,75 € │  │  1.349,25 € │
└─────────────┘  └─────────────┘  └─────────────┘
```

**Formato:** `#.###,## €` (locale es-ES)

---

### RF-1103: CategoriesChart donut + TopMerchants

**US:** US-1103 | **Prioridad:** Must Have

`CategoriesChartComponent` — gráfico donut Chart.js con los 5 colores de categoría.
`TopMerchantsComponent` — lista con los top 5 comercios ordenados por importe DESC.
Ambos consumen sus endpoints con el período actual por defecto.

**Paleta de colores:**
```
ALIMENTACION → #4CAF50 (verde)
TRANSPORTE   → #2196F3 (azul)
SERVICIOS    → #FF9800 (naranja)
OCIO         → #9C27B0 (morado)
OTROS        → #9E9E9E (gris)
```

---

### RF-1104: EvolutionChart barras + MonthComparison

**US:** US-1104 | **Prioridad:** Must Have

`EvolutionChartComponent` — gráfico de barras Chart.js con 6 meses de evolución.
Dos series: Ingresos (azul) y Gastos (rojo). Eje X: meses en formato `MMM-YY`.

`MonthComparisonComponent` — muestra variación porcentual con icono:
- ↑ rojo si gastos aumentaron
- ↓ verde si gastos disminuyeron
- `—` si no hay mes anterior

---

### RF-1105: BudgetAlerts banner

**US:** US-1105 | **Prioridad:** Should Have

`BudgetAlertsComponent` — banner amarillo/naranja en la parte superior del dashboard
cuando `usedPercent ≥ 80`. Desaparece si no hay alertas activas. Actualización
en tiempo real via SSE (reutiliza el canal SSE existente del proyecto).

---

### RF-1106: DashboardService + integración API real

**US:** US-1106 | **Prioridad:** Must Have

`DashboardService` con `HttpClient` llamando a todos los endpoints del dashboard.
Manejo de errores centralizado con `catchError` → objeto vacío seguro (no propaga
excepciones a los componentes). Interceptor HTTP inyecta JWT desde localStorage.

```typescript
// Todos los métodos devuelven Observable<T | null> — null en caso de error
getSummary(period?: string): Observable<DashboardSummary | null>
getCategories(period?: string): Observable<SpendingCategory[] | null>
getTopMerchants(period?: string, limit?: number): Observable<TopMerchant[] | null>
getEvolution(months?: number): Observable<MonthlyEvolution[] | null>
getComparison(): Observable<MonthComparison | null>
getAlerts(): Observable<BudgetAlert[] | null>
```

---

### RF-1107: Exportación PDF del dashboard

**US:** US-1107 | **Prioridad:** Must Have

Nuevo endpoint backend que genera un PDF del dashboard del período solicitado.

```
GET /api/v1/dashboard/export/pdf?period=current_month
Authorization: Bearer {JWT}

Response: application/pdf
Content-Disposition: attachment; filename="dashboard-2026-03.pdf"
```

**Contenido del PDF:**
- Cabecera: logo Banco Meridian + "Dashboard Analítico — Marzo 2026"
- Sección 1: Resumen financiero (tabla 3 columnas)
- Sección 2: Gastos por categoría (tabla + % del total)
- Sección 3: Top 5 comercios

**Librería backend:** OpenPDF (LGPL) — ya en pom.xml desde Sprint 7.

---

### RF-1108: Exportación Excel del dashboard

**US:** US-1108 | **Prioridad:** Must Have

```
GET /api/v1/dashboard/export/excel?period=current_month
Authorization: Bearer {JWT}

Response: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="dashboard-2026-03.xlsx"
```

**Estructura del Excel:**
- Hoja 1 "Resumen": período, ingresos, gastos, saldo neto
- Hoja 2 "Categorías": categoría, importe, %, nº transacciones
- Hoja 3 "Evolución": año, mes, ingresos, gastos, saldo neto (6 meses)

**Formato celdas importe:** `#,##0.00 €`
**Librería:** Apache POI 5.x (añadir a pom.xml).

---

### RF-1109: DEBT-020 — resolvePeriod() validación YYYY-MM

**DEBT:** DEBT-020 | **Prioridad:** Must Have

Añadir validación de formato en el caso `default` del switch de `resolvePeriod()`:

```java
default -> {
    if (!param.matches("\\d{4}-\\d{2}"))
        throw new IllegalArgumentException(
            "Periodo invalido: " + param + " — usar YYYY-MM, current_month o previous_month");
    yield param;
}
```

El `GlobalExceptionHandler` existente mapeará `IllegalArgumentException` → HTTP 400.

---

### RF-1110: DEBT-021 — Imports explícitos en DashboardController

**DEBT:** DEBT-021 | **Prioridad:** Must Have

Sustituir los wildcard imports por imports explícitos:

```java
// ANTES:
import com.experis.sofia.bankportal.dashboard.application.*;
import com.experis.sofia.bankportal.dashboard.application.dto.*;

// DESPUÉS: imports explícitos de las 5 clases de application + 6 DTOs
```

---

## 3. Requerimientos no funcionales

| ID | Categoría | Requisito |
|---|---|---|
| RNF-F11-001 | Rendimiento | Dashboard Angular carga en ≤ 2s (LCP) con lazy loading activo |
| RNF-F11-002 | Bundle | Módulo dashboard < 150KB gzipped |
| RNF-F11-003 | Accesibilidad | Gráficos con `aria-label` descriptivo · contraste ≥ 4.5:1 (WCAG 2.1 AA) |
| RNF-F11-004 | PDF | Generación ≤ 3s · tamaño ≤ 500KB |
| RNF-F11-005 | Excel | Generación ≤ 2s · formato moneda correcto |
| RNF-F11-006 | Seguridad | JWT en header Authorization para exportaciones · nunca en URL |

---

## 4. Requerimientos de integración

### RI-F11-001: CORS backend

El backend debe aceptar requests desde `http://localhost:4201` en desarrollo.
Añadir `@CrossOrigin` en `DashboardController` o configurar `CorsConfigurationSource`
global en `SecurityConfig`.

### RI-F11-002: Nuevas dependencias

**Frontend (package.json):**
```json
"ng2-charts": "^5.0.0",
"chart.js": "^4.4.0"
```

**Backend (pom.xml):**
```xml
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.3.0</version>
</dependency>
```

---

## 5. RTM

| Req. | US/DEBT | Endpoint / Componente | Tests |
|---|---|---|---|
| RF-1101 App base | US-1101 | angular.json · routing · AuthGuard | AuthGuard spec |
| RF-1102 SummaryCards | US-1102 | SummaryCardsComponent | summary.spec.ts |
| RF-1103 CategoriesChart | US-1103 | CategoriesChartComponent | categories.spec.ts |
| RF-1104 EvolutionChart | US-1104 | EvolutionChartComponent | evolution.spec.ts |
| RF-1105 BudgetAlerts | US-1105 | BudgetAlertsComponent | alerts.spec.ts |
| RF-1106 DashboardService | US-1106 | DashboardService | dashboard.service.spec.ts |
| RF-1107 Export PDF | US-1107 | GET /api/v1/dashboard/export/pdf | DashboardExportUseCaseTest |
| RF-1108 Export Excel | US-1108 | GET /api/v1/dashboard/export/excel | DashboardExportUseCaseTest |
| RF-1109 DEBT-020 | DEBT-020 | DashboardSummaryUseCase | DashboardSummaryUseCaseTest |
| RF-1110 DEBT-021 | DEBT-021 | DashboardController | (refactor, sin lógica nueva) |

---

*SOFIA Requirements Analyst Agent — Step 2*
*CMMI Level 3 — RD SP 1.1 · RD SP 2.1 · RD SP 3.1*
*BankPortal Sprint 13 — FEAT-011 — 2026-03-22 — v1.0 PENDING APPROVAL*
