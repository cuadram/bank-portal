# FEAT-011 — Frontend Angular Dashboard + Exportación PDF/Excel

## Metadata

| Campo | Valor |
|---|---|
| Feature ID | FEAT-011 |
| Proyecto | BankPortal — Banco Meridian |
| Sprint | 13 |
| Rama git | `feature/FEAT-011-sprint13` |
| Stack | Angular 17 + Chart.js 4 + ng2-charts (frontend) · Java 21 (backend exportación) |
| Release objetivo | v1.13.0 |
| Fecha | 2026-03-22 |

---

## Descripción de negocio

Sprint 13 completa la capa frontend del Dashboard Analítico iniciado en Sprint 12,
implementando el módulo Angular con gráficos interactivos (Chart.js) y añade la
funcionalidad de exportación del dashboard a PDF y Excel. También salda la deuda
técnica menor pendiente del Code Review de Sprint 12.

---

## Alcance

### Incluido
- Angular 17 app base con routing + AuthGuard
- Módulo `DashboardModule` lazy-loaded con 5 componentes + Chart.js
- Exportación dashboard a PDF (backend — iText/OpenPDF)
- Exportación dashboard a Excel (backend — Apache POI)
- DEBT-020: RV-011 — `resolvePeriod()` validación formato YYYY-MM
- DEBT-021: RV-012 — wildcard imports en `DashboardController`

### Excluido
- Login UI Angular (ya existe en Sprint 1 placeholder)
- Presupuestos personalizados por categoría (FEAT-012)
- Recomendaciones de ahorro con IA (FEAT-012)

---

## User Stories

| ID | Título | SP | Prioridad | Semana |
|---|---|---|---|---|
| DEBT-020 | resolvePeriod() validación YYYY-MM | 1 | Must Have | S1 día 1 |
| DEBT-021 | Expandir wildcard imports DashboardController | 1 | Must Have | S1 día 1 |
| US-1101 | Angular app base + routing + AuthGuard | 3 | Must Have | S1 |
| US-1102 | DashboardModule — SummaryCards + skeleton loaders | 3 | Must Have | S1 |
| US-1103 | CategoriesChart — donut Chart.js | 3 | Must Have | S1 |
| US-1104 | EvolutionChart — barras Chart.js + MonthComparison | 3 | Must Have | S2 |
| US-1105 | BudgetAlerts — banner 80% presupuesto | 2 | Should Have | S2 |
| US-1106 | DashboardService + integración API real | 2 | Must Have | S2 |
| US-1107 | Exportación PDF del dashboard (backend) | 3 | Must Have | S2 |
| US-1108 | Exportación Excel del dashboard (backend) | 3 | Must Have | S2 |

**Total: 24 SP**

---

## Gherkin highlights

### US-1102 — SummaryCards con skeleton loaders

```gherkin
Escenario 1: Dashboard carga con datos reales
  Dado que el usuario accede a /dashboard
  Cuando la página carga
  Entonces muestra tarjetas con totalIncome, totalExpenses y netBalance
  Y los valores son numéricos con formato moneda €

Escenario 2: Estado de carga → skeleton loaders
  Dado que las llamadas API están en curso
  Cuando la página carga
  Entonces muestra placeholders animados (no pantalla en blanco)

Escenario 3: Error de red → mensaje informativo
  Dado que el backend no responde
  Cuando el dashboard intenta cargar
  Entonces muestra "No se pueden cargar los datos" sin romper la app
```

### US-1107 — Exportación PDF

```gherkin
Escenario 1: Exportación PDF del mes actual
  Dado que el usuario está en el dashboard
  Cuando hace clic en "Exportar PDF"
  Entonces descarga un PDF con resumen financiero + tabla de categorías

Escenario 2: PDF con nombre descriptivo
  Entonces el archivo se llama dashboard-YYYY-MM.pdf
```

### US-1108 — Exportación Excel

```gherkin
Escenario 1: Exportación Excel del mes actual
  Cuando hace clic en "Exportar Excel"
  Entonces descarga un .xlsx con hoja Resumen + hoja Categorías + hoja Evolución

Escenario 2: Excel con formato moneda en columnas de importe
  Entonces las celdas de importe tienen formato #,##0.00 €
```

---

## Riesgos

| ID | Riesgo | P | I | Mitigación |
|---|---|---|---|---|
| R-F11-001 | angular.json ausente — app base desde cero | A | A | US-1101 es día 1 Semana 1 con estructura mínima viable |
| R-F11-002 | Chart.js renderiza fuera del ciclo Angular | M | M | ng2-charts@5 abstrae el ciclo correctamente |
| R-F11-003 | iText/OpenPDF — licencia AGPL | B | M | OpenPDF (fork LGPL) — ya en pom.xml Sprint anteriores |
| R-F11-004 | Apache POI — tamaño bundle backend | B | B | Solo servidor — no afecta frontend |

---

## Definition of Ready ✅

- [x] 10 ítems con Gherkin
- [x] 24 SP = capacidad acordada
- [x] DEBTs identificadas (día 1)
- [x] Endpoints backend dashboard ya disponibles (Sprint 12)
- [x] ng2-charts@5 + chart.js@4 identificados
- [x] OpenPDF + Apache POI como librerías de exportación

---

*SOFIA Scrum Master Agent — BankPortal Sprint 13 — 2026-03-22*
*CMMI Level 3 — PP SP 2.1 · PP SP 2.2*
