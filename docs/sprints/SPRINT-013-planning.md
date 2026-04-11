# Sprint 13 — Planning

## Metadata CMMI (PP SP 2.1)

| Campo | Valor |
|---|---|
| Sprint | 13 |
| Feature | FEAT-011 — Frontend Angular Dashboard + Exportación PDF/Excel |
| Sprint Goal | Completar la experiencia visual del Dashboard Analítico con Angular + Chart.js, añadir exportación a PDF y Excel, y saldar la deuda técnica menor del Code Review Sprint 12 |
| Período | 2026-03-23 → 2026-04-06 (14 días) |
| Capacidad | 24 SP |
| Release objetivo | v1.13.0 |
| Rama | `feature/FEAT-011-sprint13` |
| Jira Epic | pendiente — Gate 1 |

---

## Velocidad y capacidad (PP SP 2.2)

| Sprint | SP | Feature |
|---|---|---|
| Sprint 10 | 24 | FEAT-008 Transferencias |
| Sprint 11 | 20 | FEAT-009 Core real + Pagos |
| Sprint 12 | 24 | FEAT-010 Dashboard backend |
| **Sprint 13** | **24** | **FEAT-011 Frontend + Exportación** |
| Media 12 sprints | ~23.6 | — |

---

## Sprint Backlog

| # | ID | Título | SP | Prioridad | Semana |
|---|---|---|---|---|---|
| 1 | DEBT-020 | resolvePeriod() validación YYYY-MM | 1 | Must Have | S1 día 1 |
| 2 | DEBT-021 | Wildcard imports → explícitos en DashboardController | 1 | Must Have | S1 día 1 |
| 3 | US-1101 | Angular app base + routing + AuthGuard | 3 | Must Have | S1 |
| 4 | US-1102 | SummaryCards + skeleton loaders | 3 | Must Have | S1 |
| 5 | US-1103 | CategoriesChart donut + TopMerchants list | 3 | Must Have | S1 |
| 6 | US-1104 | EvolutionChart barras + MonthComparison | 3 | Must Have | S2 |
| 7 | US-1105 | BudgetAlerts banner + integración SSE | 2 | Should Have | S2 |
| 8 | US-1106 | DashboardService HTTP + error handling | 2 | Must Have | S2 |
| 9 | US-1107 | Exportación PDF dashboard (backend) | 3 | Must Have | S2 |
| 10 | US-1108 | Exportación Excel dashboard (backend) | 3 | Must Have | S2 |
| | | **TOTAL** | **24** | | |

---

## Distribución semanal

### Semana 1 — 11 SP · Angular base + visualización categorías
- DEBT-020/021 (2 SP · día 1)
- US-1101 Angular app base (3 SP)
- US-1102 SummaryCards (3 SP)
- US-1103 CategoriesChart donut (3 SP)

### Semana 2 — 13 SP · Evolución + exportación
- US-1104 EvolutionChart + MonthComparison (3 SP)
- US-1105 BudgetAlerts (2 SP)
- US-1106 DashboardService integración real (2 SP)
- US-1107 Exportación PDF backend (3 SP)
- US-1108 Exportación Excel backend (3 SP)

---

## Pre-requisitos Día 1

- [ ] DEBT-020/021: 2 fixes rápidos backend
- [ ] `angular.json` + `package.json` Angular 17 configurados
- [ ] `ng2-charts@5` + `chart.js@4` en devDependencies
- [ ] Endpoints `/api/v1/dashboard/*` accesibles desde el frontend (CORS)

---

*SOFIA Scrum Master Agent — Step 1 Gate 1*
*CMMI Level 3 — PP SP 2.1 · PP SP 2.2 · PMC SP 1.1*
*BankPortal Sprint 13 — 2026-03-22*
