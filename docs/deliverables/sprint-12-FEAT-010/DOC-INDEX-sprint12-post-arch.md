# Índice post-arquitectura — BankPortal Sprint 12 — FEAT-010
## Dashboard Analítico de Gastos y Movimientos

**Generado por:** SOFIA Documentation Agent — Step 3b (automático)
**Fecha:** 2026-03-22 | **Sprint:** 12 | **Feature:** FEAT-010

---

## Artefactos de arquitectura aprobados (Gate 3)

| Artefacto | Ruta | Aprobado |
|---|---|---|
| HLD-FEAT-010 | `docs/architecture/hld/HLD-FEAT-010.md` | ✅ Tech Lead 11:17 |
| LLD-013 Dashboard Analytics | `docs/architecture/lld/LLD-013-dashboard-analytics.md` | ✅ |
| ADR-019 Cache Strategy | `docs/architecture/hld/ADR-019-dashboard-cache-strategy.md` | ✅ |

## Guía de implementación para el Developer (Step 4)

### Orden de implementación recomendado

**Día 1 — DEBTs (3 SP):**
1. `DEBT-017`: `BankCoreRestAdapter.getAvailableBalance()` → `Objects.requireNonNullElse`
2. `DEBT-018`: Crear `bill/domain/BillLookupResult.java` → actualizar imports en 3 clases
3. `DEBT-019`: Eliminar `validateReference()` de `BillLookupAndPayUseCase`

**Semana 1 — Backend (9 SP):**
4. Flyway `V13__dashboard_analytics.sql`
5. Domain: `SpendingCategory` enum + `DashboardRepositoryPort` + `BudgetAlertRepositoryPort`
6. Application: `SpendingCategorizationEngine` → `DashboardSummaryUseCase` → `SpendingCategoryService`
7. Application: `MonthlyEvolutionUseCase` → `MonthComparisonUseCase` → `BudgetAlertService`
8. Infrastructure: `DashboardJpaAdapter` (implementa `DashboardRepositoryPort`)
9. API: `DashboardController` (6 endpoints GET)
10. Tests unitarios: 1 suite por use case (mínimo 3 tests cada una)

**Semana 2 — Frontend (2 SP):**
11. `ng2-charts` en `package.json` frontend
12. `DashboardModule` lazy-loaded + `DashboardService`
13. 5 componentes Angular con skeleton loaders y manejo de error

### Notas técnicas críticas

- **Paquete dashboard:** `com.experis.sofia.bankportal.dashboard.*`
- **Categorización:** `SpendingCategorizationEngine` usa `text.toLowerCase().contains(keyword)` — sin regex
- **Caché:** `spending_categories` con `UNIQUE(user_id, period, category)` — upsert vía `ON CONFLICT DO UPDATE`
- **Período:** siempre en formato `YYYY-MM` internamente — `resolvePeriod()` convierte `current_month`/`previous_month`
- **Evolución:** iterar `YearMonth.now().minusMonths(i)` — siempre devolver exactamente N elementos
- **Variación %:** proteger división por cero cuando `previous = 0` → devolver `null`
- **DEBT-018:** el record `BillLookupResult` se mueve como clase top-level — actualizar imports en `BillLookupAndPayUseCase`, `BillController` y `BillCoreAdapter`

---

*SOFIA Documentation Agent — Step 3b — BankPortal Sprint 12 — 2026-03-22*
